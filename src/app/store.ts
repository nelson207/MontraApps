import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import credoperReducer from "../features/credoper/credoperSlice";
import {
  MontraPOSApi,
  type CredOperDto,
} from "../services/api/generated/MontraPOSApi";
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "react-redux";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    credoper: credoperReducer,

    // RTK Query reducer
    [MontraPOSApi.reducerPath]: MontraPOSApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(MontraPOSApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const selectAuth = (state: RootState): RootState["auth"] => state.auth;
export const selectCredoper = (state: RootState): CredOperDto | null =>
  state.credoper.data;

export const selectIsAuthenticated = (state: RootState): boolean =>
  state.auth.isAuthenticated;

export const selectAuthUser = (state: RootState): string | null =>
  state.auth.user;

export const selectAuthToken = (state: RootState): string | null =>
  state.auth.token;

export const selectAuthError = (state: RootState): string | null =>
  state.auth.error;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
