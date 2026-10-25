import {
  createSlice,
  isAnyOf,
  isRejectedWithValue,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  MontraPOSApi,
  type LoginResponse,
} from "@platform/api/generated/MontraPOSApi";
import { sessionEndedElsewhere, sessionExpired, sessionRefreshed } from "@platform/api/sessionGuard";
import { jwtDecode } from "jwt-decode";
import { isDemoToken } from "./demoSession";
import { loginOutcome } from "./loginFlow";
import { isFresh } from "./session/refreshSession";
import {
  readDemoToken,
  readSessionHint,
  removeLegacyTokens,
  saveDemoToken,
  type SignInMethod,
} from "./session/sessionHints";

// The session token lives in this slice only (memory): never in localStorage/sessionStorage.
// After a reload it's restored from the API's HttpOnly refresh cookie (see session/sessionSync.ts);
// Web Storage only keeps non-secret hints (session/sessionHints.ts).

/** A session handed in directly (Demo access) */
type SessionGrant = { accessToken?: string | null; userId?: string | null };

/** The login that was sent (for the user name kept with the session) */
const loginNameOf = (action: { meta: { arg: { originalArgs: unknown } } }) =>
  (action.meta.arg.originalArgs as { loginRequest?: { username?: string | null } }).loginRequest?.username ?? null;

type AuthState = {
  token: string | null;
  user: string | null;
  isAuthenticated: boolean;
  error: string | null;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string | null;
  /** How the current session was opened (Keycloak sessions also end at Keycloak on logout) */
  signInMethod: SignInMethod;
  /** "Remember me" of the current session (or of the login being sent) */
  rememberMe: boolean;
  /** At start: restoring the session (refresh cookie or another tab). Routes wait meanwhile. */
  isRestoring: boolean;
  /** The API said the session token is invalid: go back to the login page (SessionExpiredRedirect) */
  sessionExpired: boolean;
};

const resetAuth = (state: AuthState) => {
  state.token = null;
  state.user = null;
  state.isAuthenticated = false;
  state.error = null;
  state.isRestoring = false;
};

/** The access token's `lm` claim: how the session was opened (server-side, survives reloads) */
function signInMethodOf(token: string): SignInMethod | null {
  try {
    const { lm } = jwtDecode<{ lm?: unknown }>(token);
    if (lm === "windows") return "windows";
    if (lm === "openId") return "idp";
    if (lm === "custom") return "password";
  } catch {
    // not a readable JWT (e.g. tests): keep what we know
  }
  return null;
}

const openSession = (state: AuthState, token: string) => {
  state.token = token;
  state.signInMethod = signInMethodOf(token) ?? state.signInMethod;
  state.isAuthenticated = true;
  state.isRestoring = false;
  state.error = null;
};

function initialAuthState(): AuthState {
  // Earlier versions kept the token in Web Storage: remove it
  removeLegacyTokens();
  const demo = readDemoToken();
  const hint = readSessionHint();
  const demoToken = isDemoToken(demo) && isFresh(demo) ? demo : null;
  return {
    token: demoToken,
    user: null,
    isAuthenticated: !!demoToken,
    error: null,
    rememberMe: hint?.rememberMe ?? false,
    signInMethod: hint?.method ?? "password",
    // Only try to restore when a session may exist (no request for first-time visitors)
    isRestoring: !demoToken && !!hint,
    sessionExpired: false,
  };
}

/**
 * A LoginResponse (POST /api/auth/login, /password/change-required, /2fa/verify), in the order of
 * precedence of loginOutcome(): a password change or 2FA keeps the session closed (their
 * challenges stay with the login page, never in the store or storage); an access token opens it.
 */
function applyLoginResponse(state: AuthState, data: LoginResponse | undefined, user: string | null) {
  const outcome = loginOutcome(data);

  state.error = null;
  state.token = null;
  state.isAuthenticated = false;
  state.twoFactorToken = null;

  if (outcome === "passwordChange" || outcome === "twoFactor") {
    state.user = user; // kept for the next step
    state.requiresTwoFactor = outcome === "twoFactor";
    return;
  }

  const token = outcome === "loggedIn" ? (data?.accessToken ?? null) : null;
  state.user = user;
  state.requiresTwoFactor = false;
  if (token) openSession(state, token);
}

