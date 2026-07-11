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
import { ErrorKeys } from "../errors/errorKeys";
import { sendError } from "../errors/sendError";

const router = express.Router({ mergeParams: true });

router.get(
  "/:walletId/income-entries",
  requireCanvasAccess("view"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const walletId = parseRouteParam(req.params.walletId);
    if (Number.isNaN(walletId)) {
      return sendError(res, ErrorKeys.validation.invalidWallet, 400);
    }

    try {
      const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
      if (!wallet || wallet.canvasId !== canvasId) {
        return sendError(res, ErrorKeys.wallet.notFound, 404);
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
          currencyId: currencies.id,
          currencyCode: currencies.code,
          currencySymbol: currencies.symbol,
        })
        .from(incomeEntries)
        .innerJoin(incomes, eq(incomeEntries.incomeId, incomes.id))
        .innerJoin(incomeCategories, eq(incomes.incomeCategoryId, incomeCategories.id))
        .innerJoin(currencies, eq(incomes.currencyId, currencies.id))
        .where(eq(incomeEntries.destinationWalletId, walletId));

      res.json({
        walletId,
        incomeEntries: entries,
        total: entries.length,
      });
    } catch (err) {
      console.error("Error fetching income entries:", err);
      sendError(res, ErrorKeys.income.entryFetchFailed, 500);
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
      return sendError(res, ErrorKeys.validation.invalidWallet, 400);
    }

    try {
      const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
      if (!wallet || wallet.canvasId !== canvasId) {
        return sendError(res, ErrorKeys.wallet.notFound, 404);
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
          currencyId: currencies.id,
          currencyCode: currencies.code,
          currencySymbol: currencies.symbol,
        })
        .from(expensePayments)
        .innerJoin(expenses, eq(expensePayments.expenseId, expenses.id))
        .innerJoin(expenseCategories, eq(expenses.expenseCategoryId, expenseCategories.id))
        .innerJoin(currencies, eq(expenses.currencyId, currencies.id))
        .where(eq(expensePayments.sourceWalletId, walletId));

      res.json({
        walletId,
        expensePayments: payments,
        total: payments.length,
      });
    } catch (err) {
      console.error("Error fetching expense payments:", err);
      sendError(res, ErrorKeys.expense.paymentFetchFailed, 500);
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
      return sendError(res, ErrorKeys.validation.invalidWallet, 400);
    }

    try {
      const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
      if (!wallet || wallet.canvasId !== canvasId) {
        return sendError(res, ErrorKeys.wallet.notFound, 404);
      }

      const transfersList = await listTransfersForWallet(walletId);
      res.json({
        walletId,
        transfers: transfersList,
        total: transfersList.length,
      });
    } catch (err) {
      console.error("Error fetching wallet transfers:", err);
      sendError(res, ErrorKeys.transfer.fetchFailed, 500);
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
      return sendError(res, ErrorKeys.validation.invalidWallet, 400);
    }

    try {
      const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
      if (!wallet || wallet.canvasId !== canvasId) {
        return sendError(res, ErrorKeys.wallet.notFound, 404);
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
          currencyId: currencies.id,
          currencyCode: currencies.code,
          currencySymbol: currencies.symbol,
        })
        .from(incomeEntries)
        .innerJoin(incomes, eq(incomeEntries.incomeId, incomes.id))
        .innerJoin(incomeCategories, eq(incomes.incomeCategoryId, incomeCategories.id))
        .innerJoin(currencies, eq(incomes.currencyId, currencies.id))
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
          currencyId: currencies.id,
          currencyCode: currencies.code,
          currencySymbol: currencies.symbol,
        })
        .from(expensePayments)
        .innerJoin(expenses, eq(expensePayments.expenseId, expenses.id))
        .innerJoin(expenseCategories, eq(expenses.expenseCategoryId, expenseCategories.id))
        .innerJoin(currencies, eq(expenses.currencyId, currencies.id))
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
      sendError(res, ErrorKeys.common.internal, 500);
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
      return sendError(res, ErrorKeys.validation.invalidWallet, 400);
    }

    try {
      const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
      if (!wallet || wallet.canvasId !== canvasId) {
        return sendError(res, ErrorKeys.wallet.notFound, 404);
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
      sendError(res, ErrorKeys.wallet.fetchFailed, 500);
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
    sendError(res, ErrorKeys.wallet.fetchFailed, 500);
  }
});

router.post("/", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;

  const { name, walletCategoryId, description, photoUrl } = req.body;

  if (!name || !walletCategoryId) {
    return sendError(res, ErrorKeys.validation.failed, 400);
  }

  const parsedWalletCategoryId = Number(walletCategoryId);
  if (Number.isNaN(parsedWalletCategoryId)) {
    return sendError(res, ErrorKeys.common.invalidId, 400);
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
    sendError(res, ErrorKeys.wallet.createFailed, 500);
  }
});

router.get("/:walletId", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const walletId = parseRouteParam(req.params.walletId);
  if (Number.isNaN(walletId)) {
    return sendError(res, ErrorKeys.validation.invalidWallet, 400);
  }

  try {
    const [walletRecord] = await db
      .select({ wallet: wallets, category: walletCategories })
      .from(wallets)
      .leftJoin(walletCategories, eq(wallets.walletCategoryId, walletCategories.id))
      .where(eq(wallets.id, walletId));

    if (!walletRecord || walletRecord.wallet.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.wallet.notFound, 404);
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
    sendError(res, ErrorKeys.wallet.fetchFailed, 500);
  }
});

router.put("/:walletId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const walletId = parseRouteParam(req.params.walletId);
  if (Number.isNaN(walletId)) {
    return sendError(res, ErrorKeys.validation.invalidWallet, 400);
  }

  const { name, walletCategoryId, description, photoUrl, isArchived } = req.body;

  try {
    const [existing] = await db.select().from(wallets).where(eq(wallets.id, walletId));
    if (!existing || existing.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.wallet.notFound, 404);
    }

    const parsedWalletCategoryId =
      walletCategoryId !== undefined ? Number(walletCategoryId) : undefined;
    if (parsedWalletCategoryId !== undefined && Number.isNaN(parsedWalletCategoryId)) {
      return sendError(res, ErrorKeys.common.invalidId, 400);
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
    sendError(res, ErrorKeys.wallet.updateFailed, 500);
  }
});

router.delete("/:walletId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const walletId = parseRouteParam(req.params.walletId);
  if (Number.isNaN(walletId)) {
    return sendError(res, ErrorKeys.validation.invalidWallet, 400);
  }

  try {
    const [existing] = await db.select().from(wallets).where(eq(wallets.id, walletId));
    if (!existing || existing.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.wallet.notFound, 404);
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
    sendError(res, ErrorKeys.wallet.deleteFailed, 500);
  }
});

export default router;
