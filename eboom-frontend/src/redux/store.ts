// src/store/store.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import type { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import { persistReducer, persistStore } from 'redux-persist';
import canvasReducer from './canvasSlice'
import storage from './storage';

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['auth'], // Add reducers here to persist
    // Migrate old persisted state to ensure language is never undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    migrate: (state: any) => {
        if (state && state.auth) {
            // normalize legacy language codes
            if (state.auth.language === 'cz') {
                state.auth.language = 'cs';
            }

            if (!state.auth.language) {
                state.auth.language = 'de';
            }
        }

        return Promise.resolve(state);
    }
};

const rootReducer = combineReducers({
    canvas: canvasReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: false
        })
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;