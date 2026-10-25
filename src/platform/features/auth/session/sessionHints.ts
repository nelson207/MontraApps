// What the session keeps in Web Storage: never a token (any script on the page can read
// Web Storage, so an XSS would steal it). The access token lives in memory only; the refresh
// token is the API's HttpOnly cookie (montra_rt, path /api/auth), which scripts can't read.
// Only these non-secret hints are stored. Storage can be unavailable (private mode, blocked
// site data, tests), so every access is guarded.

/** localStorage: "a session may exist, try to restore it" + the user's "Remember me" choice */
const HINT_KEY = "montra:session";
/** sessionStorage, development only: the unsigned "Demo access" token (no value to an attacker) */
const DEMO_KEY = "montra:demo-session";
/** Kept by earlier versions (the token itself; a per-tab marker no longer used): removed on start */
const LEGACY_KEYS = ["token", "user", "montra:session-tab"];

/** method: how the user signed in (Keycloak sessions also end at Keycloak on logout) */
export type SessionHint = { rememberMe: boolean; method?: SignInMethod };

export type SignInMethod = "password" | "idp" | "windows";

const read = (storage: () => Storage, key: string): string | null => {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
};

const write = (storage: () => Storage, key: string, value: string | null) => {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, value);
  } catch {
    // ignore: the session just won't be restored after a reload
  }
};

const local = () => localStorage;
const session = () => sessionStorage;

export function readSessionHint(): SessionHint | null {
  try {
    const hint = JSON.parse(read(local, HINT_KEY) ?? "null") as Partial<SessionHint> | null;
    if (!hint || typeof hint.rememberMe !== "boolean") return null;
    const method: SignInMethod = hint.method === "idp" || hint.method === "windows" ? hint.method : "password";
    return { rememberMe: hint.rememberMe, method };
  } catch {
    return null;
  }
}

/** A session is open (hint for the next start: try to restore it) */
export function markSessionOpen(hint: SessionHint) {
  write(local, HINT_KEY, JSON.stringify(hint));
}

export function forgetSession() {
  write(local, HINT_KEY, null);
  write(session, DEMO_KEY, null);
}


export const readDemoToken = () => (import.meta.env.DEV ? read(session, DEMO_KEY) : null);

export const saveDemoToken = (token: string) => {
  if (import.meta.env.DEV) write(session, DEMO_KEY, token);
};

/** Tokens stored by earlier versions: removed from both storages */
export function removeLegacyTokens() {
  for (const key of LEGACY_KEYS) {
    write(local, key, null);
    write(session, key, null);
  }
}
