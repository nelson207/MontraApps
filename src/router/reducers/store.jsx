import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../reducers/auth/authSlice";
import { ArNextAPI } from "../apis/ArNextAPI";

export const store = configureStore({
  reducer: {
    auth: authReducer,

    // RTK Query reducer
    [ArNextAPI.reducerPath]: ArNextAPI.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(ArNextAPI.middleware),
});

// Optional, but helpful for TS / autocomplete; safe to keep in JS too
export const selectAuth = (state) => state.auth;
