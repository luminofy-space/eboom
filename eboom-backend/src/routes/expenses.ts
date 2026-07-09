import express, { Request, Response } from "express";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import { db } from "../db/client";
import {
  currencies,
  expenseCategories,
  expensePayments,
  expenses,
  walletCategories,
  wallets,
} from "../db/schema";
import { creditWalletBalance, debitWalletBalance } from "../services/ledgerService";
import { registerWhiteboardNode, unregisterWhiteboardNode } from "../services/whiteboardService";
import { requireCanvasAccess } from "../middleware/canvasAccess";
import { parseRouteParam } from "./routeParams";
import { parseListQueryParams } from "./listQueryParams";
import { ErrorKeys } from "../errors/errorKeys";
import { sendError } from "../errors/sendError";

const router = express.Router({ mergeParams: true });

function parseOptionalDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

router.put("/payments/:paymentId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const paymentId = parseRouteParam(req.params.paymentId);
  if (Number.isNaN(paymentId)) {
    return sendError(res, ErrorKeys.expense.invalidPaymentId, 400);
  }

  const { sourceWalletId, amount, dueDate, paidDate, notes } = req.body;

  const parsedWalletId = Number(sourceWalletId);
  const parsedAmount = Number(amount);

  if (!parsedWalletId || Number.isNaN(parsedWalletId)) {
    return sendError(res, ErrorKeys.validation.walletRequired, 400);
  }

  if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return sendError(res, ErrorKeys.validation.amountPositive, 400);
  }

  try {
    const [existing] = await db
      .select()
      .from(expensePayments)
      .where(eq(expensePayments.id, paymentId));
    if (!existing) return sendError(res, ErrorKeys.expense.paymentNotFound, 404);

    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, existing.expenseId));
    if (!expense || expense.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.expense.paymentNotFound, 404);
    }

    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, parsedWalletId));
    if (!wallet || wallet.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.expense.sourceWalletInvalid, 400);
    }

    const amountStr = String(parsedAmount);
    const parsedDueDate = parseOptionalDate(dueDate);
    const parsedPaidDate = parseOptionalDate(paidDate);

    const updated = await db.transaction(async (tx) => {
      await creditWalletBalance(
        {
          walletId: existing.sourceWalletId,
          currencyId: expense.currencyId,
          amount: String(existing.amount),
        },
        tx
      );

      const [payment] = await tx
        .update(expensePayments)
        .set({
          sourceWalletId: parsedWalletId,
          amount: amountStr,
          dueDate: parsedDueDate,
          paidDate: parsedPaidDate,
          notes: notes || null,
          lastModifiedBy: user.id,
          lastModifiedAt: new Date(),
        })
        .where(eq(expensePayments.id, paymentId))
        .returning();

      await debitWalletBalance(
        {
          walletId: parsedWalletId,
          currencyId: expense.currencyId,
          amount: amountStr,
          allowNegative: false,
        },
        tx
      );

      return payment;
    });

    res.json({ payment: updated });
  } catch (err) {
    console.error("Error updating expense payment:", err);
    const message =
      err instanceof Error && err.message === "Insufficient wallet balance"
        ? "Insufficient wallet balance"
        : "Failed to update expense payment";
    sendError(res, ErrorKeys.common.internal, 500);
  }
});

router.delete(
  "/payments/:paymentId",
  requireCanvasAccess("edit"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const paymentId = parseRouteParam(req.params.paymentId);
    if (Number.isNaN(paymentId)) {
      return sendError(res, ErrorKeys.expense.invalidPaymentId, 400);
    }

    try {
      const [existing] = await db
        .select()
        .from(expensePayments)
        .where(eq(expensePayments.id, paymentId));
      if (!existing) return sendError(res, ErrorKeys.expense.paymentNotFound, 404);

      const [expense] = await db
        .select()
        .from(expenses)
        .where(eq(expenses.id, existing.expenseId));
      if (!expense || expense.canvasId !== canvasId) {
        return sendError(res, ErrorKeys.expense.paymentNotFound, 404);
      }

      await db.transaction(async (tx) => {
        await creditWalletBalance(
          {
            walletId: existing.sourceWalletId,
            currencyId: expense.currencyId,
            amount: String(existing.amount),
          },
          tx
        );

        await tx.delete(expensePayments).where(eq(expensePayments.id, paymentId));
      });

      res.json({ message: "Expense payment deleted successfully" });
    } catch (err) {
      console.error("Error deleting expense payment:", err);
      sendError(res, ErrorKeys.expense.paymentDeleteFailed, 500);
    }
  }
);

