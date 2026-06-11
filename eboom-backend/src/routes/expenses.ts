import express, { Request, Response } from "express";
import { db } from "../db/client";
import {
  expenses,
  expenseCategories,
  canvasMembers,
  currencies,
  wallets,
} from "../db/schema";
import { eq, and } from "drizzle-orm";

const router = express.Router();

async function checkCanvasAccess(
  canvasId: number,
  userId: number
): Promise<boolean> {
  const [membership] = await db
    .select()
    .from(canvasMembers)
    .where(
      and(eq(canvasMembers.canvasId, canvasId), eq(canvasMembers.userId, userId))
    );
  return !!membership;
}

router.get("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const expenseId = parseInt(req.params.id);
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

    const hasAccess = await checkCanvasAccess(expense.expense.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
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

router.put("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const expenseId = parseInt(req.params.id);
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

    const hasAccess = await checkCanvasAccess(existing.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const parsedExpenseCategoryId =
      expenseCategoryId !== undefined ? Number(expenseCategoryId) : undefined;
    const parsedCurrencyId = currencyId !== undefined ? Number(currencyId) : undefined;
    const parsedDefaultWalletId =
      defaultWalletId !== undefined ? Number(defaultWalletId) : undefined;
    if (
      (parsedExpenseCategoryId !== undefined && Number.isNaN(parsedExpenseCategoryId)) ||
      (parsedCurrencyId !== undefined && Number.isNaN(parsedCurrencyId)) ||
      (parsedDefaultWalletId !== undefined && Number.isNaN(parsedDefaultWalletId))
    ) {
      return res.status(400).json({ error: "Invalid category, currency, or wallet ID" });
    }

    if (parsedDefaultWalletId !== undefined) {
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

  const expenseId = parseInt(req.params.id);
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

    const hasAccess = await checkCanvasAccess(existing.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    await db
      .update(expenses)
      .set({
        isArchived: true,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(expenses.id, expenseId));

    res.json({ message: "Expense archived successfully" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

export default router;
