// src/store/canvasSlice.ts
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
// import type { RootState } from './store';

interface AuthUiState {
  canvasId?: number;
}

const initialState: AuthUiState = {
  canvasId: undefined
};

const canvasSlice = createSlice({
  name: 'canvas',
  initialState,
  reducers: {
    updateCanvas: (state, action: PayloadAction<number>) => {
        state.canvasId = action.payload;
      },
  }
});

export const { updateCanvas } = canvasSlice.actions;

// export const selectCanvasUi = (state: RootState) => state.canvas;

export default canvasSlice.reducer;
