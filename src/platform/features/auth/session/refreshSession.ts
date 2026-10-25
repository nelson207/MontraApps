import { jwtDecode } from "jwt-decode";
import type { UnknownAction } from "@reduxjs/toolkit";
import { API_BASE_URL } from "@platform/api/apiBase";
import type { LoginResponse } from "@platform/api/generated/MontraPOSApi";
import { sessionRefreshed } from "@platform/api/sessionGuard";

// Silent refresh: POST /api/auth/refresh with the HttpOnly refresh cookie (credentials: include,
// never the bearer token) answers a new access token, kept in memory only. The API rotates the
// cookie on every refresh, so refreshes run one at a time, in this tab and across tabs (Web Locks).

export type SessionStore = { dispatch: (action: UnknownAction) => unknown; getState: () => unknown };

/** refreshed: new token in the store · ended: the session is over · unreachable: the API didn't answer */
export type RefreshResult = "refreshed" | "ended" | "unreachable";

const LOCK_NAME = "montra:session-refresh";

export const tokenOf = (state: unknown): string | null =>
  (state as { auth?: { token?: string | null } }).auth?.token ?? null;

/** When the token expires (ms since epoch), or null when it can't be read or has no expiry */
export function tokenExpiry(token: string | null | undefined): number | null {
  if (!token) return null;
  try {
    const { exp } = jwtDecode(token);
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/** Usable for at least `marginMs` more (a token without an expiry counts as usable) */
export function isFresh(token: string | null | undefined, now = Date.now(), marginMs = 0): token is string {
  if (!token) return false;
  const expiry = tokenExpiry(token);
  if (expiry === null) {
    try {
      jwtDecode(token);
      return true;
    } catch {
      return false;
    }
  }
  return expiry - marginMs > now;
}

async function withLock(task: () => Promise<RefreshResult>): Promise<RefreshResult> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  return locks ? await locks.request(LOCK_NAME, task) : task();
}

async function requestNewToken(store: SessionStore, before: string | null): Promise<RefreshResult> {
  // Another tab refreshed while this one waited for the lock: its token was shared (sessionSync)
  const current = tokenOf(store.getState());
  if (current && current !== before && isFresh(current, Date.now(), 30_000)) return "refreshed";

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch {
    return "unreachable";
  }
  if (!response.ok) return response.status >= 500 ? "unreachable" : "ended";

  const body = (await response.json().catch(() => null)) as LoginResponse | null;
  if (!body?.accessToken) return "ended";
  store.dispatch(sessionRefreshed({ accessToken: body.accessToken }));
  return "refreshed";
}

let inFlight: Promise<RefreshResult> | null = null;

/** Gets a new access token; concurrent callers share one request */
export function refreshSession(store: SessionStore): Promise<RefreshResult> {
  if (!inFlight) {
    const before = tokenOf(store.getState());
    inFlight = withLock(() => requestNewToken(store, before)).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
