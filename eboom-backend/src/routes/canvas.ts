import express, { Request, Response } from "express";
import { db } from "../db/client";
import {
  canvases,
  canvasMembers,
  expenses,
  expenseCategories,
  assets,
  assetCategories,
  currencies,
  incomes,
  incomeCategories,
  wallets,
  walletCategories,
  userSettings,
  roles,
} from "../db/schema";
import { eq, and, ilike, count, desc } from "drizzle-orm";
import {
  computePermissions,
  checkCanvasPermission,
  formatMembershipForResponse,
  getCanvasMembership,
} from "../services/canvasAccessService";
import { registerWhiteboardNode, unregisterWhiteboardNode } from "../services/whiteboardService";
import { getCanvasSummary } from "../services/dashboardService";
import { listCanvasTransfersHandler } from "./transfers";
import { parseRouteParam } from "./routeParams";

const router = express.Router();

function parsePaginationParams(req: Request) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const search = (req.query.search as string) || "";
  const offset = (page - 1) * limit;
  return { page, limit, search, offset };
}


async function denyCanvasPermission(res: Response, result: { status: 403; error: string }) {
  return res.status(result.status).json({ error: result.error });
}

// ============================================================================
// CANVAS ROUTES
// ============================================================================

router.get("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const memberships = await db
      .select({
        canvas: canvases,
        member: canvasMembers,
        role: roles,
      })
      .from(canvasMembers)
      .innerJoin(canvases, eq(canvasMembers.canvasId, canvases.id))
      .leftJoin(roles, eq(canvasMembers.roleId, roles.id))
      .where(and(eq(canvasMembers.userId, user.id), eq(canvases.isArchived, false)));

    const userCanvases = memberships.map((m) => {
      const rolePermissions =
        m.role?.permissions && typeof m.role.permissions === "object"
          ? (m.role.permissions as Record<string, boolean>)
          : {};
      const permissions = computePermissions(m.member.isOwner ?? false, rolePermissions);
      return {
        ...m.canvas,
        isOwner: m.member.isOwner,
        roleId: m.member.roleId,
        roleName: m.role?.name ?? null,
        permissions,
      };
    });

    res.json({ canvases: userCanvases });
  } catch (err) {
    console.error("Error fetching canvases:", err);
    res.status(500).json({ error: "Failed to fetch canvases" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseRouteParam(req.params.id);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  try {
    const membership = await getCanvasMembership(canvasId, user.id);
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
        ...formatMembershipForResponse(membership),
      },
    });
  } catch (err) {
    console.error("Error fetching canvas:", err);
    res.status(500).json({ error: "Failed to fetch canvas" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { name, description, canvasType, photoUrl, baseCurrencyId } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Canvas name is required" });
  }

  try {
    if (baseCurrencyId) {
      const [selectedCurrency] = await db
        .select({ id: currencies.id })
        .from(currencies)
        .where(eq(currencies.id, Number(baseCurrencyId)));

      if (!selectedCurrency) {
        return res.status(400).json({ error: "Invalid base currency" });
      }

      const [existingSettings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, user.id));

      if (existingSettings) {
        await db
          .update(userSettings)
          .set({ defaultCurrencyId: selectedCurrency.id, lastModifiedAt: new Date() })
          .where(eq(userSettings.userId, user.id));
      } else {
        await db.insert(userSettings).values({
          userId: user.id,
          defaultCurrencyId: selectedCurrency.id,
        });
      }
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
      isOwner: true,
    });

    res.status(201).json({ canvas: newCanvas });
  } catch (err) {
    console.error("Error creating canvas:", err);
    res.status(500).json({ error: "Failed to create canvas" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseRouteParam(req.params.id);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  const { name, description, canvasType, photoUrl, isArchived } = req.body;

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "manage_canvas");
    if (!access.allowed) {
      return denyCanvasPermission(res, access);
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

router.delete("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseRouteParam(req.params.id);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "manage_canvas");
    if (!access.allowed) {
      return denyCanvasPermission(res, access);
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
// CANVAS DASHBOARD SUMMARY
// ============================================================================

router.get("/:canvasId/transfers", listCanvasTransfersHandler);

router.get("/:canvasId/summary", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseRouteParam(req.params.canvasId);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) {
      return denyCanvasPermission(res, access);
    }

    const summary = await getCanvasSummary(canvasId);
    res.json(summary);
  } catch (err) {
    console.error("Error fetching canvas summary:", err);
    res.status(500).json({ error: "Failed to fetch canvas summary" });
  }
});

// ============================================================================
// CANVAS EXPENSES ROUTES
// ============================================================================

router.get("/:canvasId/expenses", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseRouteParam(req.params.canvasId);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) {
      return denyCanvasPermission(res, access);
    }

    const { page, limit, search, offset } = parsePaginationParams(req);

    const whereCondition = search
      ? and(eq(expenses.canvasId, canvasId), eq(expenses.isArchived, false), ilike(expenses.name, `%${search}%`))
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

router.post("/:canvasId/expenses", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseRouteParam(req.params.canvasId);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
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
  } = req.body;

  if (!name || !expenseCategoryId || !currencyId) {
    return res.status(400).json({
      error: "Expense name, category, and currency are required",
    });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "edit");
    if (!access.allowed) {
      return denyCanvasPermission(res, access);
    }

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

// ============================================================================
// CANVAS INCOMES ROUTES
// ============================================================================

router.get("/:canvasId/incomes", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseRouteParam(req.params.canvasId);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) {
      return denyCanvasPermission(res, access);
    }

    const { page, limit, search, offset } = parsePaginationParams(req);

    const whereCondition = search
      ? and(eq(incomes.canvasId, canvasId), eq(incomes.isArchived, false), ilike(incomes.name, `%${search}%`))
      : and(eq(incomes.canvasId, canvasId), eq(incomes.isArchived, false));

    const [{ total }] = await db
      .select({ total: count() })
      .from(incomes)
      .where(whereCondition);

    const incomeList = await db
      .select({
        income: incomes,
        category: incomeCategories,
        currency: currencies,
        defaultWallet: wallets,
      })
      .from(incomes)
      .leftJoin(incomeCategories, eq(incomes.incomeCategoryId, incomeCategories.id))
      .leftJoin(currencies, eq(incomes.currencyId, currencies.id))
      .leftJoin(wallets, eq(incomes.defaultWalletId, wallets.id))
      .where(whereCondition)
      .orderBy(desc(incomes.lastModifiedAt))
      .limit(limit)
      .offset(offset);

    const formattedIncomes = incomeList.map((r) => ({
      ...r.income,
      category: r.category,
      currency: r.currency,
      defaultWallet: r.defaultWallet,
    }));

    res.json({ incomes: formattedIncomes, items: formattedIncomes, total, page, limit });
  } catch (err) {
    console.error("Error fetching incomes:", err);
    res.status(500).json({ error: "Failed to fetch incomes" });
  }
});

