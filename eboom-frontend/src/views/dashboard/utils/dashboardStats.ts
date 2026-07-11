import dayjs from "dayjs";
import { computeExpenseStats } from "@/src/views/expenses/utils/expensePaymentsStats";
import type { ExpensePayment } from "@/src/views/expenses/components/ExpensePaymentsTable";
import { computeIncomeStats } from "@/src/views/incomes/utils/incomeEntriesStats";
import type { IncomeEntry } from "@/src/views/incomes/component/IncomeEntriesTable";
import { computeWalletStats } from "@/src/views/wallets/utils/utils";
import type { WalletEntry, WalletPayment } from "@/src/views/wallets/utils/utils";
import type {
  CanvasSummary,
  CanvasSummaryExpensePayment,
  CanvasSummaryIncomeEntry,
  CanvasSummaryWalletBalance,
} from "@/src/types/dashboard";

export interface CurrencyDashboardStats {
  currencyCode: string;
  currencySymbol: string;
  totalBalance: number;
  walletCountWithCurrency: number;
  entityCounts: { wallets: number; incomes: number; expenses: number; assets: number };
  incomeStats: ReturnType<typeof computeIncomeStats>;
  expenseStats: ReturnType<typeof computeExpenseStats>;
  walletStats: ReturnType<typeof computeWalletStats>;
  topWallets: Array<{ walletId: number; walletName: string; balance: number }>;
  netCashFlowThisMonth: number;
  assetCount: number;
  totalAssetValue: number;
}

function toWalletEntry(entry: CanvasSummaryIncomeEntry): WalletEntry {
  return {
    id: entry.id,
    incomeId: entry.incomeId,
    incomeName: entry.incomeName,
    categoryName: entry.categoryName ?? undefined,
    destinationWalletId: entry.destinationWalletId,
    amount: entry.amount,
    expectedDate: entry.expectedDate,
    receivedDate: entry.receivedDate,
    notes: entry.notes,
    createdAt: entry.createdAt,
  };
}

function toWalletPayment(payment: CanvasSummaryExpensePayment): WalletPayment {
  return {
    id: payment.id,
    expenseId: payment.expenseId,
    expenseName: payment.expenseName,
    categoryName: payment.categoryName ?? undefined,
    sourceWalletId: payment.sourceWalletId,
    amount: payment.amount,
    dueDate: payment.dueDate,
    paidDate: payment.paidDate,
    notes: payment.notes,
    createdAt: payment.createdAt,
  };
}

function toIncomeEntry(entry: CanvasSummaryIncomeEntry): IncomeEntry {
  return {
    id: entry.id,
    incomeId: entry.incomeId,
    destinationWalletId: entry.destinationWalletId,
    amount: entry.amount,
    expectedDate: entry.expectedDate,
    receivedDate: entry.receivedDate,
    notes: entry.notes,
    createdAt: entry.createdAt,
    destinationWallet: null,
  };
}

function toExpensePayment(payment: CanvasSummaryExpensePayment): ExpensePayment {
  return {
    id: payment.id,
    expenseId: payment.expenseId,
    sourceWalletId: payment.sourceWalletId,
    amount: payment.amount,
    dueDate: payment.dueDate,
    paidDate: payment.paidDate,
    notes: payment.notes,
    createdAt: payment.createdAt,
    sourceWallet: null,
  };
}

function getCurrencyCodes(summary: CanvasSummary): string[] {
  const codes = new Set<string>();
  // Prioritize liquid currencies from sub-wallets first
  summary.walletBalances.forEach((b) => codes.add(b.currencyCode));
  summary.currencyBreakdown?.forEach((b) => codes.add(b.currencyCode));
  summary.incomeEntries.forEach((e) => codes.add(e.currencyCode));
  summary.expensePayments.forEach((p) => codes.add(p.currencyCode));
  summary.assetsByCurrency?.forEach((a) => codes.add(a.currencyCode));
  return Array.from(codes).sort();
}

