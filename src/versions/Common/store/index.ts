import { Action, configureStore, getDefaultMiddleware, ThunkAction } from "@reduxjs/toolkit";
import counterReducer from "./slices/counterReducer";
import versionsReducer from "./slices/versionsReducer";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    versions: versionsReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
