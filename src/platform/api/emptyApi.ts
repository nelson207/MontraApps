import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { isDemoToken } from "../features/auth/demoSession";
import { refreshSession } from "../features/auth/session/refreshSession";
import { currentLanguage } from "@platform/i18n/i18n";
import { API_BASE_URL, WINDOWS_LOGIN_URL } from "./apiBase";
import { demoResponse } from "./demoBackend";
import { isMissingEndpoint } from "./devFallback";
import { isInvalidId, problemCode, PROBLEM } from "./problemCode";
import {
  carriesInvalidSession,
  isInvalidSession,
  sessionExpired,
} from "./sessionGuard";

const tokenOf = (state: unknown) =>
  (state as { auth?: { token?: string | null } }).auth?.token;

/**
 * Anonymous endpoints (sign-in steps): never sent with the session's bearer token. Their
 * challenge tokens travel in the body only.
 */
export const ANONYMOUS_ENDPOINTS = new Set([
  "postApiAuthLogin",
  "postApiAuthLoginWindows",
  "postApiAuth2FaVerify",
  "postApiAuthPasswordChangeRequired",
  "postApiAuthPasswordForgot",
  // Its body carries Keycloak's access token, the one time it's sent anywhere
  "postApiAuthLoginIdp",
  // The refresh cookie authenticates it (never the bearer token)
  "postApiAuthRefresh",
  // The e-mail confirmation link is opened without signing in; its code is the proof
  "postApiUsersConfirmEmail",
]);

/** Query strings: an array repeats its key (?states=12&states=13, as ASP.NET binds lists); null and undefined are left out */
export function serializeParams(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined && item !== null) search.append(key, String(item));
    }
  }
  return search.toString();
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState, endpoint }) => {
    const token = tokenOf(getState());
    if (token && !ANONYMOUS_ENDPOINTS.has(endpoint)) headers.set("authorization", `Bearer ${token}`);
    // The language shown, so the API can answer in it (names, messages) once it translates
    headers.set("accept-language", currentLanguage());
    return headers;
  },
  credentials: "include",
  paramsSerializer: serializeParams,
});

/**
 * POST /api/auth/login/windows goes to the Windows-login application (WINDOWS_LOGIN_URL), every
 * other request to the main API. Still anonymous (no bearer, no refresh-and-retry: a 401 there
 * means Windows authentication failed) and with credentials (Negotiate handshake, refresh cookie).
 * Not configured: not sent at all, never to the main API.
 */
function windowsLoginRequest(args: string | FetchArgs): string | FetchArgs | null {
  if (!WINDOWS_LOGIN_URL) return null;
  return typeof args === "string" ? `${WINDOWS_LOGIN_URL}${args}` : { ...args, url: `${WINDOWS_LOGIN_URL}${args.url}` };
}

/**
 * Every request: a 401 with code "token_expired" gets one silent refresh and retry; any other
 * 401, or one still there after the refresh, signs the user out (authSlice → login page), and so
 * does an invalid session token (ErrorCode ErrInvalidSessionToken).
 * Development with "Demo access": when the API can't be reached, the demo backend answers
 * (platform/api/demoBackend.ts, registered by the apps).
 */
const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  if (api.endpoint === "postApiAuthLoginWindows") {
    const request = windowsLoginRequest(args);
    if (!request) return { error: { status: "CUSTOM_ERROR", error: "VITE_WINDOWS_LOGIN_URL is not set" } };
    return rawBaseQuery(request, api, extraOptions);
  }
  let result = await rawBaseQuery(args, api, extraOptions);
  if (
    import.meta.env.DEV &&
    isDemoToken(tokenOf(api.getState())) &&
    isMissingEndpoint(result.error)
  ) {
    const demo = await demoResponse(args);
    if (demo) return demo;
  }
  // Expired access token (401 token_expired): get a new one with the refresh cookie and retry
  // once. Not for the sign-in steps (no session yet), nor any other 401 (a new token won't help).
  if (
    result.error?.status === 401 &&
    problemCode(result.error) === PROBLEM.tokenExpired &&
    !ANONYMOUS_ENDPOINTS.has(api.endpoint) &&
    api.endpoint !== "postApiAuthLogout" &&
    tokenOf(api.getState()) &&
    !isDemoToken(tokenOf(api.getState())) &&
    !isInvalidSession(result.error)
  ) {
    const refreshed = await refreshSession(api);
    if (refreshed === "refreshed") result = await rawBaseQuery(args, api, extraOptions);
  }
  if (isInvalidSession(result.error) || carriesInvalidSession(result.data))
    api.dispatch(sessionExpired());
  // 400 invalid_id: an id that isn't a valid token for its field. Usually a bug (a number or
  // mangled id sent); for saved ids (context, bookmarks) the features drop them and fall back.
  if (isInvalidId(result.error)) console.warn(`MontraAPI rejected an id (invalid_id) on ${api.endpoint}`);
  return result;
};

export const emptySplitApi = createApi({
  reducerPath: "api",
  baseQuery,
  refetchOnMountOrArgChange: true,
  endpoints: () => ({}),
});
