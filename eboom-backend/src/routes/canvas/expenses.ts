import express, { Request, Response } from "express";
import { db } from "../../db/client";
import {
  expenses,
  expenseCategories,
  currencies,
} from "../../db/schema";
import { eq, and, ilike, count, desc } from "drizzle-orm";
import { parsePaginationParams, checkCanvasAccess } from "./helpers"

const router = express.Router({ mergeParams: true });

// GET /canvases/:canvasId/expenses - Get all expenses for a canvas
router.get("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseInt(req.params.canvasId);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  try {
    const hasAccess = await checkCanvasAccess(canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this canvas" });
    }

    const { page, limit, search, offset } = parsePaginationParams(req);

    const whereCondition = search
      ? and(eq(expenses.canvasId, canvasId), eq(expenses.isActive, true), ilike(expenses.name, `%${search}%`))
      : and(eq(expenses.canvasId, canvasId), eq(expenses.isActive, true));

    const [{ total }] = await db
      .select({ total: count() })
      .from(expenses)
      .where(whereCondition);

    const expensesList = await db
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
      .where(whereCondition)
      .orderBy(desc(expenses.lastModifiedAt))
      .limit(limit)
      .offset(offset);

    const formattedExpenses = expensesList.map((e) => ({
      ...e.expense,
      category: e.category,
      currency: e.currency,
    }));

    res.json({ expenses: formattedExpenses, items: formattedExpenses, total, page, limit });
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// POST /canvases/:canvasId/expenses - Create a new expense
router.post("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseInt(req.params.canvasId);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
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

  if (!name || !expenseCategoryId || !currencyId) {
    return res.status(400).json({
      error: "Expense name, category, and currency are required",
    });
  }

  try {
    const hasAccess = await checkCanvasAccess(canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this canvas" });
    }

    const [newExpense] = await db
      .insert(expenses)
      .values({
        canvasId,
        name,
        expenseCategoryId,
        currencyId,
        entityId: entityId || null,
        isRecurring: isRecurring || false,
        recurrencePattern: recurrencePattern || null,
        description: description || null,
        photoUrl: photoUrl || null,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: user.id,
        lastModifiedBy: user.id,
      })
      .returning();

    res.status(201).json({ expense: newExpense });
  } catch (err) {
    console.error("Error creating expense:", err);
    res.status(500).json({ error: "Failed to create expense" });
  }
});

export default router;
