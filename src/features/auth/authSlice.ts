import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  MontraPOSApi,
  type LoginResponseDto,
} from "../../services/api/generated/MontraPOSApi";

type AuthState = {
  token: string | null;
  user: string | null;
  isAuthenticated: boolean;
  error: string | null;
};

const tokenFromStorage =
  localStorage.getItem("token") || sessionStorage.getItem("token");

const userFromStorage =
  localStorage.getItem("user") || sessionStorage.getItem("user");

const initialState: AuthState = {
  token: tokenFromStorage || null,
  user: userFromStorage ? (JSON.parse(userFromStorage) as string) : null,
  isAuthenticated: Boolean(tokenFromStorage),
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuth(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    },

    setAuth(state, action: PayloadAction<LoginResponseDto | undefined>) {
      const { accessToken, userId } = action.payload || {};

      state.token = accessToken || null;
      state.user = userId || null;
      state.isAuthenticated = Boolean(accessToken);
      state.error = null;

      if (accessToken) {
        localStorage.setItem("token", accessToken);
      } else {
        localStorage.removeItem("token");
      }

      if (userId) {
        localStorage.setItem("user", JSON.stringify(userId));
      } else {
        localStorage.removeItem("user");
      }
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      MontraPOSApi.endpoints.postApiAuthLogin.matchFulfilled,
      (state, action) => {
        const data = action.payload as LoginResponseDto | undefined;
        const token = (data?.accessToken as string | undefined) ?? null;
        const rememberMe = (data?.rememberMe as boolean | undefined) ?? false;

        const user = (data?.userId as string) ?? null;

        state.token = token;
        state.user = user;
        state.isAuthenticated = Boolean(token);
        state.error = null;

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        if (rememberMe) {
          if (token) localStorage.setItem("token", token);
          if (user) localStorage.setItem("user", JSON.stringify(user));
        } else {
          if (token) sessionStorage.setItem("token", token);
          if (user) sessionStorage.setItem("user", JSON.stringify(user));
        }
      },
    );

    builder.addMatcher(
      MontraPOSApi.endpoints.postApiAuthLogin.matchRejected,
      (state, action) => {
        const payload = action.payload as
          | { data?: { message?: string } }
          | undefined;

        state.error =
          action.error?.message || payload?.data?.message || "Login failed";
      },
    );

    builder.addMatcher(
      MontraPOSApi.endpoints.postApiAuthLogout.matchFulfilled,
      (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      },
    );

    builder.addMatcher(
      MontraPOSApi.endpoints.postApiAuthLogout.matchRejected,
      (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      },
    );
  },
});

export const { clearAuth, setAuth } = authSlice.actions;
export default authSlice.reducer;
