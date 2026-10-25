import type { LoginResponse } from "@platform/api/generated/MontraPOSApi";
import i18n from "@platform/i18n/i18n";

// The sign-in steps (login page), as a pure state machine held in memory by useLogin:
//   credentials → [passwordChange →] [twoFactor →] loggedIn
// POST /api/auth/login, /password/change-required and /2fa/verify all answer a LoginResponse,
// read by loginOutcome() in the same order of precedence (also by the auth slice).
// The two kinds of challenge token are kept apart: a password-change challenge only goes to
// /password/change-required, a 2FA challenge only to /2fa/verify; neither is a bearer token.

/** The password-change challenge lasts about 5 minutes on the server */
export const CHALLENGE_LIFETIME_MS = 5 * 60 * 1000;

export type LoginOutcome = "passwordChange" | "twoFactor" | "loggedIn" | "invalid";

/** What a LoginResponse asks for next: password change, then 2FA, then signed in */
export function loginOutcome(response: LoginResponse | null | undefined): LoginOutcome {
  if (response?.requiresPasswordChange === true) return response.challengeToken ? "passwordChange" : "invalid";
  if (response?.requiresTwoFactor === true) return response.challengeToken ? "twoFactor" : "invalid";
  return response?.accessToken ? "loggedIn" : "invalid";
}

export type LoginFlowState = {
  step: "credentials" | "passwordChange" | "twoFactor" | "loggedIn";
  /** The current step's challenge (password change or 2FA, never interchangeable) */
  challengeToken: string | null;
  /** When the password-change challenge stops being worth sending (epoch ms) */
  challengeExpiresAt: number | null;
  /**
   * The password typed on the login form, kept only for the password-change step (its
   * "oldPassword"); cleared as soon as the step ends. Memory only: never persisted or logged.
   */
  rememberedPassword: string | null;
  /** Shown on the login form after returning to it (e.g. the challenge expired) */
  notice: string | null;
  /** Error of the current step; `traceId` only for a "details" area (support) */
  error: { message: string; traceId: string | null } | null;
};

export const INITIAL_LOGIN_FLOW: LoginFlowState = {
  step: "credentials",
  challengeToken: null,
  challengeExpiresAt: null,
  rememberedPassword: null,
  notice: null,
  error: null,
};

export type LoginFlowEvent =
  | { type: "loginAnswered"; response: LoginResponse; password: string; now: number }
  | { type: "passwordChangeAnswered"; response: LoginResponse; now: number }
  | { type: "twoFactorAnswered"; response: LoginResponse; now: number }
  | { type: "passwordChangeFailed"; error: unknown }
  | { type: "challengeExpired" }
  | { type: "clearError" }
  | { type: "cancel" };

/** The login flow's messages, in the user's language when they're read (auth:messages.*) */
export const MESSAGES = {
  get sessionExpired() {
    return i18n.t("auth:messages.sessionExpired");
  },
  get passwordRejected() {
    return i18n.t("auth:messages.passwordRejected");
  },
  get rateLimited() {
    return i18n.t("auth:messages.rateLimited");
  },
  get generic() {
    return i18n.t("auth:messages.generic");
  },
  get unexpected() {
    return i18n.t("auth:messages.unexpected");
  },
};

/** ProblemDetails ({ title, status, code, traceId }) of an RTK Query error */
export function problemOf(error: unknown): { status: number | null; code: string | null; traceId: string | null } {
  const data = (error as { data?: unknown } | null | undefined)?.data;
  const body = data && typeof data === "object" ? (data as { status?: unknown; code?: unknown; traceId?: unknown }) : {};
  const status = (error as { status?: unknown } | null | undefined)?.status;
  return {
    status: typeof status === "number" ? status : typeof body.status === "number" ? body.status : null,
    code: typeof body.code === "string" ? body.code : null,
    traceId: typeof body.traceId === "string" ? body.traceId : null,
  };
}

/** Back to the login form, with nothing of the challenge or the password kept */
const backToLogin = (notice: string | null): LoginFlowState => ({ ...INITIAL_LOGIN_FLOW, notice });

/** A LoginResponse (from any of the three endpoints) applied to the flow */
function answered(response: LoginResponse, password: string | null, now: number): LoginFlowState {
  switch (loginOutcome(response)) {
    case "passwordChange":
      return {
        ...INITIAL_LOGIN_FLOW,
        step: "passwordChange",
        challengeToken: response.challengeToken!,
        challengeExpiresAt: now + CHALLENGE_LIFETIME_MS,
        rememberedPassword: password,
      };
    case "twoFactor":
      return { ...INITIAL_LOGIN_FLOW, step: "twoFactor", challengeToken: response.challengeToken! };
    case "loggedIn":
      return { ...INITIAL_LOGIN_FLOW, step: "loggedIn" };
    default:
      return backToLogin(MESSAGES.unexpected);
  }
}

export function loginFlow(state: LoginFlowState, event: LoginFlowEvent): LoginFlowState {
  switch (event.type) {
    case "loginAnswered":
      return answered(event.response, event.password, event.now);

    case "passwordChangeAnswered":
      if (state.step !== "passwordChange") return state;
      // The step ends: the remembered password goes, whatever comes next
      return answered(event.response, null, event.now);

    case "twoFactorAnswered":
      // Only a 2FA step can be completed by a 2FA answer
      return state.step === "twoFactor" ? answered(event.response, null, event.now) : state;

    case "passwordChangeFailed": {
      if (state.step !== "passwordChange") return state;
      const { status, code, traceId } = problemOf(event.error);
      if (code === "session_expired" || status === 401) return backToLogin(MESSAGES.sessionExpired);
      const message =
        code === "validation_failed" || status === 400
          ? MESSAGES.passwordRejected
          : code === "rate_limited" || status === 429
            ? MESSAGES.rateLimited
            : MESSAGES.generic;
      // Same challenge: the user can try again
      return { ...state, error: { message, traceId } };
    }

    case "challengeExpired":
      return state.step === "passwordChange" ? backToLogin(MESSAGES.sessionExpired) : state;

    case "clearError":
      return state.error ? { ...state, error: null } : state;

    case "cancel":
      return INITIAL_LOGIN_FLOW;
  }
}

/** The body of POST /api/auth/password/change-required; null when the challenge has expired */
export function passwordChangeRequest(
  state: LoginFlowState,
  newPassword: string,
  now: number,
): { challengeToken: string; oldPassword: string; newPassword: string } | null {
  if (state.step !== "passwordChange" || !state.challengeToken || state.rememberedPassword === null) return null;
  if (state.challengeExpiresAt !== null && now > state.challengeExpiresAt) return null;
  return { challengeToken: state.challengeToken, oldPassword: state.rememberedPassword, newPassword };
}