router.get(
  "/:expenseId/payments",
  requireCanvasAccess("view"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const expenseId = parseRouteParam(req.params.expenseId);
    if (Number.isNaN(expenseId)) {
      return sendError(res, ErrorKeys.expense.invalidId, 400);
    }

    try {
      const [expense] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
      if (!expense || expense.canvasId !== canvasId) {
        return sendError(res, ErrorKeys.expense.notFound, 404);
      }

      const payments = await db
        .select({ payment: expensePayments, wallet: wallets, walletCategory: walletCategories })
        .from(expensePayments)
        .leftJoin(wallets, eq(expensePayments.sourceWalletId, wallets.id))
        .leftJoin(walletCategories, eq(wallets.walletCategoryId, walletCategories.id))
        .where(eq(expensePayments.expenseId, expenseId));

      res.json({
        payments: payments.map((p) => ({
          ...p.payment,
          sourceWallet: p.wallet ? { ...p.wallet, category: p.walletCategory } : null,
        })),
      });
    } catch (err) {
      console.error("Error fetching expense payments:", err);
      sendError(res, ErrorKeys.expense.paymentFetchFailed, 500);
    }
  }
);

router.post(
  "/:expenseId/payments",
  requireCanvasAccess("edit"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const user = req.appUser!;
    const expenseId = parseRouteParam(req.params.expenseId);
    if (Number.isNaN(expenseId)) {
      return sendError(res, ErrorKeys.expense.invalidId, 400);
    }

    const { sourceWalletId, amount, dueDate, paidDate, notes } = req.body;

    const parsedWalletId = Number(sourceWalletId);
    const parsedAmount = Number(amount);

    if (!parsedWalletId || Number.isNaN(parsedWalletId)) {
      return sendError(res, ErrorKeys.validation.walletRequired, 400);
    }

    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return sendError(res, ErrorKeys.validation.amountPositive, 400);
    }

    try {
      const [expense] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
      if (!expense || expense.canvasId !== canvasId) {
        return sendError(res, ErrorKeys.expense.notFound, 404);
      }

      const [wallet] = await db.select().from(wallets).where(eq(wallets.id, parsedWalletId));
      if (!wallet || wallet.canvasId !== canvasId) {
        return sendError(res, ErrorKeys.expense.sourceWalletInvalid, 400);
      }

      const amountStr = String(parsedAmount);
      const parsedDueDate = parseOptionalDate(dueDate);
      const parsedPaidDate = parseOptionalDate(paidDate);

      const created = await db.transaction(async (tx) => {
        const [payment] = await tx
          .insert(expensePayments)
          .values({
            expenseId,
            sourceWalletId: parsedWalletId,
            amount: amountStr,
            dueDate: parsedDueDate,
            paidDate: parsedPaidDate,
            notes: notes || null,
            createdBy: user.id,
            lastModifiedBy: user.id,
          })
          .returning();

        await debitWalletBalance(
          {
            walletId: parsedWalletId,
            currencyId: expense.currencyId,
            amount: amountStr,
            allowNegative: false,
          },
          tx
        );
        // Creates sub_wallet row on first payment for this wallet+currency via getOrCreateSubWalletRow

        return payment;
      });

      res.status(201).json({ payment: created });
    } catch (err) {
      console.error("Error creating expense payment:", err);
      const message =
        err instanceof Error && err.message === "Insufficient wallet balance"
          ? "Insufficient wallet balance"
          : "Failed to create expense payment";
      sendError(res, ErrorKeys.common.internal, 500);
    }
  }
);

