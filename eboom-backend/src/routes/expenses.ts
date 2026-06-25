import express, { Request, Response } from "express";
import { db } from "../db/client";
import {
  expenses,
  expenseCategories,
  expensePayments,
  currencies,
  walletCategories,
  wallets,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import { creditWalletBalance, debitWalletBalance } from "../services/ledgerService";
import { checkCanvasPermission } from "../services/canvasAccessService";
import { unregisterWhiteboardNode } from "../services/whiteboardService";
import { parseRouteParam } from "./routeParams";

const router = express.Router();

function denyPermission(res: Response, access: { allowed: false; status: 403; error: string }) {
  return res.status(access.status).json({ error: access.error });
}

function parseOptionalDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

router.delete("/payments/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const paymentId = parseRouteParam(req.params.id);
  if (isNaN(paymentId)) {
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
    if (!expense) return res.status(404).json({ error: "Expense not found" });

    const access = await checkCanvasPermission(expense.canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

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
});

router.get("/:expenseId/payments", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const expenseId = parseRouteParam(req.params.expenseId);
  if (isNaN(expenseId)) {
    return res.status(400).json({ error: "Invalid expense ID" });
  }

  try {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
    if (!expense) return res.status(404).json({ error: "Expense not found" });

    const access = await checkCanvasPermission(expense.canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

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
});

router.post("/:expenseId/payments", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const expenseId = parseRouteParam(req.params.expenseId);
  if (isNaN(expenseId)) {
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
    if (!expense) return res.status(404).json({ error: "Expense not found" });

    const access = await checkCanvasPermission(expense.canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, parsedWalletId));
    if (!wallet || wallet.canvasId !== expense.canvasId) {
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
    const message = err instanceof Error && err.message === "Insufficient wallet balance"
      ? "Insufficient wallet balance"
      : "Failed to create expense payment";
    res.status(500).json({ error: message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const expenseId = parseRouteParam(req.params.id);
  if (isNaN(expenseId)) {
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

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const access = await checkCanvasPermission(expense.expense.canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

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

router.put("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const expenseId = parseRouteParam(req.params.id);
  if (isNaN(expenseId)) {
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
    const [existing] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId));

    if (!existing) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const access = await checkCanvasPermission(existing.canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

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
      if (!wallet || wallet.canvasId !== existing.canvasId) {
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

router.delete("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const expenseId = parseRouteParam(req.params.id);
  if (isNaN(expenseId)) {
    return res.status(400).json({ error: "Invalid expense ID" });
  }

  try {
    const [existing] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId));

    if (!existing) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const access = await checkCanvasPermission(existing.canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    await db
      .update(expenses)
      .set({
        isArchived: true,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(expenses.id, expenseId));

    await unregisterWhiteboardNode(existing.canvasId, "expense", expenseId);

    res.json({ message: "Expense archived successfully" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

export default router;
