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

export interface CanvasSummary {
  counts: { wallets: number; incomes: number; expenses: number };
  walletBalances: CanvasSummaryWalletBalance[];
  incomeEntries: CanvasSummaryIncomeEntry[];
  expensePayments: CanvasSummaryExpensePayment[];
  recentActivity: CanvasSummaryRecentActivity[];
}
