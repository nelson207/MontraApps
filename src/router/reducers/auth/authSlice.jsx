import { createSlice } from "@reduxjs/toolkit";
import { ArNextAPI } from "../../apis/ArNextAPI";

// Basic persistence (optional)
const tokenFromStorage = localStorage.getItem("token");
const userFromStorage = localStorage.getItem("user");

const initialState = {
  token: tokenFromStorage || null,
  user: userFromStorage ? JSON.parse(userFromStorage) : null,
  isAuthenticated: Boolean(tokenFromStorage),
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // manual logout (local-only)
    clearAuth(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },

    // optional: if you want to hydrate after refresh from elsewhere
    setAuth(state, action) {
      const { token, user } = action.payload || {};
      state.token = token || null;
      state.user = user || null;
      state.isAuthenticated = Boolean(token);
      state.error = null;

      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));
    },
  },
  extraReducers: (builder) => {
    // When login succeeds
    builder.addMatcher(
      ArNextAPI.endpoints.postApiAuthLogin.matchFulfilled,
      (state, action) => {
        // Your codegen type says response is `unknown`, so adjust these
        // to whatever your API actually returns.
        //
        // Common shapes:
        // 1) { token, user }
        // 2) { accessToken, refreshToken, ... }
        // 3) { data: { token, user } }

        const data = action.payload;

        // Example guess:
        const token = data?.token || data?.accessToken || null;
        const user = data?.user || null;

        state.token = token;
        state.user = user;
        state.isAuthenticated = Boolean(token);
        state.error = null;

        if (token) localStorage.setItem("token", token);
        if (user) localStorage.setItem("user", JSON.stringify(user));
      },
    );

    // When login fails
    builder.addMatcher(
      ArNextAPI.endpoints.postApiAuthLogin.matchRejected,
      (state, action) => {
        // RTK Query gives useful error info here; keep it simple:
        state.error =
          action?.error?.message ||
          action?.payload?.data?.message ||
          "Login failed";
      },
    );

    // When logout succeeds
    builder.addMatcher(
      ArNextAPI.endpoints.postApiAuthLogout.matchFulfilled,
      (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;

        localStorage.removeItem("token");
        localStorage.removeItem("user");
      },
    );
  },
});

export const { clearAuth, setAuth } = authSlice.actions;

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthUser = (state) => state.auth.user;
export const selectAuthToken = (state) => state.auth.token;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
