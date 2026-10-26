// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { MontraPOSApi } from "@platform/api/generated/MontraPOSApi";
import { API_ORIGIN, mockFetch } from "@platform/features/news/testing/renderWithApi";
import authReducer from "@platform/features/auth/authSlice";

// Where the Windows login goes: the API's Windows-login application (VITE_WINDOWS_LOGIN_URL), and
// nothing else does.
const target = vi.hoisted(() => ({ url: "https://login.example.test/windows" }));
vi.mock("@platform/api/apiBase", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@platform/api/apiBase")>()),
  get WINDOWS_LOGIN_URL() {
    return target.url;
  },
}));

const WINDOWS_LOGIN = "https://login.example.test/windows/api/auth/login/windows";

const token = (seconds: number) =>
  [{ alg: "HS256" }, { sub: "u", exp: Math.floor(Date.now() / 1000) + seconds }]
    .map((part) => btoa(JSON.stringify(part)).replace(/=+$/, ""))
    .join(".") + ".sig";

afterEach(() => {
  vi.unstubAllGlobals();
  target.url = "https://login.example.test/windows";
});

const makeStore = (signedInToken: string | null = null) =>
  configureStore({
    reducer: { auth: authReducer, [emptySplitApi.reducerPath]: emptySplitApi.reducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
    preloadedState: signedInToken
      ? { auth: { ...authReducer(undefined, { type: "init" }), token: signedInToken, isAuthenticated: true } }
      : undefined,
  });

const windowsLogin = (store: ReturnType<typeof makeStore>) =>
  store.dispatch(
    MontraPOSApi.endpoints.postApiAuthLoginWindows.initiate({ windowsLoginRequest: { rememberMe: false } }),
  );

const signedIn = { json: { accessToken: token(900), expiresInSeconds: 900, requiresTwoFactor: false } };

describe("POST /api/auth/login/windows", () => {
  it("goes to VITE_WINDOWS_LOGIN_URL, with credentials and without the bearer token (even with one)", async () => {
    const { requests } = mockFetch((url) => (url.href === WINDOWS_LOGIN ? signedIn : undefined));
    await windowsLogin(makeStore(token(900)));

    expect(requests.map((r) => r.url)).toEqual([WINDOWS_LOGIN]);
    expect(requests[0].credentials).toBe("include");
    expect(requests[0].headers.get("authorization")).toBeNull();
  });

  it("its answer signs in as a password login does; refresh, logout and 2FA then go to the main API", async () => {
    const { requests } = mockFetch((url) => (url.href === WINDOWS_LOGIN ? signedIn : { json: {} }));
    const store = makeStore();
    await windowsLogin(store);
    expect(store.getState().auth.isAuthenticated).toBe(true);

    await store.dispatch(MontraPOSApi.endpoints.postApiAuthRefresh.initiate());
    await store.dispatch(
      MontraPOSApi.endpoints.postApiAuth2FaVerify.initiate({ twoFactorVerifyRequest: { challengeToken: "c", code: "123456" } }),
    );
    await store.dispatch(MontraPOSApi.endpoints.postApiAuthLogout.initiate());

    expect(requests.slice(1).map((r) => r.url)).toEqual([
      `${API_ORIGIN}/api/auth/refresh`,
      `${API_ORIGIN}/api/auth/2fa/verify`,
      `${API_ORIGIN}/api/auth/logout`,
    ]);
  });

  it("a 401 means Windows authentication failed: no refresh and retry", async () => {
    const { requests } = mockFetch((url) =>
      url.href === WINDOWS_LOGIN ? { status: 401, json: { status: 401, code: "token_expired" } } : { json: {} },
    );
    const result = await windowsLogin(makeStore(token(900)));

    expect(result.error).toMatchObject({ status: 401 });
    expect(requests.map((r) => r.url)).toEqual([WINDOWS_LOGIN]);
  });

  it("not configured: nothing is sent, never to the main API", async () => {
    target.url = "";
    const { requests } = mockFetch(() => signedIn);
    const result = await windowsLogin(makeStore());

    expect(result.error).toMatchObject({ status: "CUSTOM_ERROR" });
    expect(requests).toHaveLength(0);
  });
});