router.post("/:canvasId/incomes", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseRouteParam(req.params.canvasId);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  const {
    name,
    incomeCategoryId,
    currencyId,
    defaultWalletId,
    amount,
    isRecurring,
    recurrencePattern,
    photoUrl,
    description,
    status,
  } = req.body;

  if (!name || !incomeCategoryId || !currencyId) {
    return res.status(400).json({
      error: "Name, category, and currency are required",
    });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "edit");
    if (!access.allowed) {
      return denyCanvasPermission(res, access);
    }

    const parsedIncomeCategoryId = Number(incomeCategoryId);
    const parsedCurrencyId = Number(currencyId);
    const hasDefaultWallet =
      defaultWalletId !== undefined && defaultWalletId !== null && defaultWalletId !== "";
    const parsedDefaultWalletId = hasDefaultWallet ? Number(defaultWalletId) : undefined;

    if (Number.isNaN(parsedIncomeCategoryId) || Number.isNaN(parsedCurrencyId)) {
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

    const [newIncome] = await db
      .insert(incomes)
      .values({
        canvasId,
        name,
        incomeCategoryId: parsedIncomeCategoryId,
        currencyId: parsedCurrencyId,
        ...(parsedDefaultWalletId !== undefined && { defaultWalletId: parsedDefaultWalletId }),
        amount: Number(amount) || 0,
        isRecurring: isRecurring || false,
        recurrencePattern: recurrencePattern || null,
        photoUrl: photoUrl || null,
        description: description || null,
        status: status || "pending",
        createdBy: user.id,
        lastModifiedBy: user.id,
      })
      .returning();

    await registerWhiteboardNode(canvasId, "income", newIncome.id);

    res.status(201).json({ income: newIncome });
  } catch (err) {
    console.error("Error creating income:", err);
    res.status(500).json({ error: "Failed to create income" });
  }
});

// ============================================================================
// CANVAS WALLETS ROUTES
// ============================================================================

router.get("/:canvasId/wallets", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseRouteParam(req.params.canvasId);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) {
      return denyCanvasPermission(res, access);
    }

    const { page, limit, search, offset } = parsePaginationParams(req);

    const whereCondition = search
      ? and(eq(wallets.canvasId, canvasId), eq(wallets.isArchived, false), ilike(wallets.name, `%${search}%`))
      : and(eq(wallets.canvasId, canvasId), eq(wallets.isArchived, false));

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