router.get("/", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  try {
    const { page, limit, search, offset, categoryId, currencyId, isRecurring } =
      parseListQueryParams(req);

    const conditions = [
      eq(expenses.canvasId, canvasId),
      eq(expenses.isArchived, false),
    ];

    if (search) {
      conditions.push(ilike(expenses.name, `%${search}%`));
    }
    if (categoryId !== undefined) {
      conditions.push(eq(expenses.expenseCategoryId, categoryId));
    }
    if (currencyId !== undefined) {
      conditions.push(eq(expenses.currencyId, currencyId));
    }
    if (isRecurring !== undefined) {
      conditions.push(eq(expenses.isRecurring, isRecurring));
    }

    const whereCondition = and(...conditions);

    const [{ total }] = await db
      .select({ total: count() })
      .from(expenses)
      .where(whereCondition);

    const expensesList = await db
      .select({
        expense: expenses,
        category: expenseCategories,
        currency: currencies,
        defaultWallet: wallets,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.expenseCategoryId, expenseCategories.id))
      .leftJoin(currencies, eq(expenses.currencyId, currencies.id))
      .leftJoin(wallets, eq(expenses.defaultWalletId, wallets.id))
      .where(whereCondition)
      .orderBy(desc(expenses.lastModifiedAt))
      .limit(limit)
      .offset(offset);

    const formattedExpenses = expensesList.map((e) => ({
      ...e.expense,
      category: e.category,
      currency: e.currency,
      defaultWallet: e.defaultWallet,
    }));

    res.json({ expenses: formattedExpenses, items: formattedExpenses, total, page, limit });
  } catch (err) {
    console.error("Error fetching expenses:", err);
    sendError(res, ErrorKeys.expense.fetchFailed, 500);
  }
});

router.post("/", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;

  const {
    name,
    expenseCategoryId,
    currencyId,
    defaultWalletId,
    isRecurring,
    recurrencePattern,
    description,
    photoUrl,
    status,
  } = req.body;

  if (!name || !expenseCategoryId || !currencyId) {
    return sendError(res, ErrorKeys.validation.failed, 400);
  }

  try {
    const parsedExpenseCategoryId = Number(expenseCategoryId);
    const parsedCurrencyId = Number(currencyId);
    const hasDefaultWallet =
      defaultWalletId !== undefined && defaultWalletId !== null && defaultWalletId !== "";
    const parsedDefaultWalletId = hasDefaultWallet ? Number(defaultWalletId) : undefined;

    if (Number.isNaN(parsedExpenseCategoryId) || Number.isNaN(parsedCurrencyId)) {
      return sendError(res, ErrorKeys.validation.invalidCategoryOrCurrency, 400);
    }

    if (parsedDefaultWalletId !== undefined && Number.isNaN(parsedDefaultWalletId)) {
      return sendError(res, ErrorKeys.validation.invalidWallet, 400);
    }

    if (parsedDefaultWalletId !== undefined) {
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.id, parsedDefaultWalletId));
      if (!wallet || wallet.canvasId !== canvasId) {
        return sendError(res, ErrorKeys.validation.defaultWalletInvalid, 400);
      }
    }

    const [newExpense] = await db
      .insert(expenses)
      .values({
        canvasId,
        name,
        expenseCategoryId: parsedExpenseCategoryId,
        currencyId: parsedCurrencyId,
        ...(parsedDefaultWalletId !== undefined && { defaultWalletId: parsedDefaultWalletId }),
        isRecurring: isRecurring || false,
        recurrencePattern: recurrencePattern || null,
        description: description || null,
        photoUrl: photoUrl || null,
        status: status || "pending",
        createdBy: user.id,
        lastModifiedBy: user.id,
      })
      .returning();

    await registerWhiteboardNode(canvasId, "expense", newExpense.id);

    res.status(201).json({ expense: newExpense });
  } catch (err) {
    console.error("Error creating expense:", err);
    sendError(res, ErrorKeys.expense.createFailed, 500);
  }
});