const authSlice = createSlice({
  name: "auth",
  initialState: initialAuthState,
  reducers: {
    clearAuth(state) {
      resetAuth(state);
    },

    /** The login page was reached after an expired session */
    acknowledgeSessionExpired(state) {
      state.sessionExpired = false;
    },

    /** "Remember me" of the login being sent (the API doesn't echo it back) */
    setRememberMe(state, action: PayloadAction<boolean>) {
      state.rememberMe = action.payload;
    },

    /** Start-up found no session to restore */
    restoreFinished(state) {
      state.isRestoring = false;
    },

    /** Development "Demo access": an unsigned token (kept in sessionStorage so a reload keeps it) */
    setAuth(state, action: PayloadAction<SessionGrant | undefined>) {
      const { accessToken, userId } = action.payload || {};
      resetAuth(state);
      state.user = userId || null;
      if (!accessToken) return;
      openSession(state, accessToken);
      if (isDemoToken(accessToken)) saveDemoToken(accessToken);
    },
  },
  extraReducers: (builder) => {
    builder
      // ErrorCode ErrInvalidSessionToken on any request: remove the session token
      .addCase(sessionExpired, (state) => {
        resetAuth(state);
        state.sessionExpired = true;
      })
      // Silent refresh, restored session, or a token shared by another tab
      .addCase(sessionRefreshed, (state, action) => openSession(state, action.payload.accessToken))
      .addCase(sessionEndedElsewhere, (state) => resetAuth(state))
      // Login, required password change and 2FA all answer a LoginResponse: one handler
      .addMatcher(MontraPOSApi.endpoints.postApiAuthLogin.matchFulfilled, (state, action) => {
        state.signInMethod = "password";
        applyLoginResponse(state, action.payload, loginNameOf(action));
      })
      // "Sign in with Windows": the same LoginResponse
      .addMatcher(MontraPOSApi.endpoints.postApiAuthLoginWindows.matchFulfilled, (state, action) => {
        state.signInMethod = "windows";
        applyLoginResponse(state, action.payload, null);
      })
      // "Sign in with Keycloak": the same LoginResponse (never a 2FA or password-change step)
      .addMatcher(MontraPOSApi.endpoints.postApiAuthLoginIdp.matchFulfilled, (state, action) => {
        state.signInMethod = "idp";
        applyLoginResponse(state, action.payload, null);
      })
      .addMatcher(
        isAnyOf(
          MontraPOSApi.endpoints.postApiAuthPasswordChangeRequired.matchFulfilled,
          MontraPOSApi.endpoints.postApiAuth2FaVerify.matchFulfilled,
        ),
        (state, action) => applyLoginResponse(state, action.payload, state.user),
      );

    // Any API call still rejected with 401 (after the silent refresh, see emptyApi.ts) means
    // the session is no longer valid.
    // Registered before the login error matcher so that one can still set state.error.
    builder.addMatcher(
      (action) =>
        isRejectedWithValue(action) &&
        (action.payload as { status?: number } | undefined)?.status === 401,
      (state) => {
        resetAuth(state);
      },
    );

    builder.addMatcher(
      isAnyOf(
        MontraPOSApi.endpoints.postApiAuthLogin.matchRejected,
        MontraPOSApi.endpoints.postApiAuth2FaVerify.matchRejected,
      ),
      (state, action) => {
        const payload = action.payload as
          { data?: { message?: string } } | undefined;

        state.error =
          action.error?.message || payload?.data?.message || "Login failed";
      },
    );

    builder.addMatcher(
      isAnyOf(
        MontraPOSApi.endpoints.postApiAuthLogout.matchFulfilled,
        MontraPOSApi.endpoints.postApiAuthLogout.matchRejected,
      ),
      (state) => {
        resetAuth(state);
      },
    );
  },
});

export const { clearAuth, setAuth, setRememberMe, restoreFinished, acknowledgeSessionExpired } = authSlice.actions;
export default authSlice.reducer;
