import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "./store";

interface SearchState {
  query: string;
  isVisible: boolean;
}

const initialState: SearchState = {
  query: "",
  isVisible: false,
};

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
    },
    toggleSearch: (state) => {
      if (state.isVisible) {
        state.query = "";
      }
      state.isVisible = !state.isVisible;
    },
  },
});

export const { setSearchQuery, showSearch, hideSearch, toggleSearch } =
  searchSlice.actions;

export const selectSearchQuery = (state: RootState) => state.search.query;
export const selectSearchVisible = (state: RootState) => state.search.isVisible;

export default searchSlice.reducer;
