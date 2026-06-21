import { and, count, countDistinct, eq } from "drizzle-orm";
import { db } from "../db/client";
import {
  currencies,
  expenseCategories,
  expensePayments as expensePaymentsTable,
  expenses,
  incomeCategories,
  incomeEntries as incomeEntriesTable,
  incomes,
  subWallets,
  wallets,
} from "../db/schema";

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
  type: "income_entry" | "expense_payment";
  entityId: number;
  entityName: string;
  amount: string;
  currencySymbol: string;
  currencyCode: string;
  date: string | null;
  status: RecentActivityStatus;
}

export interface CanvasSummaryCurrencyBreakdown {
  currencyCode: string;
  currencySymbol: string;
  walletCount: number;
  incomeCount: number;
  expenseCount: number;
}

export interface CanvasSummary {
  counts: { wallets: number; incomes: number; expenses: number };
  currencyBreakdown: CanvasSummaryCurrencyBreakdown[];
  walletBalances: CanvasSummaryWalletBalance[];
  incomeEntries: CanvasSummaryIncomeEntry[];
  expensePayments: CanvasSummaryExpensePayment[];
  recentActivity: CanvasSummaryRecentActivity[];
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
  expenseRows: Array<{ currencyCode: string; currencySymbol: string; expenseCount: number }>
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

  return Array.from(map.values()).sort((a, b) =>
    a.currencyCode.localeCompare(b.currencyCode)
  );
}

export async function getCanvasSummary(canvasId: number): Promise<CanvasSummary> {
  const [
    walletCountRow,
    incomeCountRow,
    expenseCountRow,
    walletBreakdownRows,
    incomeBreakdownRows,
    expenseBreakdownRows,
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
    }))
  );

  const walletBalanceRows = await db
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

  const incomeEntries: CanvasSummaryIncomeEntry[] = incomeEntryRows.map((row) => ({
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

  const expensePayments: CanvasSummaryExpensePayment[] = expensePaymentRows.map((row) => ({
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

  const recentActivity = [...entryActivities, ...paymentActivities]
    .sort((a, b) => {
      const aEntry = incomeEntries.find((e) => e.id === a.id && a.type === "income_entry");
      const bEntry = incomeEntries.find((e) => e.id === b.id && b.type === "income_entry");
      const aPayment = expensePayments.find((p) => p.id === a.id && a.type === "expense_payment");
      const bPayment = expensePayments.find((p) => p.id === b.id && b.type === "expense_payment");

      const aSort = a.type === "income_entry" && aEntry
        ? getActivitySortDate(aEntry.receivedDate, aEntry.expectedDate, aEntry.createdAt)
        : aPayment
          ? getActivitySortDate(aPayment.paidDate, aPayment.dueDate, aPayment.createdAt)
          : 0;

      const bSort = b.type === "income_entry" && bEntry
        ? getActivitySortDate(bEntry.receivedDate, bEntry.expectedDate, bEntry.createdAt)
        : bPayment
          ? getActivitySortDate(bPayment.paidDate, bPayment.dueDate, bPayment.createdAt)
          : 0;

      return bSort - aSort;
    })
    .slice(0, 15);

  return {
    counts: {
      wallets: walletCountRow[0]?.total ?? 0,
      incomes: incomeCountRow[0]?.total ?? 0,
      expenses: expenseCountRow[0]?.total ?? 0,
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
  };
}
