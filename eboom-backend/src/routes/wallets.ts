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
  canvasMembers,
  walletCategories,
  subWallets,
  currencies,
} from "../db/schema";

const router = express.Router();

async function checkWalletAccess(walletId: number, userId: number): Promise<boolean> {
  const [wallet] = await db
    .select()
    .from(wallets)
    .innerJoin(canvasMembers, eq(wallets.canvasId, canvasMembers.canvasId))
    .where(and(eq(wallets.id, walletId), eq(canvasMembers.userId, userId)));
  return !!wallet;
}

async function checkCanvasAccess(canvasId: number, userId: number): Promise<boolean> {
  const [membership] = await db
    .select()
    .from(canvasMembers)
    .where(and(eq(canvasMembers.canvasId, canvasId), eq(canvasMembers.userId, userId)));
  return !!membership;
}

router.get("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const walletId = parseInt(req.params.id, 10);
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

    const hasAccess = await checkCanvasAccess(walletRecord.wallet.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

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

  const walletId = parseInt(req.params.id, 10);
  if (isNaN(walletId)) {
    return res.status(400).json({ error: "Invalid wallet ID" });
  }

  const { name, walletCategoryId, description, photoUrl, isArchived } = req.body;

  try {
    const [existing] = await db.select().from(wallets).where(eq(wallets.id, walletId));
    if (!existing) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const hasAccess = await checkCanvasAccess(existing.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

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

  const walletId = parseInt(req.params.id, 10);
  if (isNaN(walletId)) {
    return res.status(400).json({ error: "Invalid wallet ID" });
  }

  try {
    const [existing] = await db.select().from(wallets).where(eq(wallets.id, walletId));
    if (!existing) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const hasAccess = await checkCanvasAccess(existing.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    await db
      .update(wallets)
      .set({
        isArchived: true,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(wallets.id, walletId));

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

  const walletId = parseInt(req.params.walletId, 10);
  if (isNaN(walletId)) return res.status(400).json({ error: "Invalid wallet ID" });

  try {
    const hasAccess = await checkWalletAccess(walletId, user.id);
    if (!hasAccess) return res.status(403).json({ error: "Access denied" });

    const entries = await db
      .select({
        id: incomeEntries.id,
        incomeId: incomeEntries.incomeId,
        incomeName: incomes.name,
        categoryName: incomeCategories.name,
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

  const walletId = parseInt(req.params.walletId, 10);
  if (isNaN(walletId)) return res.status(400).json({ error: "Invalid wallet ID" });

  try {
    const hasAccess = await checkWalletAccess(walletId, user.id);
    if (!hasAccess) return res.status(403).json({ error: "Access denied" });

    const payments = await db
      .select({
        id: expensePayments.id,
        expenseId: expensePayments.expenseId,
        expenseName: expenses.name,
        categoryName: expenseCategories.name,
        amount: expensePayments.amount,
        paymentDate: expensePayments.paidDate,
        notes: expensePayments.notes,
        createdAt: expensePayments.createdAt,
      })
      .from(expensePayments)
      .innerJoin(expenses, eq(expensePayments.expenseId, expenses.id))
      .innerJoin(expenseCategories, eq(expenses.expenseCategoryId, expenseCategories.id))
      .where(eq(expenses.defaultWalletId, walletId));

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

  const walletId = parseInt(req.params.walletId, 10);
  if (isNaN(walletId)) return res.status(400).json({ error: "Invalid wallet ID" });

  try {
    const hasAccess = await checkWalletAccess(walletId, user.id);
    if (!hasAccess) return res.status(403).json({ error: "Access denied" });

    // Fetch income entries
    const incomeData = await db
      .select({
        id: incomeEntries.id,
        incomeId: incomeEntries.incomeId,
        incomeName: incomes.name,
        categoryName: incomeCategories.name,
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
        amount: expensePayments.amount,
        paymentDate: expensePayments.paidDate,
        notes: expensePayments.notes,
        createdAt: expensePayments.createdAt,
      })
      .from(expensePayments)
      .innerJoin(expenses, eq(expensePayments.expenseId, expenses.id))
      .innerJoin(expenseCategories, eq(expenses.expenseCategoryId, expenseCategories.id))
      .where(eq(expenses.defaultWalletId, walletId));

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

  const walletId = parseInt(req.params.id, 10);
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

    const hasAccess = await checkCanvasAccess(walletRecord.wallet.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

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

  const walletId = parseInt(req.params.walletId, 10);
  if (isNaN(walletId)) return res.status(400).json({ error: "Invalid wallet ID" });

  try {
    const hasAccess = await checkWalletAccess(walletId, user.id);
    if (!hasAccess) return res.status(403).json({ error: "Access denied" });

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
