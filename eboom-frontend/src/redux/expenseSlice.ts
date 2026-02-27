import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";

export interface ExpenseItem {
  id: number;
  name: string;
  description?: string;
  expenseType?: string;
  photoUrl?: string | null;
  lastModifiedAt?: string | null;
  isRecurring?: boolean;
  expenseCategoryId?: number | null;
  currencyId?: number | null;
  recurrencePattern?: unknown;
  category?: {
    id: number;
    name: string;
    photoUrl?: string | null;
  } | null;
}

interface ExpenseModalState {
  open: boolean;
  mode: "create" | "edit";
  editingItem: ExpenseItem | null;
}

interface ExpenseState {
  modal: ExpenseModalState;
}

const initialState: ExpenseState = {
  modal: {
    open: false,
    mode: "create",
    editingItem: null,
  },
};

const expenseSlice = createSlice({
  name: "expense",
  initialState,
  reducers: {
    openExpenseCreateModal: (state) => {
      state.modal.open = true;
      state.modal.mode = "create";
      state.modal.editingItem = null;
    },
    openExpenseEditModal: (state, action: PayloadAction<ExpenseItem>) => {
      state.modal.open = true;
      state.modal.mode = "edit";
      state.modal.editingItem = action.payload;
    },
    closeExpenseModal: (state) => {
      state.modal.open = false;
      state.modal.mode = "create";
      state.modal.editingItem = null;
    },
  },
});

export const {
  openExpenseCreateModal,
  openExpenseEditModal,
  closeExpenseModal,
} = expenseSlice.actions;

export const selectExpenseModal = (state: RootState) => state.expense.modal;

export default expenseSlice.reducer;
