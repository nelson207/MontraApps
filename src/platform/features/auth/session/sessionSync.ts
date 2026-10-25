import { sessionEndedElsewhere, sessionExpired, sessionRefreshed } from "@platform/api/sessionGuard";
import { restoreFinished } from "../authSlice";
import { isDemoToken } from "../demoSession";
import { isFresh, refreshSession, tokenExpiry, tokenOf, type SessionStore } from "./refreshSession";
import {
  forgetSession,
  markSessionOpen,
  readSessionHint,
  type SessionHint,
  type SignInMethod,
} from "./sessionHints";

// Keeps the in-memory session alive and in step across this app's tabs:
//  - start: restore it (another open tab's token, else the refresh cookie)
//  - a minute before the access token expires: refresh it
//  - login / refresh / logout in one tab: the others follow (BroadcastChannel, same origin only)
// "Remember me" is the API's: off, its refresh cookie is a browser-session cookie, so after the
// browser closes the refresh is refused and the login page shows.

const CHANNEL = "montra:session";
/** Refresh this long before the access token expires */
const REFRESH_AHEAD_MS = 60_000;
/** Wait for an API that didn't answer before trying again */
const RETRY_MS = 30_000;
/** How long a starting tab waits for an open tab to share its session */
const SIBLING_WAIT_MS = 250;

type Message =
  | { type: "session"; token: string }
  | { type: "ended" }
  | { type: "ping"; id: string }
  | { type: "pong"; id: string; token: string };

export type RestoreStep = "adopt" | "refresh" | "none";

/**
 * How a starting tab gets its session:
 *  - another open tab has one → use it (no request)
 *  - no session was open → nothing to restore
 *  - otherwise → refresh it with the cookie (refused when it's gone, e.g. Remember me was off
 *    and the browser was closed)
 */
export function restoreStep(input: { hint: SessionHint | null; siblingToken: string | null }): RestoreStep {
  if (input.siblingToken) return "adopt";
  if (!input.hint) return "none";
  return "refresh";
}

type Store = SessionStore & { subscribe: (listener: () => void) => () => void };

const authOf = (store: Store) =>
  (store.getState() as { auth: { rememberMe: boolean; isRestoring: boolean; signInMethod: SignInMethod } }).auth;

export function connectSession(store: Store): () => void {
  const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANNEL);
  const post = (message: Message) => channel?.postMessage(message);
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** The change being applied came from another tab: don't send it back */
  let applyingRemote = false;

  const applyRemote = (action: Parameters<Store["dispatch"]>[0]) => {
    applyingRemote = true;
    try {
      store.dispatch(action);
    } finally {
      applyingRemote = false;
    }
  };

  const scheduleRefresh = (token: string | null, delayMs?: number) => {
    clearTimeout(timer);
    if (!token || isDemoToken(token)) return;
    const expiry = tokenExpiry(token);
    if (expiry === null) return;
    const delay = delayMs ?? Math.max(expiry - Date.now() - REFRESH_AHEAD_MS, 0);
    timer = setTimeout(async () => {
      const result = await refreshSession(store);
      if (result === "ended") store.dispatch(sessionExpired());
      // API down: try again while the token still works (requests will retry on their own after)
      if (result === "unreachable" && isFresh(tokenOf(store.getState()), Date.now(), RETRY_MS)) {
        scheduleRefresh(tokenOf(store.getState()), RETRY_MS);
      }
    }, delay);
  };

  let last = tokenOf(store.getState());
  scheduleRefresh(last);
  const unsubscribe = store.subscribe(() => {
    const token = tokenOf(store.getState());
    if (token === last) return;
    const previous = last;
    last = token;
    scheduleRefresh(token);

    if (token) {
      if (!isDemoToken(token)) markSessionOpen({ rememberMe: authOf(store).rememberMe, method: authOf(store).signInMethod });
      if (!applyingRemote) post({ type: "session", token });
    } else {
      forgetSession();
      if (!applyingRemote && previous) post({ type: "ended" });
    }
  });

  const pending = new Map<string, (token: string) => void>();
  if (channel) {
    channel.onmessage = ({ data }: MessageEvent<Message>) => {
      const token = tokenOf(store.getState());
      switch (data?.type) {
        case "ping":
          if (isFresh(token)) post({ type: "pong", id: data.id, token });
          break;
        case "pong":
          pending.get(data.id)?.(data.token);
          break;
        case "session":
          if (data.token !== token && isFresh(data.token)) applyRemote(sessionRefreshed({ accessToken: data.token }));
          break;
        case "ended":
          if (token) applyRemote(sessionEndedElsewhere());
          break;
      }
    };
  }

  const askOpenTabs = (): Promise<string | null> => {
    if (!channel) return Promise.resolve(null);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve) => {
      const done = (token: string | null) => {
        pending.delete(id);
        clearTimeout(timeout);
        resolve(token);
      };
      const timeout = setTimeout(() => done(null), SIBLING_WAIT_MS);
      pending.set(id, (token) => isFresh(token) && done(token));
      post({ type: "ping", id });
    });
  };

  const restore = async () => {
    if (!authOf(store).isRestoring) return;
    const hint = readSessionHint();
    const siblingToken = await askOpenTabs();
    const step = restoreStep({ hint, siblingToken });

    if (step === "adopt" && siblingToken) return applyRemote(sessionRefreshed({ accessToken: siblingToken }));
    if (step === "refresh") {
      const result = await refreshSession(store);
      if (result === "refreshed") return;
      // API down: keep the hint, so the next start tries again
      if (result === "ended") forgetSession();
    } else {
      forgetSession();
    }
    store.dispatch(restoreFinished());
  };
  void restore();

  return () => {
    clearTimeout(timer);
    unsubscribe();
    channel?.close();
  };
}
