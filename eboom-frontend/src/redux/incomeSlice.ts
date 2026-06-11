import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";

export interface IncomeItem {
  id: number;
  name: string;
  isRecurring: boolean;
  description?: string;
  photoUrl?: string | null;
  lastModifiedAt?: string | null;
  currencyId?: number;
  amount?: number;
  incomeCategoryId?: number | null;
  defaultWalletId?: number | null;
  status?: string;
  isArchived?: boolean;
  recurrencePattern?: unknown;
  category?: {
    id: number;
    name: string;
  } | null;
  currency?: {
    id: number;
    code: string;
    name: string;
    symbol: string;
  } | null;
  defaultWallet?: {
    id: number;
    name: string;
  } | null;
}

interface IncomeModalState {
  open: boolean;
  mode: "create" | "edit";
  editingItem: IncomeItem | null;
}

interface IncomeState {
  modal: IncomeModalState;
}

const initialState: IncomeState = {
  modal: {
    open: false,
    mode: "create",
    editingItem: null,
  },
};

const incomeSlice = createSlice({
  name: "income",
  initialState,
  reducers: {
    openIncomeCreateModal: (state) => {
      state.modal.open = true;
      state.modal.mode = "create";
      state.modal.editingItem = null;
    },
    openIncomeEditModal: (state, action: PayloadAction<IncomeItem>) => {
      state.modal.open = true;
      state.modal.mode = "edit";
      state.modal.editingItem = action.payload;
    },
    closeIncomeModal: (state) => {
      state.modal.open = false;
      state.modal.mode = "create";
      state.modal.editingItem = null;
    },
  },
});

export const { openIncomeCreateModal, openIncomeEditModal, closeIncomeModal } =
  incomeSlice.actions;

export const selectIncomeModal = (state: RootState) => state.income.modal;

export default incomeSlice.reducer;
