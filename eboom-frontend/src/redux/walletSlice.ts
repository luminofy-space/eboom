import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";

export interface WalletCurrencyFinancial {
  currencyId: number;
  currencyCode: string;
  currencySymbol: string;
  balance: string;
  totalIncome: string;
  totalExpense: string;
}

export interface WalletFinancials {
  // One entry per currency this wallet actually holds/has moved money in.
  byCurrency: WalletCurrencyFinancial[];
  // Same figures converted to the canvas base currency and summed, so
  // wallets can be compared on one scale. Null when unavailable.
  base: (WalletCurrencyFinancial & { convertedFromMultipleCurrencies: boolean }) | null;
}

export interface WalletItem {
  id: number;
  name: string;
  description?: string;
  photoUrl?: string | null;
  lastModifiedAt?: string | null;
  walletCategoryId?: number | null;
  isArchived?: boolean;
  category?: {
    id: number;
    name: string;
  } | null;
  financials?: WalletFinancials;
}

// Prefer the base-currency-converted total (comparable across wallets);
// fall back to the wallet's first held currency when no base currency is
// configured or it couldn't be converted.
export function getPrimaryWalletFinancial(
  financials: WalletFinancials | undefined
): WalletCurrencyFinancial | null {
  if (!financials) return null;
  return financials.base ?? financials.byCurrency[0] ?? null;
}

interface WalletModalState {
  open: boolean;
  mode: "create" | "edit";
  editingItem: WalletItem | null;
}

interface WalletState {
  modal: WalletModalState;
}

const initialState: WalletState = {
  modal: {
    open: false,
    mode: "create",
    editingItem: null,
  },
};

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    openWalletCreateModal: (state) => {
      state.modal.open = true;
      state.modal.mode = "create";
      state.modal.editingItem = null;
    },
    openWalletEditModal: (state, action: PayloadAction<WalletItem>) => {
      state.modal.open = true;
      state.modal.mode = "edit";
      state.modal.editingItem = action.payload;
    },
    closeWalletModal: (state) => {
      state.modal.open = false;
      state.modal.mode = "create";
      state.modal.editingItem = null;
    },
  },
});

export const {
  openWalletCreateModal,
  openWalletEditModal,
  closeWalletModal,
} = walletSlice.actions;

export const selectWalletModal = (state: RootState) => state.wallet.modal;

export default walletSlice.reducer;
