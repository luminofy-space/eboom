import express, { Request, Response } from "express";
import { db } from "../db/client";
import {
  canvases,
  canvasMembers,
  expenses,
  expenseCategories,
  currencies,
  incomeResources,
  incomeResourceCategories,
  wallets,
  walletCategories,
} from "../db/schema";
import { eq, and, ilike, count, desc } from "drizzle-orm";
import type { User } from "../db/schema/models";

const router = express.Router();

// Helper to parse pagination query params
function parsePaginationParams(req: Request) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const search = (req.query.search as string) || "";
  const offset = (page - 1) * limit;
  return { page, limit, search, offset };
}

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
// CANVAS ROUTES
// ============================================================================

// GET /canvases - Get all canvases for the authenticated user
router.get("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const memberships = await db
      .select({
        canvas: canvases,
        member: canvasMembers,
      })
      .from(canvasMembers)
      .innerJoin(canvases, eq(canvasMembers.canvasId, canvases.id))
      .where(eq(canvasMembers.userId, user.id));

    const userCanvases = memberships.map((m) => ({
      ...m.canvas,
      isOwner: m.member.isOwner,
      roleId: m.member.roleId,
    }));

    res.json({ canvases: userCanvases });
  } catch (err) {
    console.error("Error fetching canvases:", err);
    res.status(500).json({ error: "Failed to fetch canvases" });
  }
});

// GET /canvases/:id - Get a specific canvas
router.get("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseInt(req.params.id);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  try {
    const [membership] = await db
      .select()
      .from(canvasMembers)
      .where(
        and(
          eq(canvasMembers.canvasId, canvasId),
          eq(canvasMembers.userId, user.id)
        )
      );

    if (!membership) {
      return res.status(403).json({ error: "Access denied to this canvas" });
    }

    const [canvas] = await db
      .select()
      .from(canvases)
      .where(eq(canvases.id, canvasId));

    if (!canvas) {
      return res.status(404).json({ error: "Canvas not found" });
    }

    res.json({
      canvas: {
        ...canvas,
        isOwner: membership.isOwner,
        roleId: membership.roleId,
      },
    });
  } catch (err) {
    console.error("Error fetching canvas:", err);
    res.status(500).json({ error: "Failed to fetch canvas" });
  }
});

// POST /canvases - Create a new canvas
router.post("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { name, description, canvasType, photoUrl, baseCurrencyId } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Canvas name is required" });
  }

  if (!baseCurrencyId) {
    return res.status(400).json({ error: "Base currency is required" });
  }

  try {
    const [selectedCurrency] = await db
      .select({ id: currencies.id })
      .from(currencies)
      .where(eq(currencies.id, Number(baseCurrencyId)));

    if (!selectedCurrency) {
      return res.status(400).json({ error: "Invalid base currency" });
    }

    const [newCanvas] = await db
      .insert(canvases)
      .values({
        name,
        description: description || null,
        canvasType: canvasType || null,
        photoUrl: photoUrl || null,
        createdBy: user.id,
        lastModifiedBy: user.id,
      })
      .returning();

    await db.insert(canvasMembers).values({
      canvasId: newCanvas.id,
      userId: user.id,
      baseCurrencyId: selectedCurrency.id,
      isOwner: true,
      createdBy: user.id,
      lastModifiedBy: user.id,
    });

    res.status(201).json({ canvas: newCanvas });
  } catch (err) {
    console.error("Error creating canvas:", err);
    res.status(500).json({ error: "Failed to create canvas" });
  }
});

// PUT /canvases/:id - Update a canvas
router.put("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseInt(req.params.id);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  const { name, description, canvasType, photoUrl, isArchived } = req.body;

  try {
    const [membership] = await db
      .select()
      .from(canvasMembers)
      .where(
        and(
          eq(canvasMembers.canvasId, canvasId),
          eq(canvasMembers.userId, user.id)
        )
      );

    if (!membership) {
      return res.status(403).json({ error: "Access denied to this canvas" });
    }

    if (!membership.isOwner) {
      return res
        .status(403)
        .json({ error: "Only canvas owner can update canvas" });
    }

    const [updatedCanvas] = await db
      .update(canvases)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(canvasType !== undefined && { canvasType }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(isArchived !== undefined && { isArchived }),
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(canvases.id, canvasId))
      .returning();

    if (!updatedCanvas) {
      return res.status(404).json({ error: "Canvas not found" });
    }

    res.json({ canvas: updatedCanvas });
  } catch (err) {
    console.error("Error updating canvas:", err);
    res.status(500).json({ error: "Failed to update canvas" });
  }
});

// DELETE /canvases/:id - Archive a canvas
router.delete("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseInt(req.params.id);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  try {
    const [membership] = await db
      .select()
      .from(canvasMembers)
      .where(
        and(
          eq(canvasMembers.canvasId, canvasId),
          eq(canvasMembers.userId, user.id)
        )
      );

    if (!membership) {
      return res.status(403).json({ error: "Access denied to this canvas" });
    }

    if (!membership.isOwner) {
      return res
        .status(403)
        .json({ error: "Only canvas owner can delete canvas" });
    }

    await db
      .update(canvases)
      .set({
        isArchived: true,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(canvases.id, canvasId));

    res.json({ message: "Canvas archived successfully" });
  } catch (err) {
    console.error("Error deleting canvas:", err);
    res.status(500).json({ error: "Failed to delete canvas" });
  }
});