function getEntityCounts(
  summary: CanvasSummary,
  currencyCode: string
): { wallets: number; incomes: number; expenses: number; assets: number } {
  const breakdown = summary.currencyBreakdown?.find(
    (b) => b.currencyCode === currencyCode
  );
  return {
    wallets: breakdown?.walletCount ?? 0,
    incomes: breakdown?.incomeCount ?? 0,
    expenses: breakdown?.expenseCount ?? 0,
    assets: breakdown?.assetCount ?? 0,
  };
}

function getCurrencySymbol(
  summary: CanvasSummary,
  currencyCode: string
): string {
  const fromBalance = summary.walletBalances.find((b) => b.currencyCode === currencyCode);
  if (fromBalance) return fromBalance.currencySymbol;
  const fromEntry = summary.incomeEntries.find((e) => e.currencyCode === currencyCode);
  if (fromEntry) return fromEntry.currencySymbol;
  const fromPayment = summary.expensePayments.find((p) => p.currencyCode === currencyCode);
  if (fromPayment) return fromPayment.currencySymbol;
  const fromAsset = summary.assetsByCurrency?.find((a) => a.currencyCode === currencyCode);
  return fromAsset?.currencySymbol ?? currencyCode;
}

function computeNetCashFlowThisMonth(
  entries: CanvasSummaryIncomeEntry[],
  payments: CanvasSummaryExpensePayment[]
): number {
  const now = dayjs();
  const receivedThisMonth = entries
    .filter((e) => e.receivedDate && dayjs(e.receivedDate).isSame(now, "month"))
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const paidThisMonth = payments
    .filter((p) => p.paidDate && dayjs(p.paidDate).isSame(now, "month"))
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  return receivedThisMonth - paidThisMonth;
}

function getTopWallets(
  balances: CanvasSummaryWalletBalance[],
  currencyCode: string,
  limit = 3
) {
  const walletTotals = new Map<number, { walletName: string; balance: number }>();

  for (const row of balances.filter((b) => b.currencyCode === currencyCode)) {
    const existing = walletTotals.get(row.walletId);
    const amount = parseFloat(row.balance) || 0;
    if (existing) {
      existing.balance += amount;
    } else {
      walletTotals.set(row.walletId, { walletName: row.walletName, balance: amount });
    }
  }

  return Array.from(walletTotals.entries())
    .map(([walletId, { walletName, balance }]) => ({ walletId, walletName, balance }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);
}

export function computeDashboardStatsByCurrency(
  summary: CanvasSummary
): CurrencyDashboardStats[] {
  const currencyCodes = getCurrencyCodes(summary);

  return currencyCodes.map((currencyCode) => {
    const entries = summary.incomeEntries.filter((e) => e.currencyCode === currencyCode);
    const payments = summary.expensePayments.filter((p) => p.currencyCode === currencyCode);
    const balances = summary.walletBalances.filter((b) => b.currencyCode === currencyCode);
    const assetRow = summary.assetsByCurrency?.find((a) => a.currencyCode === currencyCode);

    const walletEntries = entries.map(toWalletEntry);
    const walletPayments = payments.map(toWalletPayment);

    const entityCounts = getEntityCounts(summary, currencyCode);

    return {
      currencyCode,
      currencySymbol: getCurrencySymbol(summary, currencyCode),
      totalBalance: balances.reduce((sum, b) => sum + (parseFloat(b.balance) || 0), 0),
      walletCountWithCurrency: entityCounts.wallets,
      entityCounts,
      incomeStats: computeIncomeStats(entries.map(toIncomeEntry)),
      expenseStats: computeExpenseStats(payments.map(toExpensePayment)),
      walletStats: computeWalletStats(walletEntries, walletPayments),
      topWallets: getTopWallets(summary.walletBalances, currencyCode),
      netCashFlowThisMonth: computeNetCashFlowThisMonth(entries, payments),
      assetCount: assetRow?.count ?? 0,
      totalAssetValue: parseFloat(assetRow?.totalHoldingValue ?? "0") || 0,
    };
  });
}
