import express, { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import {
  wallets,
  incomeEntries,
  incomes,
  expensePayments,
  expenses,
  expenseCategories,
  incomeCategories,
  walletCategories,
  subWallets,
  currencies,
} from "../db/schema";
import {
  CanvasPermission,
  checkCanvasPermission,
} from "../services/canvasAccessService";
import { unregisterWhiteboardNode } from "../services/whiteboardService";
import { parseRouteParam } from "./routeParams";

const router = express.Router();

function denyPermission(res: Response, access: { allowed: false; status: 403; error: string }) {
  return res.status(access.status).json({ error: access.error });
}

async function checkWalletPermission(
  walletId: number,
  userId: number,
  permission: CanvasPermission
) {
  const [existing] = await db.select().from(wallets).where(eq(wallets.id, walletId));
  if (!existing) return { wallet: null, access: null };
  const access = await checkCanvasPermission(existing.canvasId, userId, permission);
  return { wallet: existing, access };
}

router.get("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const walletId = parseRouteParam(req.params.id);
  if (isNaN(walletId)) {
    return res.status(400).json({ error: "Invalid wallet ID" });
  }

  try {
    const [walletRecord] = await db
      .select({ wallet: wallets, category: walletCategories })
      .from(wallets)
      .leftJoin(walletCategories, eq(wallets.walletCategoryId, walletCategories.id))
      .where(eq(wallets.id, walletId));

    if (!walletRecord) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const access = await checkCanvasPermission(walletRecord.wallet.canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

    const subWalletRows = await db
      .select({ subWallet: subWallets, currency: currencies })
      .from(subWallets)
      .leftJoin(currencies, eq(subWallets.currencyId, currencies.id))
      .where(eq(subWallets.walletId, walletId));

    res.json({
      wallet: {
        ...walletRecord.wallet,
        category: walletRecord.category,
        subWallets: subWalletRows.map((b) => ({
          ...b.subWallet,
          currency: b.currency,
        })),
      },
    });
  } catch (err) {
    console.error("Error fetching wallet:", err);
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const walletId = parseRouteParam(req.params.id);
  if (isNaN(walletId)) {
    return res.status(400).json({ error: "Invalid wallet ID" });
  }

  const { name, walletCategoryId, description, photoUrl, isArchived } = req.body;

  try {
    const [existing] = await db.select().from(wallets).where(eq(wallets.id, walletId));
    if (!existing) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const access = await checkCanvasPermission(existing.canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    const parsedWalletCategoryId =
      walletCategoryId !== undefined ? Number(walletCategoryId) : undefined;
    if (parsedWalletCategoryId !== undefined && Number.isNaN(parsedWalletCategoryId)) {
      return res.status(400).json({ error: "Invalid wallet category ID" });
    }

    const [updatedWallet] = await db
      .update(wallets)
      .set({
        ...(name !== undefined && { name }),
        ...(parsedWalletCategoryId !== undefined && { walletCategoryId: parsedWalletCategoryId }),
        ...(description !== undefined && { description }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(isArchived !== undefined && { isArchived }),
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(wallets.id, walletId))
      .returning();

    res.json({ wallet: updatedWallet });
  } catch (err) {
    console.error("Error updating wallet:", err);
    res.status(500).json({ error: "Failed to update wallet" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const walletId = parseRouteParam(req.params.id);
  if (isNaN(walletId)) {
    return res.status(400).json({ error: "Invalid wallet ID" });
  }

  try {
    const [existing] = await db.select().from(wallets).where(eq(wallets.id, walletId));
    if (!existing) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const access = await checkCanvasPermission(existing.canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    await db
      .update(wallets)
      .set({
        isArchived: true,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(wallets.id, walletId));

    await unregisterWhiteboardNode(existing.canvasId, "wallet", walletId);

    res.json({ message: "Wallet archived successfully" });
  } catch (err) {
    console.error("Error deleting wallet:", err);
    res.status(500).json({ error: "Failed to delete wallet" });
  }
});

// GET all income entries for a wallet
router.get("/:walletId/income-entries", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const walletId = parseRouteParam(req.params.walletId);
  if (isNaN(walletId)) return res.status(400).json({ error: "Invalid wallet ID" });

  try {
    const { access } = await checkWalletPermission(walletId, user.id, "view");
    if (!access?.allowed) {
      return denyPermission(res, access ?? { allowed: false, status: 403, error: "Access denied to this canvas" });
    }

    const entries = await db
      .select({
        id: incomeEntries.id,
        incomeId: incomeEntries.incomeId,
        incomeName: incomes.name,
        categoryName: incomeCategories.name,
        destinationWalletId: incomeEntries.destinationWalletId,
        amount: incomeEntries.amount,
        expectedDate: incomeEntries.expectedDate,
        receivedDate: incomeEntries.receivedDate,
        notes: incomeEntries.notes,
        createdAt: incomeEntries.createdAt,
      })
      .from(incomeEntries)
      .innerJoin(incomes, eq(incomeEntries.incomeId, incomes.id))
      .innerJoin(incomeCategories, eq(incomes.incomeCategoryId, incomeCategories.id))
      .where(eq(incomeEntries.destinationWalletId, walletId));

    res.json({
      walletId,
      incomeEntries: entries,
      total: entries.length,
    });
  } catch (err) {
    console.error("Error fetching income entries:", err);
    res.status(500).json({ error: "Failed to fetch income entries" });
  }
});

// GET all expense payments for a wallet
router.get("/:walletId/expense-payments", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const walletId = parseRouteParam(req.params.walletId);
  if (isNaN(walletId)) return res.status(400).json({ error: "Invalid wallet ID" });

  try {
    const { access } = await checkWalletPermission(walletId, user.id, "view");
    if (!access?.allowed) {
      return denyPermission(res, access ?? { allowed: false, status: 403, error: "Access denied to this canvas" });
    }

    const payments = await db
      .select({
        id: expensePayments.id,
        expenseId: expensePayments.expenseId,
        expenseName: expenses.name,
        categoryName: expenseCategories.name,
        sourceWalletId: expensePayments.sourceWalletId,
        amount: expensePayments.amount,
        dueDate: expensePayments.dueDate,
        paidDate: expensePayments.paidDate,
        notes: expensePayments.notes,
        createdAt: expensePayments.createdAt,
      })
      .from(expensePayments)
      .innerJoin(expenses, eq(expensePayments.expenseId, expenses.id))
      .innerJoin(expenseCategories, eq(expenses.expenseCategoryId, expenseCategories.id))
      .where(eq(expensePayments.sourceWalletId, walletId));

    res.json({
      walletId,
      expensePayments: payments,
      total: payments.length,
    });
  } catch (err) {
    console.error("Error fetching expense payments:", err);
    res.status(500).json({ error: "Failed to fetch expense payments" });
  }
});

// GET all transactions (income entries + expense payments) for a wallet
router.get("/:walletId/transactions", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const walletId = parseRouteParam(req.params.walletId);
  if (isNaN(walletId)) return res.status(400).json({ error: "Invalid wallet ID" });

  try {
    const { access } = await checkWalletPermission(walletId, user.id, "view");
    if (!access?.allowed) {
      return denyPermission(res, access ?? { allowed: false, status: 403, error: "Access denied to this canvas" });
    }

    // Fetch income entries
    const incomeData = await db
      .select({
        id: incomeEntries.id,
        incomeId: incomeEntries.incomeId,
        incomeName: incomes.name,
        categoryName: incomeCategories.name,
        destinationWalletId: incomeEntries.destinationWalletId,
        amount: incomeEntries.amount,
        expectedDate: incomeEntries.expectedDate,
        receivedDate: incomeEntries.receivedDate,
        notes: incomeEntries.notes,
        createdAt: incomeEntries.createdAt,
      })
      .from(incomeEntries)
      .innerJoin(incomes, eq(incomeEntries.incomeId, incomes.id))
      .innerJoin(incomeCategories, eq(incomes.incomeCategoryId, incomeCategories.id))
      .where(eq(incomeEntries.destinationWalletId, walletId));

    // Fetch expense payments
    const expenseData = await db
      .select({
        id: expensePayments.id,
        expenseId: expensePayments.expenseId,
        expenseName: expenses.name,
        categoryName: expenseCategories.name,
        sourceWalletId: expensePayments.sourceWalletId,
        amount: expensePayments.amount,
        dueDate: expensePayments.dueDate,
        paidDate: expensePayments.paidDate,
        notes: expensePayments.notes,
        createdAt: expensePayments.createdAt,
      })
      .from(expensePayments)
      .innerJoin(expenses, eq(expensePayments.expenseId, expenses.id))
      .innerJoin(expenseCategories, eq(expenses.expenseCategoryId, expenseCategories.id))
      .where(eq(expensePayments.sourceWalletId, walletId));

    // Combine and sort by date
    const allTransactions = [...incomeData, ...expenseData].sort(
      (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    );

    res.json({
      walletId,
      transactions: allTransactions,
      total: allTransactions.length,
      incomeCount: incomeData.length,
      expenseCount: expenseData.length,
    });
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const walletId = parseRouteParam(req.params.id);
  if (isNaN(walletId)) {
    return res.status(400).json({ error: "Invalid wallet ID" });
  }

  try {
    const [walletRecord] = await db
      .select({ wallet: wallets, category: walletCategories })
      .from(wallets)
      .leftJoin(walletCategories, eq(wallets.walletCategoryId, walletCategories.id))
      .where(eq(wallets.id, walletId));

    if (!walletRecord) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const access = await checkCanvasPermission(walletRecord.wallet.canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

    const subWalletRows = await db
      .select({ subWallet: subWallets, currency: currencies })
      .from(subWallets)
      .leftJoin(currencies, eq(subWallets.currencyId, currencies.id))
      .where(eq(subWallets.walletId, walletId));

    res.json({
      wallet: {
        ...walletRecord.wallet,
        category: walletRecord.category,
        subWallets: subWalletRows.map((b) => ({
          ...b.subWallet,
          currency: b.currency,
        })),
      },
    });
  } catch (err) {
    console.error("Error fetching wallet:", err);
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

// GET all sub-wallets for a wallet
router.get("/:walletId/sub-wallets", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const walletId = parseRouteParam(req.params.walletId);
  if (isNaN(walletId)) return res.status(400).json({ error: "Invalid wallet ID" });

  try {
    const { access } = await checkWalletPermission(walletId, user.id, "view");
    if (!access?.allowed) {
      return denyPermission(res, access ?? { allowed: false, status: 403, error: "Access denied to this canvas" });
    }

    const subWalletRows = await db
      .select({ subWallet: subWallets, currency: currencies })
      .from(subWallets)
      .leftJoin(currencies, eq(subWallets.currencyId, currencies.id))
      .where(eq(subWallets.walletId, walletId));

    res.json({
      subWallets: subWalletRows.map((row) => ({
        ...row.subWallet,
        currency: row.currency,
      })),
    });
  } catch (err) {
    console.error("Error fetching sub-wallets:", err);
    res.status(500).json({ error: "Failed to fetch sub-wallets" });
  }
});

export default router;