router.post("/:canvasId/wallets", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseRouteParam(req.params.canvasId);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  const {
    name,
    walletCategoryId,
    description,
    photoUrl,
  } = req.body;

  if (!name || !walletCategoryId) {
    return res.status(400).json({
      error: "Wallet name and category are required",
    });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "edit");
    if (!access.allowed) {
      return denyCanvasPermission(res, access);
    }

    const parsedWalletCategoryId = Number(walletCategoryId);
    if (Number.isNaN(parsedWalletCategoryId)) {
      return res.status(400).json({ error: "Invalid wallet category ID" });
    }

    const [newWallet] = await db
      .insert(wallets)
      .values({
        canvasId,
        name,
        walletCategoryId: parsedWalletCategoryId,
        photoUrl: photoUrl || null,
        description: description || null,
        isArchived: false,
        createdBy: user.id,
        lastModifiedBy: user.id,
      })
      .returning();

    await registerWhiteboardNode(canvasId, "wallet", newWallet.id);

    res.status(201).json({ wallet: newWallet });
  } catch (err) {
    console.error("Error creating wallet:", err);
    res.status(500).json({ error: "Failed to create wallet" });
  }
});

// ============================================================================
// CANVAS ASSETS ROUTES
// ============================================================================

router.get("/:canvasId/assets", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseRouteParam(req.params.canvasId);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "view");
    if (!access.allowed) {
      return denyCanvasPermission(res, access);
    }

    const { page, limit, search, offset } = parsePaginationParams(req);

    const whereCondition = search
      ? and(eq(assets.canvasId, canvasId), eq(assets.isArchived, false), ilike(assets.name, `%${search}%`))
      : and(eq(assets.canvasId, canvasId), eq(assets.isArchived, false));

    const [{ total }] = await db
      .select({ total: count() })
      .from(assets)
      .where(whereCondition);

    const assetsList = await db
      .select({
        asset: assets,
        category: assetCategories,
        currency: currencies,
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.assetCategoryId, assetCategories.id))
      .leftJoin(currencies, eq(assets.currencyId, currencies.id))
      .where(whereCondition)
      .orderBy(desc(assets.lastModifiedAt))
      .limit(limit)
      .offset(offset);

    const formattedAssets = assetsList.map((a) => ({
      ...a.asset,
      category: a.category,
      currency: a.currency,
    }));

    res.json({ assets: formattedAssets, items: formattedAssets, total, page, limit });
  } catch (err) {
    console.error("Error fetching assets:", err);
    res.status(500).json({ error: "Failed to fetch assets" });
  }
});

router.post("/:canvasId/assets", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = parseRouteParam(req.params.canvasId);
  if (isNaN(canvasId)) {
    return res.status(400).json({ error: "Invalid canvas ID" });
  }

  const { name, assetCategoryId, currencyId, estimatedValue, description, photoUrl } = req.body;

  if (!name || !assetCategoryId || !currencyId || estimatedValue === undefined || estimatedValue === null) {
    return res.status(400).json({
      error: "Asset name, category, currency, and estimated value are required",
    });
  }

  try {
    const access = await checkCanvasPermission(canvasId, user.id, "edit");
    if (!access.allowed) {
      return denyCanvasPermission(res, access);
    }

    const parsedAssetCategoryId = Number(assetCategoryId);
    const parsedCurrencyId = Number(currencyId);
    const parsedEstimatedValue = Number(estimatedValue);

    if (
      Number.isNaN(parsedAssetCategoryId) ||
      Number.isNaN(parsedCurrencyId) ||
      Number.isNaN(parsedEstimatedValue) ||
      parsedEstimatedValue < 0
    ) {
      return res.status(400).json({ error: "Invalid category, currency, or estimated value" });
    }

    const [category] = await db
      .select()
      .from(assetCategories)
      .where(eq(assetCategories.id, parsedAssetCategoryId));
    if (!category) {
      return res.status(400).json({ error: "Invalid asset category" });
    }

    const [newAsset] = await db
      .insert(assets)
      .values({
        canvasId,
        name,
        assetCategoryId: parsedAssetCategoryId,
        currencyId: parsedCurrencyId,
        estimatedValue: String(parsedEstimatedValue),
        photoUrl: photoUrl || null,
        description: description || null,
        createdBy: user.id,
        lastModifiedBy: user.id,
      })
      .returning();

    res.status(201).json({ asset: newAsset });
  } catch (err) {
    console.error("Error creating asset:", err);
    res.status(500).json({ error: "Failed to create asset" });
  }
});

export default router;
