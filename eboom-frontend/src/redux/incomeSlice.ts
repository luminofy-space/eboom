import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";

export interface IncomeResourceItem {
  id: number;
  name: string;
  isRecurring: boolean;
  description?: string;
  photoUrl?: string | null;
  lastModifiedAt?: string | null;
  currency?: string;
  amount?: number;
  incomeResourceCategoryId?: number | null;
  recurrencePattern?: unknown;
  category?: {
    id: number;
    name: string;
    photoUrl?: string | null;
  } | null;
}

interface IncomeModalState {
  open: boolean;
  mode: "create" | "edit";
  editingItem: IncomeResourceItem | null;
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
    openIncomeEditModal: (state, action: PayloadAction<IncomeResourceItem>) => {
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
