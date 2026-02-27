import express, { Request, Response } from "express";
import { db } from "../db/client";
import {
  expenses,
  expenseCategories,
  canvasMembers,
  currencies,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import type { Expense, NewExpense, User } from "../db/schema/models";

const router = express.Router();

// Helper function to check canvas access
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

// ============================================================================
// GET /:id - Get a specific expense
// ============================================================================
router.get("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const expenseId = parseInt(req.params.id);
  if (isNaN(expenseId)) {
    return res.status(400).json({ error: "Invalid expense ID" });
  }

  try {
    // Get the expense with category and currency info
    const [expense] = await db
      .select({
        expense: expenses,
        category: expenseCategories,
        currency: currencies,
      })
      .from(expenses)
      .leftJoin(
        expenseCategories,
        eq(expenses.expenseCategoryId, expenseCategories.id)
      )
      .leftJoin(currencies, eq(expenses.currencyId, currencies.id))
      .where(eq(expenses.id, expenseId));

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Check canvas access
    const hasAccess = await checkCanvasAccess(expense.expense.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      expense: {
        ...expense.expense,
        category: expense.category,
        currency: expense.currency,
      },
    });
  } catch (err) {
    console.error("Error fetching expense:", err);
    res.status(500).json({ error: "Failed to fetch expense" });
  }
});

// ============================================================================
// PUT /:id - Update an expense
// ============================================================================
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
    entityId,
    isRecurring,
    recurrencePattern,
    description,
    photoUrl,
    isActive,
  } = req.body;

  try {
    // Get the existing expense to check canvas access
    const [existing] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId));

    if (!existing) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Check canvas access
    const hasAccess = await checkCanvasAccess(existing.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update the expense
    const [updatedExpense] = await db
      .update(expenses)
      .set({
        ...(name !== undefined && { name }),
        ...(expenseCategoryId !== undefined && { expenseCategoryId }),
        ...(currencyId !== undefined && { currencyId }),
        ...(entityId !== undefined && { entityId }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(recurrencePattern !== undefined && { recurrencePattern }),
        ...(description !== undefined && { description }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(isActive !== undefined && { isActive }),
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

// ============================================================================
// DELETE /:id - Deactivate an expense (soft delete)
// ============================================================================
router.delete("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const expenseId = parseInt(req.params.id);
  if (isNaN(expenseId)) {
    return res.status(400).json({ error: "Invalid expense ID" });
  }

  try {
    // Get the existing expense to check canvas access
    const [existing] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId));

    if (!existing) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Check canvas access
    const hasAccess = await checkCanvasAccess(existing.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Deactivate the expense (soft delete)
    await db
      .update(expenses)
      .set({
        isActive: false,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(expenses.id, expenseId));

    res.json({ message: "Expense deactivated successfully" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

export default router;
