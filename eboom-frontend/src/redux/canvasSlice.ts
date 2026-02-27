import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import type { Canvas } from "../types/common";

export interface CanvasItem {
  id: number;
  name: string;
  description?: string | null;
  photoUrl?: string | null;
  canvasType?: string | null;
  lastModifiedAt?: string | null;
}

interface CanvasModalState {
  open: boolean;
  mode: "create" | "edit";
  editingItem: CanvasItem | null;
}

interface CanvasUiState {
  canvasId?: number;
  modal: CanvasModalState;
}

const initialState: CanvasUiState = {
  canvasId: undefined,
  modal: {
    open: false,
    mode: "create",
    editingItem: null,
  },
};

const canvasSlice = createSlice({
  name: "canvas",
  initialState,
  reducers: {
    updateCanvas: (state, action: PayloadAction<number>) => {
      state.canvasId = action.payload;
    },
    openCanvasCreateModal: (state) => {
      state.modal.open = true;
      state.modal.mode = "create";
      state.modal.editingItem = null;
    },
    openCanvasEditModal: (state, action: PayloadAction<CanvasItem>) => {
      state.modal.open = true;
      state.modal.mode = "edit";
      state.modal.editingItem = action.payload;
    },
    closeCanvasModal: (state) => {
      state.modal.open = false;
      state.modal.mode = "create";
      state.modal.editingItem = null;
    },
  },
});

export const {
  updateCanvas,
  openCanvasCreateModal,
  openCanvasEditModal,
  closeCanvasModal,
} = canvasSlice.actions;

export const selectCanvasModal = (state: RootState) => state.canvas.modal;

export default canvasSlice.reducer;
