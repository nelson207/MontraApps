import {
  combineReducers,
  configureStore,
  type Reducer,
  type ThunkDispatch,
  type UnknownAction,
} from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { setupListeners } from "@reduxjs/toolkit/query";
import { MontraPOSApi } from "@platform/api/generated/MontraPOSApi";
import authReducer from "@platform/features/auth/authSlice";
import layoutReducer from "@platform/features/layout/layoutSlice";
import notificationsReducer from "@platform/features/notifications/notificationsSlice";
import themeReducer from "@platform/features/theme/themeSlice";
import languageReducer from "@platform/i18n/languageSlice";
import workContextReducer, { WORK_CONTEXT_PREFERENCE } from "@platform/features/workContext/workContextSlice";
import { savePreferences, type Preferences } from "./preferences";

// The store base shared by every Montra app: platform slices + the API.
// Each app adds its own slices with createMontraStore (see apps/<app>/store.ts).

const platformReducers = {
  auth: authReducer,
  layout: layoutReducer,
  notifications: notificationsReducer,
  theme: themeReducer,
  language: languageReducer,
  workContext: workContextReducer,
  [MontraPOSApi.reducerPath]: MontraPOSApi.reducer,
};

export type PlatformState = {
  [K in keyof typeof platformReducers]: ReturnType<(typeof platformReducers)[K]>;
};
export type PlatformDispatch = ThunkDispatch<PlatformState, unknown, UnknownAction>;

type AppReducers = Record<string, Reducer>;

/**
 * One store per app: platform slices + `appReducers`. `persist` returns the app's own
 * preferences to save next to the platform ones (sidebar, theme); saved when any value changes.
 */
export function createMontraStore<R extends AppReducers>(
  appReducers: R,
  persist?: (state: PlatformState & { [K in keyof R]: ReturnType<R[K]> }) => Preferences,
) {
  type State = PlatformState & { [K in keyof R]: ReturnType<R[K]> };
  const reducer = combineReducers({ ...platformReducers, ...appReducers }) as unknown as Reducer<State>;
  const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(MontraPOSApi.middleware),
  });
  const snapshot = (): Preferences => {
    const state = store.getState();
    return {
      sidebarCollapsed: state.layout.sidebarCollapsed,
      theme: state.theme,
      language: state.language.choice,
      // The chosen working context is remembered per browser and per app
      [WORK_CONTEXT_PREFERENCE]: state.workContext.stored,
      ...persist?.(state),
    };
  };

  // Queries asking for it (refetchOnFocus) reload when the window regains focus or the network comes back
  setupListeners(store.dispatch);

  // Persist UI preferences whenever one of them changes
  let saved = snapshot();
  store.subscribe(() => {
    const next = snapshot();
    const changed = Object.keys(next).some((key) => next[key] !== saved[key]);
    if (!changed) return;
    saved = next;
    savePreferences(next);
  });

  return store;
}

export const selectAuth = (state: PlatformState): PlatformState["auth"] => state.auth;

export const selectIsAuthenticated = (state: PlatformState): boolean => state.auth.isAuthenticated;

/** Start-up is still restoring the session from the refresh cookie (routes wait) */
export const selectIsRestoringSession = (state: PlatformState): boolean => state.auth.isRestoring;

export const selectAuthUser = (state: PlatformState): string | null => state.auth.user;

export const selectAuthToken = (state: PlatformState): string | null => state.auth.token;

export const selectAuthError = (state: PlatformState): string | null => state.auth.error;

/** Typed hooks for platform code (it only reads platform slices); apps export their own. */
export const useAppDispatch = useDispatch.withTypes<PlatformDispatch>();
export const useAppSelector = useSelector.withTypes<PlatformState>();