router.get("/:expenseId", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const expenseId = parseRouteParam(req.params.expenseId);
  if (Number.isNaN(expenseId)) {
    return sendError(res, ErrorKeys.expense.invalidId, 400);
  }

  try {
    const [expense] = await db
      .select({
        expense: expenses,
        category: expenseCategories,
        currency: currencies,
        defaultWallet: wallets,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.expenseCategoryId, expenseCategories.id))
      .leftJoin(currencies, eq(expenses.currencyId, currencies.id))
      .leftJoin(wallets, eq(expenses.defaultWalletId, wallets.id))
      .where(eq(expenses.id, expenseId));

    if (!expense || expense.expense.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.expense.notFound, 404);
    }

    res.json({
      expense: {
        ...expense.expense,
        category: expense.category,
        currency: expense.currency,
        defaultWallet: expense.defaultWallet,
      },
    });
  } catch (err) {
    console.error("Error fetching expense:", err);
    sendError(res, ErrorKeys.expense.fetchFailed, 500);
  }
});

router.put("/:expenseId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const expenseId = parseRouteParam(req.params.expenseId);
  if (Number.isNaN(expenseId)) {
    return sendError(res, ErrorKeys.expense.invalidId, 400);
  }

  const {
    name,
    expenseCategoryId,
    currencyId,
    defaultWalletId,
    isRecurring,
    recurrencePattern,
    description,
    photoUrl,
    status,
    isArchived,
  } = req.body;

  try {
    const [existing] = await db.select().from(expenses).where(eq(expenses.id, expenseId));

    if (!existing || existing.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.expense.notFound, 404);
    }

    const parsedExpenseCategoryId =
      expenseCategoryId !== undefined ? Number(expenseCategoryId) : undefined;
    const parsedCurrencyId = currencyId !== undefined ? Number(currencyId) : undefined;
    const parsedDefaultWalletId =
      defaultWalletId === undefined
        ? undefined
        : defaultWalletId === null || defaultWalletId === ""
          ? null
          : Number(defaultWalletId);
    if (
      (parsedExpenseCategoryId !== undefined && Number.isNaN(parsedExpenseCategoryId)) ||
      (parsedCurrencyId !== undefined && Number.isNaN(parsedCurrencyId)) ||
      (typeof parsedDefaultWalletId === "number" && Number.isNaN(parsedDefaultWalletId))
    ) {
      return sendError(res, ErrorKeys.validation.invalidCategoryOrCurrency, 400);
    }

    if (typeof parsedDefaultWalletId === "number") {
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.id, parsedDefaultWalletId));
      if (!wallet || wallet.canvasId !== canvasId) {
        return sendError(res, ErrorKeys.validation.defaultWalletInvalid, 400);
      }
    }

    const [updatedExpense] = await db
      .update(expenses)
      .set({
        ...(name !== undefined && { name }),
        ...(parsedExpenseCategoryId !== undefined && { expenseCategoryId: parsedExpenseCategoryId }),
        ...(parsedCurrencyId !== undefined && { currencyId: parsedCurrencyId }),
        ...(parsedDefaultWalletId !== undefined && { defaultWalletId: parsedDefaultWalletId }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(recurrencePattern !== undefined && { recurrencePattern }),
        ...(description !== undefined && { description }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(status !== undefined && { status }),
        ...(isArchived !== undefined && { isArchived }),
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(expenses.id, expenseId))
      .returning();

    res.json({ expense: updatedExpense });
  } catch (err) {
    console.error("Error updating expense:", err);
    sendError(res, ErrorKeys.expense.updateFailed, 500);
  }
});

router.delete("/:expenseId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const expenseId = parseRouteParam(req.params.expenseId);
  if (Number.isNaN(expenseId)) {
    return sendError(res, ErrorKeys.expense.invalidId, 400);
  }

  try {
    const [existing] = await db.select().from(expenses).where(eq(expenses.id, expenseId));

    if (!existing || existing.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.expense.notFound, 404);
    }

    await db
      .update(expenses)
      .set({
        isArchived: true,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(expenses.id, expenseId));

    await unregisterWhiteboardNode(canvasId, "expense", expenseId);

    res.json({ message: "Expense archived successfully" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    sendError(res, ErrorKeys.expense.deleteFailed, 500);
  }
});

export default router;
