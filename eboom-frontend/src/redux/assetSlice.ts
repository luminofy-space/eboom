import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";

export interface AssetItem {
  id: number;
  name: string;
  description?: string | null;
  photoUrl?: string | null;
  lastModifiedAt?: string | null;
  assetCategoryId?: number | null;
  currencyId?: number | null;
  estimatedValue?: string | null;
  isArchived?: boolean;
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
}

interface AssetModalState {
  open: boolean;
  mode: "create" | "edit";
  editingItem: AssetItem | null;
}

interface AssetState {
  modal: AssetModalState;
}

const initialState: AssetState = {
  modal: {
    open: false,
    mode: "create",
    editingItem: null,
  },
};

const assetSlice = createSlice({
  name: "asset",
  initialState,
  reducers: {
    openAssetCreateModal: (state) => {
      state.modal.open = true;
      state.modal.mode = "create";
      state.modal.editingItem = null;
    },
    openAssetEditModal: (state, action: PayloadAction<AssetItem>) => {
      state.modal.open = true;
      state.modal.mode = "edit";
      state.modal.editingItem = action.payload;
    },
    closeAssetModal: (state) => {
      state.modal.open = false;
      state.modal.mode = "create";
      state.modal.editingItem = null;
    },
  },
});

export const {
  openAssetCreateModal,
  openAssetEditModal,
  closeAssetModal,
} = assetSlice.actions;

export const selectAssetModal = (state: RootState) => state.asset.modal;

export default assetSlice.reducer;
