import express, { Request, Response } from "express";
import { and, count, desc, eq, ilike } from "drizzle-orm";
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
import { registerWhiteboardNode, unregisterWhiteboardNode } from "../services/whiteboardService";
import { listTransfersForWallet } from "../services/transferService";
import { parseRouteParam } from "./routeParams";
import { requireCanvasAccess } from "../middleware/canvasAccess";
import { parseListQueryParams } from "./listQueryParams";

const router = express.Router({ mergeParams: true });

router.get(
  "/:walletId/income-entries",
  requireCanvasAccess("view"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const walletId = parseRouteParam(req.params.walletId);
    if (Number.isNaN(walletId)) {
      return res.status(400).json({ error: "Invalid wallet ID" });
    }

    try {
      const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
      if (!wallet || wallet.canvasId !== canvasId) {
        return res.status(404).json({ error: "Wallet not found" });
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
  }
);

router.get(
  "/:walletId/expense-payments",
  requireCanvasAccess("view"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const walletId = parseRouteParam(req.params.walletId);
    if (Number.isNaN(walletId)) {
      return res.status(400).json({ error: "Invalid wallet ID" });
    }

    try {
      const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
      if (!wallet || wallet.canvasId !== canvasId) {
        return res.status(404).json({ error: "Wallet not found" });
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
  }
);

router.get(
  "/:walletId/transfers",
  requireCanvasAccess("view"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const walletId = parseRouteParam(req.params.walletId);
    if (Number.isNaN(walletId)) {
      return res.status(400).json({ error: "Invalid wallet ID" });
    }

    try {
      const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
      if (!wallet || wallet.canvasId !== canvasId) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      const transfersList = await listTransfersForWallet(walletId);
      res.json({
        walletId,
        transfers: transfersList,
        total: transfersList.length,
      });
    } catch (err) {
      console.error("Error fetching wallet transfers:", err);
      res.status(500).json({ error: "Failed to fetch wallet transfers" });
    }
  }
);

router.get(
  "/:walletId/transactions",
  requireCanvasAccess("view"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const walletId = parseRouteParam(req.params.walletId);
    if (Number.isNaN(walletId)) {
      return res.status(400).json({ error: "Invalid wallet ID" });
    }

    try {
      const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
      if (!wallet || wallet.canvasId !== canvasId) {
        return res.status(404).json({ error: "Wallet not found" });
      }

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

      const transferData = (await listTransfersForWallet(walletId)).map((transfer) => ({
        type: "transfer" as const,
        id: transfer.id,
        sourceWalletId: transfer.sourceWalletId,
        sourceWalletName: transfer.sourceWalletName,
        destinationWalletId: transfer.destinationWalletId,
        destinationWalletName: transfer.destinationWalletName,
        sourceAmount: transfer.sourceAmount,
        destinationAmount: transfer.destinationAmount,
        sourceCurrencyCode: transfer.sourceCurrencyCode,
        sourceCurrencySymbol: transfer.sourceCurrencySymbol,
        destinationCurrencyCode: transfer.destinationCurrencyCode,
        destinationCurrencySymbol: transfer.destinationCurrencySymbol,
        exchangeRate: transfer.exchangeRate,
        transactionFee: transfer.transactionFee,
        transferDate: transfer.transferDate,
        notes: transfer.notes,
        createdAt: transfer.createdAt,
      }));

      const incomeTransactions = incomeData.map((row) => ({ type: "income_entry" as const, ...row }));
      const expenseTransactions = expenseData.map((row) => ({ type: "expense_payment" as const, ...row }));

      const allTransactions = [...incomeTransactions, ...expenseTransactions, ...transferData].sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );

      res.json({
        walletId,
        transactions: allTransactions,
        total: allTransactions.length,
        incomeCount: incomeData.length,
        expenseCount: expenseData.length,
        transferCount: transferData.length,
      });
    } catch (err) {
      console.error("Error fetching transactions:", err);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  }
);

router.get(
  "/:walletId/sub-wallets",
  requireCanvasAccess("view"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const walletId = parseRouteParam(req.params.walletId);
    if (Number.isNaN(walletId)) {
      return res.status(400).json({ error: "Invalid wallet ID" });
    }

    try {
      const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
      if (!wallet || wallet.canvasId !== canvasId) {
        return res.status(404).json({ error: "Wallet not found" });
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
  }
);

router.get("/", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  try {
    const { page, limit, search, offset, categoryId } = parseListQueryParams(req);

    const conditions = [
      eq(wallets.canvasId, canvasId),
      eq(wallets.isArchived, false),
    ];

    if (search) {
      conditions.push(ilike(wallets.name, `%${search}%`));
    }
    if (categoryId !== undefined) {
      conditions.push(eq(wallets.walletCategoryId, categoryId));
    }

    const whereCondition = and(...conditions);

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

router.post("/", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;

  const { name, walletCategoryId, description, photoUrl } = req.body;

  if (!name || !walletCategoryId) {
    return res.status(400).json({
      error: "Wallet name and category are required",
    });
  }

  const parsedWalletCategoryId = Number(walletCategoryId);
  if (Number.isNaN(parsedWalletCategoryId)) {
    return res.status(400).json({ error: "Invalid wallet category ID" });
  }

  try {
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

router.get("/:walletId", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const walletId = parseRouteParam(req.params.walletId);
  if (Number.isNaN(walletId)) {
    return res.status(400).json({ error: "Invalid wallet ID" });
  }

  try {
    const [walletRecord] = await db
      .select({ wallet: wallets, category: walletCategories })
      .from(wallets)
      .leftJoin(walletCategories, eq(wallets.walletCategoryId, walletCategories.id))
      .where(eq(wallets.id, walletId));

    if (!walletRecord || walletRecord.wallet.canvasId !== canvasId) {
      return res.status(404).json({ error: "Wallet not found" });
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

router.put("/:walletId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const walletId = parseRouteParam(req.params.walletId);
  if (Number.isNaN(walletId)) {
    return res.status(400).json({ error: "Invalid wallet ID" });
  }

  const { name, walletCategoryId, description, photoUrl, isArchived } = req.body;

  try {
    const [existing] = await db.select().from(wallets).where(eq(wallets.id, walletId));
    if (!existing || existing.canvasId !== canvasId) {
      return res.status(404).json({ error: "Wallet not found" });
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

router.delete("/:walletId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const walletId = parseRouteParam(req.params.walletId);
  if (Number.isNaN(walletId)) {
    return res.status(400).json({ error: "Invalid wallet ID" });
  }

  try {
    const [existing] = await db.select().from(wallets).where(eq(wallets.id, walletId));
    if (!existing || existing.canvasId !== canvasId) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    await db
      .update(wallets)
      .set({
        isArchived: true,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(wallets.id, walletId));

    await unregisterWhiteboardNode(canvasId, "wallet", walletId);

    res.json({ message: "Wallet archived successfully" });
  } catch (err) {
    console.error("Error deleting wallet:", err);
    res.status(500).json({ error: "Failed to delete wallet" });
  }
});

export default router;
