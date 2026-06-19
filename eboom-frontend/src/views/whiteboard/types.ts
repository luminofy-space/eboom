import type { ExpenseItem } from "@/src/redux/expenseSlice";
import type { IncomeItem } from "@/src/redux/incomeSlice";
import type { WalletItem } from "@/src/redux/walletSlice";

export type WhiteboardEntityType = "wallet" | "income" | "expense";

export interface WhiteboardNodePosition {
  entityType: WhiteboardEntityType;
  entityId: number;
  x: number;
  y: number;
}

export interface WhiteboardViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface IncomeFlow {
  incomeId: number;
  walletId: number;
  entryCount: number;
  totalAmount: string;
  currencyId: number;
  currencyCode: string;
  currencySymbol: string;
}

export interface ExpenseFlow {
  expenseId: number;
  walletId: number;
  paymentCount: number;
  totalAmount: string;
  currencyId: number;
  currencyCode: string;
  currencySymbol: string;
}

export interface WhiteboardWallet extends WalletItem {
  subWallets?: Array<{
    id: number;
    walletId: number;
    currencyId: number;
    amount: string;
    currency?: { id: number; code: string; symbol: string; name: string } | null;
  }>;
}

export interface WhiteboardData {
  viewport: WhiteboardViewport;
  nodePositions: WhiteboardNodePosition[];
  incomeFlows: IncomeFlow[];
  expenseFlows: ExpenseFlow[];
  wallets: WhiteboardWallet[];
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
}

export interface WhiteboardSpawnPosition {
  x: number;
  y: number;
}

export interface WhiteboardCreatedEntity {
  id: number;
  type: WhiteboardEntityType;
}

export type SelectedWhiteboardEdge =
  | { kind: "income"; flow: IncomeFlow }
  | { kind: "expense"; flow: ExpenseFlow };

export interface WhiteboardContextMenuState {
  x: number;
  y: number;
  kind: "pane" | "node";
  nodeId?: string;
}
