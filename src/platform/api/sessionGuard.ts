import { createAction } from "@reduxjs/toolkit";

// The API answers ErrorCode "ErrInvalidSessionToken" when the session token is no longer valid:
// the app then signs the user out and goes back to the login page (see emptyApi.ts).

export const INVALID_SESSION_CODE = "ErrInvalidSessionToken";

const codeOf = (body: unknown): unknown => {
  if (typeof body === "string") {
    try {
      return codeOf(JSON.parse(body));
    } catch {
      return undefined;
    }
  }
  if (body && typeof body === "object") {
    const { ErrorCode, errorCode } = body as { ErrorCode?: unknown; errorCode?: unknown };
    return ErrorCode ?? errorCode;
  }
  return undefined;
};

/** An RTK Query error ({ status, data }) whose body has ErrorCode / errorCode "ErrInvalidSessionToken" */
export function isInvalidSession(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("data" in error)) return false;
  return codeOf((error as { data: unknown }).data) === INVALID_SESSION_CODE;
}

/** A successful response body that still says the session is invalid (top-level ErrorCode / errorCode) */
export function carriesInvalidSession(body: unknown): boolean {
  return codeOf(body) === INVALID_SESSION_CODE;
}

/**
 * Dispatched by the API layer when the session token is invalid. Handled by the auth slice
 * (token removed); App's SessionExpiredRedirect then goes back to the login page.
 * A plain action, so the API layer doesn't import the auth slice (which imports the API).
 */
export const sessionExpired = createAction("session/expired");

/**
 * A new access token for the open session (silent refresh, or another tab's session),
 * kept in memory only. Same reason as sessionExpired for being a plain action.
 */
export const sessionRefreshed = createAction<{ accessToken: string }>("session/refreshed");

/** The session ended in another tab (logout or expiry): end it here too, without calling the API */
export const sessionEndedElsewhere = createAction("session/endedElsewhere");