// ============================================================================
// CANVAS EXPENSES ROUTES
// ============================================================================

// GET /canvases/:canvasId/expenses - Get all expenses for a canvas
router.get("/:canvasId/expenses", async (req: Request, res: Response) => {
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
      ? and(eq(expenses.canvasId, canvasId), ilike(expenses.name, `%${search}%`))
      : eq(expenses.canvasId, canvasId);

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
router.post("/:canvasId/expenses", async (req: Request, res: Response) => {
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

// ============================================================================
// CANVAS INCOME RESOURCES ROUTES
// ============================================================================

// GET /canvases/:canvasId/income-resources - Get all income resources for a canvas
router.get("/:canvasId/income-resources", async (req: Request, res: Response) => {
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
      ? and(eq(incomeResources.canvasId, canvasId), ilike(incomeResources.name, `%${search}%`))
      : eq(incomeResources.canvasId, canvasId);

    const [{ total }] = await db
      .select({ total: count() })
      .from(incomeResources)
      .where(whereCondition);

    const resources = await db
      .select({
        incomeResource: incomeResources,
        category: incomeResourceCategories,
      })
      .from(incomeResources)
      .leftJoin(
        incomeResourceCategories,
        eq(incomeResources.incomeResourceCategoryId, incomeResourceCategories.id)
      )
      .where(whereCondition)
      .orderBy(desc(incomeResources.lastModifiedAt))
      .limit(limit)
      .offset(offset);

    const formattedResources = resources.map((r) => ({
      ...r.incomeResource,
      category: r.category,
    }));

    res.json({ incomeResources: formattedResources, items: formattedResources, total, page, limit });
  } catch (err) {
    console.error("Error fetching income resources:", err);
    res.status(500).json({ error: "Failed to fetch income resources" });
  }
});

// POST /canvases/:canvasId/income-resources - Create a new income resource
router.post("/:canvasId/income-resources", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseInt(req.params.canvasId);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  const {
    name,
    incomeResourceCategoryId,
    currency,
    amount,
    isRecurring,
    recurrencePattern,
    photoUrl,
    description,
  } = req.body;

  if (!name || !incomeResourceCategoryId) {
    return res.status(400).json({
      error: "Name, category is required",
    });
  }

  try {
    const hasAccess = await checkCanvasAccess(canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this canvas" });
    }

    const [newResource] = await db
      .insert(incomeResources)
      .values({
        canvasId,
        name,
        incomeResourceCategoryId,
        amount,
        currency,
        isRecurring: isRecurring || false,
        ownerId: user.id,
        recurrencePattern: recurrencePattern || null,
        photoUrl: photoUrl || null,
        description: description || null,
        createdBy: user.id,
        lastModifiedBy: user.id,
      })
      .returning();

    res.status(201).json({ incomeResource: newResource });
  } catch (err) {
    console.error("Error creating income resource:", err);
    res.status(500).json({ error: "Failed to create income resource" });
  }
});

// GET /canvases/:canvasId/wallets - Get all wallets for a canvas
router.get("/:canvasId/wallets", async (req: Request, res: Response) => {
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
      ? and(eq(wallets.canvasId, canvasId), ilike(wallets.name, `%${search}%`))
      : eq(wallets.canvasId, canvasId);

    const [{ total }] = await db
      .select({ total: count() })
      .from(wallets)
      .where(whereCondition);

    const walletsList = await db
      .select({
        wallet: wallets,
        category: walletCategories,
      })
      .from(wallets)
      .leftJoin(walletCategories, eq(wallets.walletCategoryId, walletCategories.id))
      .where(whereCondition)
      .orderBy(desc(wallets.lastModifiedAt))
      .limit(limit)
      .offset(offset);

    const formattedWallets = walletsList.map((w) => ({
      ...w.wallet,
      category: w.category,
    }));

    res.json({ wallets: formattedWallets, items: formattedWallets, total, page, limit });
  } catch (err) {
    console.error("Error fetching wallets:", err);
    res.status(500).json({ error: "Failed to fetch wallets" });
  }
});

// POST /canvases/:canvasId/wallets - Create a new wallet
router.post("/:canvasId/wallets", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseInt(req.params.canvasId);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  const {
    name,
    walletCategoryId,
    walletNumber,
    description,
    photoUrl,
  } = req.body;

  if (!name || !walletCategoryId) {
    return res.status(400).json({
      error: "Wallet name and category are required",
    });
  }

  try {
    const hasAccess = await checkCanvasAccess(canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this canvas" });
    }

    const [newWallet] = await db
      .insert(wallets)
      .values({
        canvasId,
        name,
        walletCategoryId,
        ownerId: user.id,
        walletNumber: walletNumber || null,
        photoUrl: photoUrl || null,
        description: description || null,
        isArchived: false,
        createdBy: user.id,
        lastModifiedBy: user.id,
      })
      .returning();

    res.status(201).json({ wallet: newWallet });
  } catch (err) {
    console.error("Error creating wallet:", err);
    res.status(500).json({ error: "Failed to create wallet" });
  }
});

export default router;
