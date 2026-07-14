export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedEntriesResponse<T> extends PaginatedResponse<T> {
  entries: T[];
  totalReceived?: string;
}

export interface PaginatedPaymentsResponse<T> extends PaginatedResponse<T> {
  payments: T[];
  totalPaid?: string;
}

export interface PaginatedWalletEntriesResponse<T> extends PaginatedResponse<T> {
  incomeEntries: T[];
  totalReceived?: string;
}

export interface PaginatedWalletPaymentsResponse<T> extends PaginatedResponse<T> {
  expensePayments: T[];
  totalPaid?: string;
}

export interface PaginatedTransfersResponse<T> extends PaginatedResponse<T> {
  transfers: T[];
  totalIn?: string;
  totalOut?: string;
}

export type CanvasTransactionType = "incomeEntries" | "expensePayments" | "transfers";

export interface PaginatedCanvasIncomeEntriesResponse<T> extends PaginatedResponse<T> {
  incomeEntries: T[];
}

export interface PaginatedCanvasExpensePaymentsResponse<T> extends PaginatedResponse<T> {
  expensePayments: T[];
}
