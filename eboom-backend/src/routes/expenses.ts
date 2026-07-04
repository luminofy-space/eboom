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

const router = express.Router({ mergeParams: true });

function parsePaginationParams(req: Request) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const search = (req.query.search as string) || "";
  const offset = (page - 1) * limit;
  return { page, limit, search, offset };
}

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
    return res.status(400).json({ error: "Invalid expense payment ID" });
  }

  const { sourceWalletId, amount, dueDate, paidDate, notes } = req.body;

  const parsedWalletId = Number(sourceWalletId);
  const parsedAmount = Number(amount);

  if (!parsedWalletId || Number.isNaN(parsedWalletId)) {
    return res.status(400).json({ error: "Source wallet is required" });
  }

  if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "A valid amount greater than zero is required" });
  }

  try {
    const [existing] = await db
      .select()
      .from(expensePayments)
      .where(eq(expensePayments.id, paymentId));
    if (!existing) return res.status(404).json({ error: "Expense payment not found" });

    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, existing.expenseId));
    if (!expense || expense.canvasId !== canvasId) {
      return res.status(404).json({ error: "Expense payment not found" });
    }

    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, parsedWalletId));
    if (!wallet || wallet.canvasId !== canvasId) {
      return res.status(400).json({ error: "Source wallet is invalid for this canvas" });
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
    res.status(500).json({ error: message });
  }
});

router.delete(
  "/payments/:paymentId",
  requireCanvasAccess("edit"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const paymentId = parseRouteParam(req.params.paymentId);
    if (Number.isNaN(paymentId)) {
      return res.status(400).json({ error: "Invalid expense payment ID" });
    }

    try {
      const [existing] = await db
        .select()
        .from(expensePayments)
        .where(eq(expensePayments.id, paymentId));
      if (!existing) return res.status(404).json({ error: "Expense payment not found" });

      const [expense] = await db
        .select()
        .from(expenses)
        .where(eq(expenses.id, existing.expenseId));
      if (!expense || expense.canvasId !== canvasId) {
        return res.status(404).json({ error: "Expense payment not found" });
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
      res.status(500).json({ error: "Failed to delete expense payment" });
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
      return res.status(400).json({ error: "Invalid expense ID" });
    }

    try {
      const [expense] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
      if (!expense || expense.canvasId !== canvasId) {
        return res.status(404).json({ error: "Expense not found" });
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
      res.status(500).json({ error: "Failed to fetch expense payments" });
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
      return res.status(400).json({ error: "Invalid expense ID" });
    }

    const { sourceWalletId, amount, dueDate, paidDate, notes } = req.body;

    const parsedWalletId = Number(sourceWalletId);
    const parsedAmount = Number(amount);

    if (!parsedWalletId || Number.isNaN(parsedWalletId)) {
      return res.status(400).json({ error: "Source wallet is required" });
    }

    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "A valid amount greater than zero is required" });
    }

    try {
      const [expense] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
      if (!expense || expense.canvasId !== canvasId) {
        return res.status(404).json({ error: "Expense not found" });
      }

      const [wallet] = await db.select().from(wallets).where(eq(wallets.id, parsedWalletId));
      if (!wallet || wallet.canvasId !== canvasId) {
        return res.status(400).json({ error: "Source wallet is invalid for this canvas" });
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

        return payment;
      });

      res.status(201).json({ payment: created });
    } catch (err) {
      console.error("Error creating expense payment:", err);
      const message =
        err instanceof Error && err.message === "Insufficient wallet balance"
          ? "Insufficient wallet balance"
          : "Failed to create expense payment";
      res.status(500).json({ error: message });
    }
  }
);

router.get("/", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  try {
    const { page, limit, search, offset } = parsePaginationParams(req);

    const whereCondition = search
      ? and(
          eq(expenses.canvasId, canvasId),
          eq(expenses.isArchived, false),
          ilike(expenses.name, `%${search}%`)
        )
      : and(eq(expenses.canvasId, canvasId), eq(expenses.isArchived, false));

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
    res.status(500).json({ error: "Failed to fetch expenses" });
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
    return res.status(400).json({
      error: "Expense name, category, and currency are required",
    });
  }

  try {
    const parsedExpenseCategoryId = Number(expenseCategoryId);
    const parsedCurrencyId = Number(currencyId);
    const hasDefaultWallet =
      defaultWalletId !== undefined && defaultWalletId !== null && defaultWalletId !== "";
    const parsedDefaultWalletId = hasDefaultWallet ? Number(defaultWalletId) : undefined;

    if (Number.isNaN(parsedExpenseCategoryId) || Number.isNaN(parsedCurrencyId)) {
      return res.status(400).json({ error: "Invalid category or currency ID" });
    }

    if (parsedDefaultWalletId !== undefined && Number.isNaN(parsedDefaultWalletId)) {
      return res.status(400).json({ error: "Invalid wallet ID" });
    }

    if (parsedDefaultWalletId !== undefined) {
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.id, parsedDefaultWalletId));
      if (!wallet || wallet.canvasId !== canvasId) {
        return res.status(400).json({ error: "Default wallet is invalid for this canvas" });
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
    res.status(500).json({ error: "Failed to create expense" });
  }
});

router.get("/:expenseId", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const expenseId = parseRouteParam(req.params.expenseId);
  if (Number.isNaN(expenseId)) {
    return res.status(400).json({ error: "Invalid expense ID" });
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
      return res.status(404).json({ error: "Expense not found" });
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
    res.status(500).json({ error: "Failed to fetch expense" });
  }
});

router.put("/:expenseId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const expenseId = parseRouteParam(req.params.expenseId);
  if (Number.isNaN(expenseId)) {
    return res.status(400).json({ error: "Invalid expense ID" });
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
      return res.status(404).json({ error: "Expense not found" });
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
      return res.status(400).json({ error: "Invalid category, currency, or wallet ID" });
    }

    if (typeof parsedDefaultWalletId === "number") {
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.id, parsedDefaultWalletId));
      if (!wallet || wallet.canvasId !== canvasId) {
        return res.status(400).json({ error: "Default wallet is invalid for this canvas" });
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
    res.status(500).json({ error: "Failed to update expense" });
  }
});

router.delete("/:expenseId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const expenseId = parseRouteParam(req.params.expenseId);
  if (Number.isNaN(expenseId)) {
    return res.status(400).json({ error: "Invalid expense ID" });
  }

  try {
    const [existing] = await db.select().from(expenses).where(eq(expenses.id, expenseId));

    if (!existing || existing.canvasId !== canvasId) {
      return res.status(404).json({ error: "Expense not found" });
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
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

export default router;
