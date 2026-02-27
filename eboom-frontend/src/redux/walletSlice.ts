import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";

export interface WalletItem {
  id: number;
  name: string;
  description?: string;
  walletType?: string;
  photoUrl?: string | null;
  lastModifiedAt?: string | null;
  walletCategoryId?: number | null;
  walletNumber?: string;
  category?: {
    id: number;
    name: string;
    photoUrl?: string | null;
  } | null;
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
