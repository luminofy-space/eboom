import { and, count, countDistinct, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/client";
import {
  assets,
  assetCategories,
  assetVolumes,
  currencies,
  expenseCategories,
  expensePayments as expensePaymentsTable,
  expenses,
  incomeCategories,
  incomeEntries as incomeEntriesTable,
  incomes,
  pricePoints,
  subWallets,
  transfers as transfersTable,
  wallets,
} from "../db/schema";
import { alias } from "drizzle-orm/pg-core";
import type { EnrichedTransfer } from "./transferService";
import {
  deriveAssetValuation,
  formatMoneyNumber,
  type PricePointInput,
  type VolumeInput,
} from "../utils/assetValuation";

export interface CanvasSummaryWalletBalance {
  walletId: number;
  walletName: string;
  currencyCode: string;
  currencySymbol: string;
  balance: string;
}

export interface CanvasSummaryIncomeEntry {
  id: number;
  incomeId: number;
  incomeName: string;
  categoryName: string | null;
  destinationWalletId: number;
  amount: string;
  expectedDate: string | null;
  receivedDate: string | null;
  notes: string | null;
  createdAt: string;
  currencyCode: string;
  currencySymbol: string;
}

export interface CanvasSummaryExpensePayment {
  id: number;
  expenseId: number;
  expenseName: string;
  categoryName: string | null;
  sourceWalletId: number;
  amount: string;
  dueDate: string | null;
  paidDate: string | null;
  notes: string | null;
  createdAt: string;
  currencyCode: string;
  currencySymbol: string;
}

export type RecentActivityStatus = "received" | "pending" | "paid" | "due";

export interface CanvasSummaryRecentActivity {
  id: number;
  type: "income_entry" | "expense_payment" | "transfer";
  entityId: number;
  entityName: string;
  amount: string;
  currencySymbol: string;
  currencyCode: string;
  date: string | null;
  status: RecentActivityStatus;
  secondaryAmount?: string;
  secondaryCurrencySymbol?: string;
  secondaryCurrencyCode?: string;
}

export interface CanvasSummaryCurrencyBreakdown {
  currencyCode: string;
  currencySymbol: string;
  walletCount: number;
  incomeCount: number;
  expenseCount: number;
  assetCount: number;
}

export interface CanvasSummaryAssetSummary {
  id: number;
  name: string;
  categoryName: string | null;
  currencyCode: string;
  currencySymbol: string;
  currentHoldingValue: string;
  unrealizedPnL: string;
  photoUrl: string | null;
  lastModifiedAt: string;
}

export interface CanvasSummaryAssetsByCurrency {
  currencyCode: string;
  currencySymbol: string;
  totalHoldingValue: string;
  count: number;
}

export interface CanvasSummary {
  counts: { wallets: number; incomes: number; expenses: number; assets: number };
  currencyBreakdown: CanvasSummaryCurrencyBreakdown[];
  walletBalances: CanvasSummaryWalletBalance[];
  incomeEntries: CanvasSummaryIncomeEntry[];
  expensePayments: CanvasSummaryExpensePayment[];
  recentActivity: CanvasSummaryRecentActivity[];
  assetSummaries: CanvasSummaryAssetSummary[];
  assetsByCurrency: CanvasSummaryAssetsByCurrency[];
}

function toIsoString(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function getEntryStatus(receivedDate: string | null): RecentActivityStatus {
  return receivedDate ? "received" : "pending";
}

function getPaymentStatus(paidDate: string | null, dueDate: string | null): RecentActivityStatus {
  if (paidDate) return "paid";
  if (dueDate && new Date(dueDate) < new Date()) return "due";
  return "pending";
}

function getActivitySortDate(
  primary: string | null,
  fallback: string | null,
  createdAt: string
): number {
  const dateStr = primary ?? fallback ?? createdAt;
  return new Date(dateStr).getTime();
}

function mergeCurrencyBreakdown(
  walletRows: Array<{ currencyCode: string; currencySymbol: string; walletCount: number }>,
  incomeRows: Array<{ currencyCode: string; currencySymbol: string; incomeCount: number }>,
  expenseRows: Array<{ currencyCode: string; currencySymbol: string; expenseCount: number }>,
  assetRows: Array<{ currencyCode: string; currencySymbol: string; assetCount: number }>
): CanvasSummaryCurrencyBreakdown[] {
  const map = new Map<string, CanvasSummaryCurrencyBreakdown>();

  const ensure = (code: string, symbol: string) => {
    if (!map.has(code)) {
      map.set(code, {
        currencyCode: code,
        currencySymbol: symbol,
        walletCount: 0,
        incomeCount: 0,
        expenseCount: 0,
        assetCount: 0,
      });
    }
    return map.get(code)!;
  };

  for (const row of walletRows) {
    const entry = ensure(row.currencyCode, row.currencySymbol);
    entry.walletCount = row.walletCount;
  }
  for (const row of incomeRows) {
    const entry = ensure(row.currencyCode, row.currencySymbol);
    entry.incomeCount = row.incomeCount;
  }
  for (const row of expenseRows) {
    const entry = ensure(row.currencyCode, row.currencySymbol);
    entry.expenseCount = row.expenseCount;
  }
  for (const row of assetRows) {
    const entry = ensure(row.currencyCode, row.currencySymbol);
    entry.assetCount = row.assetCount;
  }

  return Array.from(map.values()).sort((a, b) =>
    a.currencyCode.localeCompare(b.currencyCode)
  );
}

const dashSourceSubWallet = alias(subWallets, "dash_source_sub_wallet");
const dashDestSubWallet = alias(subWallets, "dash_dest_sub_wallet");
const dashSourceWallet = alias(wallets, "dash_source_wallet");
const dashDestWallet = alias(wallets, "dash_dest_wallet");
const dashSourceCurrency = alias(currencies, "dash_source_currency");
const dashDestCurrency = alias(currencies, "dash_dest_currency");

const txDestWallet = alias(wallets, "tx_dest_wallet");
const txSourceWallet = alias(wallets, "tx_source_wallet");

export interface CanvasTransactionsIncomeEntry extends CanvasSummaryIncomeEntry {
  destinationWalletName: string;
}

export interface CanvasTransactionsExpensePayment extends CanvasSummaryExpensePayment {
  sourceWalletName: string;
}

export interface CanvasTransactions {
  incomeEntries: CanvasTransactionsIncomeEntry[];
  expensePayments: CanvasTransactionsExpensePayment[];
  transfers: EnrichedTransfer[];
  total: { entries: number; payments: number; transfers: number };
}

export async function fetchCanvasIncomeEntries(
  canvasId: number
): Promise<CanvasSummaryIncomeEntry[]> {
  const incomeEntryRows = await db
    .select({
      id: incomeEntriesTable.id,
      incomeId: incomeEntriesTable.incomeId,
      incomeName: incomes.name,
      categoryName: incomeCategories.name,
      destinationWalletId: incomeEntriesTable.destinationWalletId,
      amount: incomeEntriesTable.amount,
      expectedDate: incomeEntriesTable.expectedDate,
      receivedDate: incomeEntriesTable.receivedDate,
      notes: incomeEntriesTable.notes,
      createdAt: incomeEntriesTable.createdAt,
      currencyCode: currencies.code,
      currencySymbol: currencies.symbol,
    })
    .from(incomeEntriesTable)
    .innerJoin(incomes, eq(incomeEntriesTable.incomeId, incomes.id))
    .leftJoin(incomeCategories, eq(incomes.incomeCategoryId, incomeCategories.id))
    .innerJoin(currencies, eq(incomes.currencyId, currencies.id))
    .where(and(eq(incomes.canvasId, canvasId), eq(incomes.isArchived, false)));

  return incomeEntryRows.map((row) => ({
    id: row.id,
    incomeId: row.incomeId,
    incomeName: row.incomeName,
    categoryName: row.categoryName,
    destinationWalletId: row.destinationWalletId,
    amount: String(row.amount),
    expectedDate: toIsoString(row.expectedDate),
    receivedDate: toIsoString(row.receivedDate),
    notes: row.notes,
    createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
    currencyCode: row.currencyCode,
    currencySymbol: row.currencySymbol,
  }));
}

export async function fetchCanvasExpensePayments(
  canvasId: number
): Promise<CanvasSummaryExpensePayment[]> {
  const expensePaymentRows = await db
    .select({
      id: expensePaymentsTable.id,
      expenseId: expensePaymentsTable.expenseId,
      expenseName: expenses.name,
      categoryName: expenseCategories.name,
      sourceWalletId: expensePaymentsTable.sourceWalletId,
      amount: expensePaymentsTable.amount,
      dueDate: expensePaymentsTable.dueDate,
      paidDate: expensePaymentsTable.paidDate,
      notes: expensePaymentsTable.notes,
      createdAt: expensePaymentsTable.createdAt,
      currencyCode: currencies.code,
      currencySymbol: currencies.symbol,
    })
    .from(expensePaymentsTable)
    .innerJoin(expenses, eq(expensePaymentsTable.expenseId, expenses.id))
    .leftJoin(expenseCategories, eq(expenses.expenseCategoryId, expenseCategories.id))
    .innerJoin(currencies, eq(expenses.currencyId, currencies.id))
    .where(and(eq(expenses.canvasId, canvasId), eq(expenses.isArchived, false)));

  return expensePaymentRows.map((row) => ({
    id: row.id,
    expenseId: row.expenseId,
    expenseName: row.expenseName,
    categoryName: row.categoryName,
    sourceWalletId: row.sourceWalletId,
    amount: String(row.amount),
    dueDate: toIsoString(row.dueDate),
    paidDate: toIsoString(row.paidDate),
    notes: row.notes,
    createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
    currencyCode: row.currencyCode,
    currencySymbol: row.currencySymbol,
  }));
}

async function fetchCanvasIncomeEntriesWithWalletNames(
  canvasId: number
): Promise<CanvasTransactionsIncomeEntry[]> {
  const incomeEntryRows = await db
    .select({
      id: incomeEntriesTable.id,
      incomeId: incomeEntriesTable.incomeId,
      incomeName: incomes.name,
      categoryName: incomeCategories.name,
      destinationWalletId: incomeEntriesTable.destinationWalletId,
      destinationWalletName: txDestWallet.name,
      amount: incomeEntriesTable.amount,
      expectedDate: incomeEntriesTable.expectedDate,
      receivedDate: incomeEntriesTable.receivedDate,
      notes: incomeEntriesTable.notes,
      createdAt: incomeEntriesTable.createdAt,
      currencyCode: currencies.code,
      currencySymbol: currencies.symbol,
    })
    .from(incomeEntriesTable)
    .innerJoin(incomes, eq(incomeEntriesTable.incomeId, incomes.id))
    .leftJoin(incomeCategories, eq(incomes.incomeCategoryId, incomeCategories.id))
    .innerJoin(currencies, eq(incomes.currencyId, currencies.id))
    .innerJoin(txDestWallet, eq(incomeEntriesTable.destinationWalletId, txDestWallet.id))
    .where(and(eq(incomes.canvasId, canvasId), eq(incomes.isArchived, false)));

  return incomeEntryRows.map((row) => ({
    id: row.id,
    incomeId: row.incomeId,
    incomeName: row.incomeName,
    categoryName: row.categoryName,
    destinationWalletId: row.destinationWalletId,
    destinationWalletName: row.destinationWalletName,
    amount: String(row.amount),
    expectedDate: toIsoString(row.expectedDate),
    receivedDate: toIsoString(row.receivedDate),
    notes: row.notes,
    createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
    currencyCode: row.currencyCode,
    currencySymbol: row.currencySymbol,
  }));
}

async function fetchCanvasExpensePaymentsWithWalletNames(
  canvasId: number
): Promise<CanvasTransactionsExpensePayment[]> {
  const expensePaymentRows = await db
    .select({
      id: expensePaymentsTable.id,
      expenseId: expensePaymentsTable.expenseId,
      expenseName: expenses.name,
      categoryName: expenseCategories.name,
      sourceWalletId: expensePaymentsTable.sourceWalletId,
      sourceWalletName: txSourceWallet.name,
      amount: expensePaymentsTable.amount,
      dueDate: expensePaymentsTable.dueDate,
      paidDate: expensePaymentsTable.paidDate,
      notes: expensePaymentsTable.notes,
      createdAt: expensePaymentsTable.createdAt,
      currencyCode: currencies.code,
      currencySymbol: currencies.symbol,
    })
    .from(expensePaymentsTable)
    .innerJoin(expenses, eq(expensePaymentsTable.expenseId, expenses.id))
    .leftJoin(expenseCategories, eq(expenses.expenseCategoryId, expenseCategories.id))
    .innerJoin(currencies, eq(expenses.currencyId, currencies.id))
    .innerJoin(txSourceWallet, eq(expensePaymentsTable.sourceWalletId, txSourceWallet.id))
    .where(and(eq(expenses.canvasId, canvasId), eq(expenses.isArchived, false)));

  return expensePaymentRows.map((row) => ({
    id: row.id,
    expenseId: row.expenseId,
    expenseName: row.expenseName,
    categoryName: row.categoryName,
    sourceWalletId: row.sourceWalletId,
    sourceWalletName: row.sourceWalletName,
    amount: String(row.amount),
    dueDate: toIsoString(row.dueDate),
    paidDate: toIsoString(row.paidDate),
    notes: row.notes,
    createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
    currencyCode: row.currencyCode,
    currencySymbol: row.currencySymbol,
  }));
}

export async function getCanvasTransactions(canvasId: number): Promise<CanvasTransactions> {
  const { listTransfersForCanvas } = await import("./transferService");

  const [incomeEntries, expensePayments, transfers] = await Promise.all([
    fetchCanvasIncomeEntriesWithWalletNames(canvasId),
    fetchCanvasExpensePaymentsWithWalletNames(canvasId),
    listTransfersForCanvas(canvasId),
  ]);

  return {
    incomeEntries,
    expensePayments,
    transfers,
    total: {
      entries: incomeEntries.length,
      payments: expensePayments.length,
      transfers: transfers.length,
    },
  };
}

export type CanvasTransactionType = "incomeEntries" | "expensePayments" | "transfers";

const canvasIncomeWhere = (canvasId: number) =>
  and(eq(incomes.canvasId, canvasId), eq(incomes.isArchived, false));

const canvasExpenseWhere = (canvasId: number) =>
  and(eq(expenses.canvasId, canvasId), eq(expenses.isArchived, false));

export async function getPaginatedCanvasTransactions(
  canvasId: number,
  type: CanvasTransactionType,
  page: number,
  limit: number
) {
  const offset = (page - 1) * limit;

  if (type === "incomeEntries") {
    const whereCondition = canvasIncomeWhere(canvasId);
    const orderByDate = desc(
      sql`COALESCE(${incomeEntriesTable.receivedDate}, ${incomeEntriesTable.expectedDate}, ${incomeEntriesTable.createdAt})`
    );

    const [{ total }] = await db
      .select({ total: count() })
      .from(incomeEntriesTable)
      .innerJoin(incomes, eq(incomeEntriesTable.incomeId, incomes.id))
      .where(whereCondition);

    const rows = await db
      .select({
        id: incomeEntriesTable.id,
        incomeId: incomeEntriesTable.incomeId,
        incomeName: incomes.name,
        categoryName: incomeCategories.name,
        destinationWalletId: incomeEntriesTable.destinationWalletId,
        destinationWalletName: txDestWallet.name,
        amount: incomeEntriesTable.amount,
        expectedDate: incomeEntriesTable.expectedDate,
        receivedDate: incomeEntriesTable.receivedDate,
        notes: incomeEntriesTable.notes,
        createdAt: incomeEntriesTable.createdAt,
        currencyCode: currencies.code,
        currencySymbol: currencies.symbol,
      })
      .from(incomeEntriesTable)
      .innerJoin(incomes, eq(incomeEntriesTable.incomeId, incomes.id))
      .leftJoin(incomeCategories, eq(incomes.incomeCategoryId, incomeCategories.id))
      .innerJoin(currencies, eq(incomes.currencyId, currencies.id))
      .innerJoin(txDestWallet, eq(incomeEntriesTable.destinationWalletId, txDestWallet.id))
      .where(whereCondition)
      .orderBy(orderByDate)
      .limit(limit)
      .offset(offset);

    const items = rows.map((row) => ({
      id: row.id,
      incomeId: row.incomeId,
      incomeName: row.incomeName,
      categoryName: row.categoryName,
      destinationWalletId: row.destinationWalletId,
      destinationWalletName: row.destinationWalletName,
      amount: String(row.amount),
      expectedDate: toIsoString(row.expectedDate),
      receivedDate: toIsoString(row.receivedDate),
      notes: row.notes,
      createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
      currencyCode: row.currencyCode,
      currencySymbol: row.currencySymbol,
    }));

    return { incomeEntries: items, items, total, page, limit };
  }

  if (type === "expensePayments") {
    const whereCondition = canvasExpenseWhere(canvasId);
    const orderByDate = desc(
      sql`COALESCE(${expensePaymentsTable.paidDate}, ${expensePaymentsTable.dueDate}, ${expensePaymentsTable.createdAt})`
    );

    const [{ total }] = await db
      .select({ total: count() })
      .from(expensePaymentsTable)
      .innerJoin(expenses, eq(expensePaymentsTable.expenseId, expenses.id))
      .where(whereCondition);

    const rows = await db
      .select({
        id: expensePaymentsTable.id,
        expenseId: expensePaymentsTable.expenseId,
        expenseName: expenses.name,
        categoryName: expenseCategories.name,
        sourceWalletId: expensePaymentsTable.sourceWalletId,
        sourceWalletName: txSourceWallet.name,
        amount: expensePaymentsTable.amount,
        dueDate: expensePaymentsTable.dueDate,
        paidDate: expensePaymentsTable.paidDate,
        notes: expensePaymentsTable.notes,
        createdAt: expensePaymentsTable.createdAt,
        currencyCode: currencies.code,
        currencySymbol: currencies.symbol,
      })
      .from(expensePaymentsTable)
      .innerJoin(expenses, eq(expensePaymentsTable.expenseId, expenses.id))
      .leftJoin(expenseCategories, eq(expenses.expenseCategoryId, expenseCategories.id))
      .innerJoin(currencies, eq(expenses.currencyId, currencies.id))
      .innerJoin(txSourceWallet, eq(expensePaymentsTable.sourceWalletId, txSourceWallet.id))
      .where(whereCondition)
      .orderBy(orderByDate)
      .limit(limit)
      .offset(offset);

    const items = rows.map((row) => ({
      id: row.id,
      expenseId: row.expenseId,
      expenseName: row.expenseName,
      categoryName: row.categoryName,
      sourceWalletId: row.sourceWalletId,
      sourceWalletName: row.sourceWalletName,
      amount: String(row.amount),
      dueDate: toIsoString(row.dueDate),
      paidDate: toIsoString(row.paidDate),
      notes: row.notes,
      createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
      currencyCode: row.currencyCode,
      currencySymbol: row.currencySymbol,
    }));

    return { expensePayments: items, items, total, page, limit };
  }

  const { listTransfersForCanvasPaginated } = await import("./transferService");
  const result = await listTransfersForCanvasPaginated(canvasId, page, limit);
  return {
    transfers: result.items,
    items: result.items,
    total: result.total,
    page: result.page,
    limit: result.limit,
  };
}

export async function getCanvasSummary(canvasId: number): Promise<CanvasSummary> {
  const [
    walletCountRow,
    incomeCountRow,
    expenseCountRow,
    assetCountRow,
    walletBreakdownRows,
    incomeBreakdownRows,
    expenseBreakdownRows,
    assetBreakdownRows,
  ] = await Promise.all([
    db
      .select({ total: count() })
      .from(wallets)
      .where(and(eq(wallets.canvasId, canvasId), eq(wallets.isArchived, false))),
    db
      .select({ total: count() })
      .from(incomes)
      .where(and(eq(incomes.canvasId, canvasId), eq(incomes.isArchived, false))),
    db
      .select({ total: count() })
      .from(expenses)
      .where(and(eq(expenses.canvasId, canvasId), eq(expenses.isArchived, false))),
    db
      .select({ total: count() })
      .from(assets)
      .where(and(eq(assets.canvasId, canvasId), eq(assets.isArchived, false))),
    db
      // walletCount = distinct parent wallets with a sub_wallet in this currency
      .select({
        currencyCode: currencies.code,
        currencySymbol: currencies.symbol,
        walletCount: countDistinct(wallets.id),
      })
      .from(subWallets)
      .innerJoin(wallets, eq(subWallets.walletId, wallets.id))
      .innerJoin(currencies, eq(subWallets.currencyId, currencies.id))
      .where(and(eq(wallets.canvasId, canvasId), eq(wallets.isArchived, false)))
      .groupBy(currencies.code, currencies.symbol),
    db
      .select({
        currencyCode: currencies.code,
        currencySymbol: currencies.symbol,
        incomeCount: count(),
      })
      .from(incomes)
      .innerJoin(currencies, eq(incomes.currencyId, currencies.id))
      .where(and(eq(incomes.canvasId, canvasId), eq(incomes.isArchived, false)))
      .groupBy(currencies.code, currencies.symbol),
    db
      .select({
        currencyCode: currencies.code,
        currencySymbol: currencies.symbol,
        expenseCount: count(),
      })
      .from(expenses)
      .innerJoin(currencies, eq(expenses.currencyId, currencies.id))
      .where(and(eq(expenses.canvasId, canvasId), eq(expenses.isArchived, false)))
      .groupBy(currencies.code, currencies.symbol),
    db
      .select({
        currencyCode: currencies.code,
        currencySymbol: currencies.symbol,
        assetCount: count(),
      })
      .from(assets)
      .innerJoin(currencies, eq(assets.currencyId, currencies.id))
      .where(and(eq(assets.canvasId, canvasId), eq(assets.isArchived, false)))
      .groupBy(currencies.code, currencies.symbol),
  ]);

  const currencyBreakdown = mergeCurrencyBreakdown(
    walletBreakdownRows.map((row) => ({
      currencyCode: row.currencyCode,
      currencySymbol: row.currencySymbol,
      walletCount: row.walletCount,
    })),
    incomeBreakdownRows.map((row) => ({
      currencyCode: row.currencyCode,
      currencySymbol: row.currencySymbol,
      incomeCount: row.incomeCount,
    })),
    expenseBreakdownRows.map((row) => ({
      currencyCode: row.currencyCode,
      currencySymbol: row.currencySymbol,
      expenseCount: row.expenseCount,
    })),
    assetBreakdownRows.map((row) => ({
      currencyCode: row.currencyCode,
      currencySymbol: row.currencySymbol,
      assetCount: row.assetCount,
    }))
  );

  const walletBalanceRows = await db
    // One row per sub_wallet; total liquid balance per currency is summed client-side
    .select({
      walletId: wallets.id,
      walletName: wallets.name,
      currencyCode: currencies.code,
      currencySymbol: currencies.symbol,
      balance: subWallets.amount,
    })
    .from(subWallets)
    .innerJoin(wallets, eq(subWallets.walletId, wallets.id))
    .innerJoin(currencies, eq(subWallets.currencyId, currencies.id))
    .where(and(eq(wallets.canvasId, canvasId), eq(wallets.isArchived, false)));

  const [incomeEntries, expensePayments] = await Promise.all([
    fetchCanvasIncomeEntries(canvasId),
    fetchCanvasExpensePayments(canvasId),
  ]);

  const transferRows = await db
    .select({
      id: transfersTable.id,
      sourceWalletName: dashSourceWallet.name,
      destinationWalletName: dashDestWallet.name,
      sourceAmount: transfersTable.sourceAmount,
      destinationAmount: transfersTable.destinationAmount,
      sourceCurrencyCode: dashSourceCurrency.code,
      sourceCurrencySymbol: dashSourceCurrency.symbol,
      destinationCurrencyCode: dashDestCurrency.code,
      destinationCurrencySymbol: dashDestCurrency.symbol,
      transferDate: transfersTable.transferDate,
      createdAt: transfersTable.createdAt,
    })
    .from(transfersTable)
    .innerJoin(dashSourceSubWallet, eq(transfersTable.sourceWalletId, dashSourceSubWallet.id))
    .innerJoin(dashSourceWallet, eq(dashSourceSubWallet.walletId, dashSourceWallet.id))
    .innerJoin(dashSourceCurrency, eq(dashSourceSubWallet.currencyId, dashSourceCurrency.id))
    .innerJoin(dashDestSubWallet, eq(transfersTable.destinationWalletId, dashDestSubWallet.id))
    .innerJoin(dashDestWallet, eq(dashDestSubWallet.walletId, dashDestWallet.id))
    .innerJoin(dashDestCurrency, eq(dashDestSubWallet.currencyId, dashDestCurrency.id))
    .where(eq(dashSourceWallet.canvasId, canvasId));

  const assetSummaryRows = await db
    .select({
      id: assets.id,
      name: assets.name,
      categoryName: assetCategories.name,
      currencyCode: currencies.code,
      currencySymbol: currencies.symbol,
      photoUrl: assets.photoUrl,
      lastModifiedAt: assets.lastModifiedAt,
    })
    .from(assets)
    .leftJoin(assetCategories, eq(assets.assetCategoryId, assetCategories.id))
    .innerJoin(currencies, eq(assets.currencyId, currencies.id))
    .where(and(eq(assets.canvasId, canvasId), eq(assets.isArchived, false)))
    .orderBy(desc(assets.lastModifiedAt))
    .limit(6);

  const allCanvasAssets = await db
    .select({
      id: assets.id,
      currencyCode: currencies.code,
      currencySymbol: currencies.symbol,
    })
    .from(assets)
    .innerJoin(currencies, eq(assets.currencyId, currencies.id))
    .where(and(eq(assets.canvasId, canvasId), eq(assets.isArchived, false)));

  const allAssetIds = allCanvasAssets.map((a) => a.id);
  const summaryAssetIds = assetSummaryRows.map((a) => a.id);
  const valuationAssetIds = [...new Set([...allAssetIds, ...summaryAssetIds])];

  const allVolumes =
    valuationAssetIds.length > 0
      ? await db.select().from(assetVolumes).where(inArray(assetVolumes.assetId, valuationAssetIds))
      : [];
  const allPoints =
    valuationAssetIds.length > 0
      ? await db.select().from(pricePoints).where(inArray(pricePoints.assetId, valuationAssetIds))
      : [];

  const volumesByAsset = new Map<number, VolumeInput[]>();
  for (const v of allVolumes) {
    const list = volumesByAsset.get(v.assetId) ?? [];
    list.push({
      id: v.id,
      quantity: v.quantity,
      unitPrice: v.unitPrice,
      recordedAt: v.recordedAt ?? new Date(0),
    });
    volumesByAsset.set(v.assetId, list);
  }
  const pointsByAsset = new Map<number, PricePointInput[]>();
  for (const p of allPoints) {
    const list = pointsByAsset.get(p.assetId) ?? [];
    list.push({
      id: p.id,
      unitPrice: p.unitPrice,
      recordedAt: p.recordedAt ?? new Date(0),
    });
    pointsByAsset.set(p.assetId, list);
  }

  const valuationByAsset = new Map(
    valuationAssetIds.map((id) => [
      id,
      deriveAssetValuation(volumesByAsset.get(id) ?? [], pointsByAsset.get(id) ?? []),
    ])
  );

  const assetsByCurrencyMap = new Map<
    string,
    { currencyCode: string; currencySymbol: string; totalHoldingValue: number; count: number }
  >();
  for (const asset of allCanvasAssets) {
    const derived = valuationByAsset.get(asset.id);
    const holdingValue = derived?.currentHoldingValue ?? 0;
    const existing = assetsByCurrencyMap.get(asset.currencyCode);
    if (existing) {
      existing.totalHoldingValue += holdingValue;
      existing.count += 1;
    } else {
      assetsByCurrencyMap.set(asset.currencyCode, {
        currencyCode: asset.currencyCode,
        currencySymbol: asset.currencySymbol,
        totalHoldingValue: holdingValue,
        count: 1,
      });
    }
  }
  const assetsByCurrencyRows = [...assetsByCurrencyMap.values()];

  const entryActivities: CanvasSummaryRecentActivity[] = incomeEntries.map((entry) => ({
    id: entry.id,
    type: "income_entry" as const,
    entityId: entry.incomeId,
    entityName: entry.incomeName,
    amount: entry.amount,
    currencySymbol: entry.currencySymbol,
    currencyCode: entry.currencyCode,
    date: entry.receivedDate ?? entry.expectedDate,
    status: getEntryStatus(entry.receivedDate),
  }));

  const paymentActivities: CanvasSummaryRecentActivity[] = expensePayments.map((payment) => ({
    id: payment.id,
    type: "expense_payment" as const,
    entityId: payment.expenseId,
    entityName: payment.expenseName,
    amount: payment.amount,
    currencySymbol: payment.currencySymbol,
    currencyCode: payment.currencyCode,
    date: payment.paidDate ?? payment.dueDate,
    status: getPaymentStatus(payment.paidDate, payment.dueDate),
  }));

  const transferActivities: CanvasSummaryRecentActivity[] = transferRows.map((transfer) => ({
    id: transfer.id,
    type: "transfer" as const,
    entityId: transfer.id,
    entityName: `${transfer.sourceWalletName} → ${transfer.destinationWalletName}`,
    amount: String(transfer.sourceAmount),
    currencySymbol: transfer.sourceCurrencySymbol,
    currencyCode: transfer.sourceCurrencyCode,
    secondaryAmount: String(transfer.destinationAmount),
    secondaryCurrencySymbol: transfer.destinationCurrencySymbol,
    secondaryCurrencyCode: transfer.destinationCurrencyCode,
    date: toIsoString(transfer.transferDate),
    status: "paid" as RecentActivityStatus,
  }));

  const recentActivity = [...entryActivities, ...paymentActivities, ...transferActivities]
    .sort((a, b) => {
      const aEntry = incomeEntries.find((e) => e.id === a.id && a.type === "income_entry");
      const bEntry = incomeEntries.find((e) => e.id === b.id && b.type === "income_entry");
      const aPayment = expensePayments.find((p) => p.id === a.id && a.type === "expense_payment");
      const bPayment = expensePayments.find((p) => p.id === b.id && b.type === "expense_payment");
      const aTransfer = transferRows.find((t) => t.id === a.id && a.type === "transfer");
      const bTransfer = transferRows.find((t) => t.id === b.id && b.type === "transfer");

      const aSort = a.type === "income_entry" && aEntry
        ? getActivitySortDate(aEntry.receivedDate, aEntry.expectedDate, aEntry.createdAt)
        : a.type === "expense_payment" && aPayment
          ? getActivitySortDate(aPayment.paidDate, aPayment.dueDate, aPayment.createdAt)
          : a.type === "transfer" && aTransfer
            ? getActivitySortDate(toIsoString(aTransfer.transferDate), null, toIsoString(aTransfer.createdAt) ?? new Date().toISOString())
            : 0;

      const bSort = b.type === "income_entry" && bEntry
        ? getActivitySortDate(bEntry.receivedDate, bEntry.expectedDate, bEntry.createdAt)
        : b.type === "expense_payment" && bPayment
          ? getActivitySortDate(bPayment.paidDate, bPayment.dueDate, bPayment.createdAt)
          : b.type === "transfer" && bTransfer
            ? getActivitySortDate(toIsoString(bTransfer.transferDate), null, toIsoString(bTransfer.createdAt) ?? new Date().toISOString())
            : 0;

      return bSort - aSort;
    })
    .slice(0, 15);

  return {
    counts: {
      wallets: walletCountRow[0]?.total ?? 0,
      incomes: incomeCountRow[0]?.total ?? 0,
      expenses: expenseCountRow[0]?.total ?? 0,
      assets: assetCountRow[0]?.total ?? 0,
    },
    currencyBreakdown,
    walletBalances: walletBalanceRows.map((row) => ({
      walletId: row.walletId,
      walletName: row.walletName,
      currencyCode: row.currencyCode,
      currencySymbol: row.currencySymbol,
      balance: String(row.balance),
    })),
    incomeEntries,
    expensePayments,
    recentActivity,
    assetSummaries: assetSummaryRows.map((row) => {
      const derived = valuationByAsset.get(row.id);
      return {
        id: row.id,
        name: row.name,
        categoryName: row.categoryName,
        currencyCode: row.currencyCode,
        currencySymbol: row.currencySymbol,
        currentHoldingValue: formatMoneyNumber(derived?.currentHoldingValue ?? 0),
        unrealizedPnL: formatMoneyNumber(derived?.unrealizedPnL ?? 0),
        photoUrl: row.photoUrl,
        lastModifiedAt: toIsoString(row.lastModifiedAt) ?? new Date().toISOString(),
      };
    }),
    assetsByCurrency: assetsByCurrencyRows.map((row) => ({
      currencyCode: row.currencyCode,
      currencySymbol: row.currencySymbol,
      totalHoldingValue: formatMoneyNumber(row.totalHoldingValue),
      count: row.count,
    })),
  };
}
