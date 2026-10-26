import { readWindowsLoginUrl } from "@platform/api/apiBase";
import { DEPLOYMENT_SETTINGS } from "@platform/app/deployment";
import { problemCode } from "@platform/api/problemCode";
import i18n from "@platform/i18n/i18n";

// "Sign in with Windows" (POST /api/auth/login/windows, Negotiate: Kerberos/NTLM), set per
// environment in every app (in config.js, .env or .env.<app>):
//   VITE_WINDOWS_LOGIN
//     off     no Windows sign-in (default)
//     button  a "Sign in with Windows" button on the login page
//     auto    the login page tries it once by itself, falling back to the form; plus the button.
//             Silent only on browsers that trust the API host for Windows sign-in (Local intranet
//             zone / AuthServerAllowlist); elsewhere the browser shows its own credentials prompt.
//   VITE_WINDOWS_LOGIN_URL
//     The API's Windows-login application (e.g. https://vmafs-fe02:8443/windows), the only one with
//     Windows Authentication. Required for button and auto: without it Windows sign-in is off.
//     Only the Windows login goes there; refresh, logout, 2FA and the rest stay on the main API.
//
// Who signs in is never the app's choice: the browser proves the Windows identity to the API
// (Negotiate), and the API takes the username only from that proof. The request carries no
// username, and nothing from the URL or storage can choose an account. The app only decides
// whether to *ask*, and makes sure nobody is signed in without meaning to:
//  - after an explicit logout, no automatic attempt until someone chooses Windows again
//    (a shared terminal's next user isn't signed in as the previous one)
//  - an automatic sign-in never uses "Remember me": its session ends with the browser
//  - automatic only against an HTTPS Windows-login URL (the browser sends Windows credentials to it)

export type WindowsLoginMode = "off" | "button" | "auto";

export function readWindowsLoginMode(env: Partial<Record<string, string | undefined>>): WindowsLoginMode {
  const value = env.VITE_WINDOWS_LOGIN?.trim().toLowerCase();
  if (value !== "button" && value !== "auto") return "off";
  const url = readWindowsLoginUrl(env);
  if (!url) {
    console.error(
      `VITE_WINDOWS_LOGIN=${value} needs VITE_WINDOWS_LOGIN_URL (the API's Windows-login application, e.g. https://<api host>/windows): Windows sign-in is off.`,
    );
    return "off";
  }
  if (value === "auto" && !url.startsWith("https://")) {
    console.warn("VITE_WINDOWS_LOGIN=auto needs an HTTPS VITE_WINDOWS_LOGIN_URL: automatic Windows sign-in is off (the button stays).");
    return "button";
  }
  return value;
}

export const WINDOWS_LOGIN_MODE = readWindowsLoginMode(DEPLOYMENT_SETTINGS);

/** How long an automatic attempt may take before the form is shown (no Windows prompt is waited on) */
export const AUTO_ATTEMPT_TIMEOUT_MS = 8_000;

// --- Pause after logout (localStorage: every tab of this app; not a secret) -------------------

const PAUSED_KEY = "montra:windows-auto-paused";

export function pauseAutomaticWindowsSignIn() {
  try {
    localStorage.setItem(PAUSED_KEY, "1");
  } catch {
    // storage unavailable: the next page load may try again, as without the feature
  }
}

export function resumeAutomaticWindowsSignIn() {
  try {
    localStorage.removeItem(PAUSED_KEY);
  } catch {
    // ignore
  }
}

export const isAutomaticWindowsSignInPaused = (): boolean => {
  try {
    return localStorage.getItem(PAUSED_KEY) === "1";
  } catch {
    return true; // can't tell: don't sign anyone in by surprise
  }
};

/**
 * Whether the login page tries Windows by itself: only in "auto" mode, not after a logout, and not
 * when the page was opened to say something (session expired, a failed sign-in) or a session
 * is already open or being restored.
 */
export function shouldTryAutomatically(input: {
  mode: WindowsLoginMode;
  paused: boolean;
  hasNotice: boolean;
  isAuthenticated: boolean;
  isRestoring: boolean;
}): boolean {
  return input.mode === "auto" && !input.paused && !input.hasNotice && !input.isAuthenticated && !input.isRestoring;
}

// --- Errors ---------------------------------------------------------------------------------

/** null: nothing to say (an automatic attempt that didn't work just shows the form) */
export function windowsSignInFailure(error: unknown, automatic: boolean): string | null {
  const status = (error as { status?: unknown } | undefined)?.status;
  const code = problemCode(error);
  // No Windows login there: most likely the main API's URL instead of its Windows-login application
  if (status === 404) {
    console.error("Windows sign-in: 404 from VITE_WINDOWS_LOGIN_URL. It must be the API's Windows-login application (e.g. https://<api host>/windows), not the main API.");
  }
  if (status === 429 || code === "rate_limited") return i18n.t("auth:windows.rateLimited");
  if (automatic) return null;
  if (status === 401 || code === "invalid_credentials") {
    return i18n.t("auth:windows.invalidCredentials");
  }
  if (status === 502 || code === "backend_unavailable") return i18n.t("auth:windows.unavailable");
  // The wrong application, not configured, or not reachable (network, CORS, a hanging handshake)
  if (status === 404 || status === "CUSTOM_ERROR" || status === "FETCH_ERROR" || status === "TIMEOUT_ERROR") {
    return i18n.t("auth:windows.notAvailableHere");
  }
  if (status === 400 && code === "validation_failed") console.error("Windows sign-in rejected (validation_failed)", error);
  return i18n.t("auth:windows.failed");
}
