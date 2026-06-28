import type {
  CanvasSummaryExpensePayment,
  CanvasSummaryIncomeEntry,
} from "@/src/views/dashboard/types";
import type { WalletTransfer } from "@/src/views/wallets/utils/utils";

export interface CanvasTransactionsIncomeEntry extends CanvasSummaryIncomeEntry {
  destinationWalletName: string;
}

export interface CanvasTransactionsExpensePayment extends CanvasSummaryExpensePayment {
  sourceWalletName: string;
}

export interface CanvasTransactions {
  incomeEntries: CanvasTransactionsIncomeEntry[];
  expensePayments: CanvasTransactionsExpensePayment[];
  transfers: WalletTransfer[];
  total: { entries: number; payments: number; transfers: number };
}
