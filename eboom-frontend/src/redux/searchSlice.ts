import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import {
  DEFAULT_LIST_PAGE_SIZE,
  LIST_PAGE_SIZE_OPTIONS,
  type ListPageSize,
} from "@/src/constants/listPagination";
import type { RootState } from "./store";

export type ListViewMode = "grid" | "table";

export interface ListFilters {
  categoryId: number | null;
  currencyId: number | null;
  isRecurring: boolean | null;
}

interface SearchState {
  query: string;
  isVisible: boolean;
  viewMode: ListViewMode;
  pageSize: ListPageSize;
  filters: ListFilters;
}

const initialFilters: ListFilters = {
  categoryId: null,
  currencyId: null,
  isRecurring: null,
};

const initialState: SearchState = {
  query: "",
  isVisible: false,
  viewMode: "grid",
  pageSize: DEFAULT_LIST_PAGE_SIZE,
  filters: initialFilters,
};

type ListFilterKey = keyof ListFilters;

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    showSearch: (state) => {
      state.isVisible = true;
    },
    hideSearch: (state) => {
      state.isVisible = false;
      state.query = "";
      state.viewMode = "grid";
      state.filters = { ...initialFilters };
    },
    toggleSearch: (state) => {
      if (state.isVisible) {
        state.query = "";
      }
      state.isVisible = !state.isVisible;
    },
    setViewMode: (state, action: PayloadAction<ListViewMode>) => {
      state.viewMode = action.payload;
    },
    setListPageSize: (state, action: PayloadAction<ListPageSize>) => {
      if (LIST_PAGE_SIZE_OPTIONS.includes(action.payload)) {
        state.pageSize = action.payload;
      }
    },
    setListFilter: (
      state,
      action: PayloadAction<{ key: ListFilterKey; value: ListFilters[ListFilterKey] }>
    ) => {
      const { key, value } = action.payload;
      if (key === "categoryId") {
        state.filters.categoryId = value as number | null;
      } else if (key === "currencyId") {
        state.filters.currencyId = value as number | null;
      } else {
        state.filters.isRecurring = value as boolean | null;
      }
    },
    clearListFilters: (state) => {
      state.filters = { ...initialFilters };
    },
  },
});

export const {
  setSearchQuery,
  showSearch,
  hideSearch,
  toggleSearch,
  setViewMode,
  setListPageSize,
  setListFilter,
  clearListFilters,
} = searchSlice.actions;

export const selectSearchQuery = (state: RootState) => state.search.query;
export const selectSearchVisible = (state: RootState) => state.search.isVisible;
export const selectViewMode = (state: RootState) => state.search.viewMode;
export const selectListPageSize = (state: RootState) => state.search.pageSize;
export const selectListFilters = (state: RootState) => state.search.filters;

export const selectHasActiveFilters = (state: RootState) => {
  const { query } = state.search;
  const { categoryId, currencyId, isRecurring } = state.search.filters;
  return (
    query.length > 0 ||
    categoryId !== null ||
    currencyId !== null ||
    isRecurring !== null
  );
};

export default searchSlice.reducer;
