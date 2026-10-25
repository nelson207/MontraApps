// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { MontraPOSApi } from "@platform/api/generated/MontraPOSApi";
import { mockFetch } from "@platform/features/news/testing/renderWithApi";
import authReducer, { setRememberMe } from "../authSlice";
import { refreshSession } from "./refreshSession";
import { restoreStep } from "./sessionSync";

/** An (unsigned) access token expiring in `seconds` */
const jwt = (seconds: number, id = "a") =>
  [{ alg: "HS256" }, { sub: id, exp: Math.floor(Date.now() / 1000) + seconds }]
    .map((part) => btoa(JSON.stringify(part)).replace(/=+$/, ""))
    .join(".") + `.sig-${id}`;

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer, [emptySplitApi.reducerPath]: emptySplitApi.reducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
  });

const storedValues = () =>
  [localStorage, sessionStorage].flatMap((storage) =>
    Array.from({ length: storage.length }, (_, i) => storage.getItem(storage.key(i)!) ?? ""),
  );

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("how a starting tab gets its session", () => {
  const remembered = { rememberMe: true };
  const notRemembered = { rememberMe: false };

  it("another open tab's token first (no request)", () =>
    expect(restoreStep({ hint: notRemembered, siblingToken: "t" })).toBe("adopt"));

  it("nothing to restore when no session was open", () =>
    expect(restoreStep({ hint: null, siblingToken: null })).toBe("none"));

  it("otherwise the cookie decides, with or without Remember me (never a logout from the app)", () => {
    // Remember me off: the API's cookie ended with the browser, so after a restart the refresh is
    // refused; a new tab or a reload in the same browser keeps the session
    expect(restoreStep({ hint: remembered, siblingToken: null })).toBe("refresh");
    expect(restoreStep({ hint: notRemembered, siblingToken: null })).toBe("refresh");
  });
});

describe("start-up with Remember me off", () => {
  const MONTRA = [{ alg: "HS256" }, { exp: Math.floor(Date.now() / 1000) + 900 }]
    .map((part) => btoa(JSON.stringify(part)).replace(/=+$/, ""))
    .join(".") + ".sig";

  it("a new tab (no other tab open) refreshes the session; it doesn't log out", async () => {
    localStorage.setItem("montra:session", JSON.stringify({ rememberMe: false, method: "password" }));
    const { requests } = mockFetch((url) => (url.pathname === "/api/auth/refresh" ? { json: { accessToken: MONTRA } } : undefined));
    vi.resetModules();
    const { connectSession } = await import("./sessionSync");
    const { default: freshAuth } = await import("../authSlice");
    const store = configureStore({ reducer: { auth: freshAuth } });
    const disconnect = connectSession(store);

    await vi.waitFor(() => expect(store.getState().auth.isAuthenticated).toBe(true), { timeout: 2000 });
    expect(requests.map((r) => new URL(r.url).pathname)).toEqual(["/api/auth/refresh"]);
    disconnect();
  });

  it("after the browser was closed the cookie is gone: the refresh is refused and the login page shows", async () => {
    localStorage.setItem("montra:session", JSON.stringify({ rememberMe: false, method: "password" }));
    const { requests } = mockFetch(() => ({ status: 401, json: { status: 401 } }));
    vi.resetModules();
    const { connectSession } = await import("./sessionSync");
    const { default: freshAuth } = await import("../authSlice");
    const store = configureStore({ reducer: { auth: freshAuth } });
    const disconnect = connectSession(store);

    await vi.waitFor(() => expect(store.getState().auth.isRestoring).toBe(false), { timeout: 2000 });
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(requests.map((r) => new URL(r.url).pathname)).toEqual(["/api/auth/refresh"]);
    expect(localStorage.getItem("montra:session")).toBeNull();
    disconnect();
  });
});

describe("the access token is kept in memory only", () => {
  it("a login never writes it to localStorage or sessionStorage", async () => {
    const token = jwt(900);
    mockFetch((url) => (url.pathname === "/api/auth/login" ? { json: { accessToken: token, expiresInSeconds: 900 } } : undefined));
    const store = makeStore();
    store.dispatch(setRememberMe(true));
    await store.dispatch(MontraPOSApi.endpoints.postApiAuthLogin.initiate({ loginRequest: { username: "ana", password: "x" } }));

    expect(store.getState().auth.token).toBe(token);
    expect(storedValues().some((value) => value.includes(token))).toBe(false);
  });

  it("tokens stored by earlier versions are removed on start", async () => {
    localStorage.setItem("token", jwt(900));
    sessionStorage.setItem("token", jwt(900));
    localStorage.setItem("user", '"ana"');
    vi.resetModules();
    const { default: freshReducer } = await import("../authSlice");
    const state = freshReducer(undefined, { type: "init" });

    expect(state.token).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
});

describe("silent refresh (POST /api/auth/refresh with the HttpOnly cookie)", () => {
  it("sends the cookie, never the bearer token, and keeps the new token in memory", async () => {
    const fresh = jwt(900, "new");
    const { requests } = mockFetch((url) => (url.pathname === "/api/auth/refresh" ? { json: { accessToken: fresh } } : undefined));
    const store = makeStore();

    expect(await refreshSession(store)).toBe("refreshed");
    expect(store.getState().auth.token).toBe(fresh);
    expect(requests[0].credentials).toBe("include");
    expect(requests[0].headers.get("authorization")).toBeNull();
  });

  it("concurrent callers share one request (the API rotates the cookie)", async () => {
    const { requests } = mockFetch((url) =>
      url.pathname === "/api/auth/refresh" ? { json: { accessToken: jwt(900) }, delay: 20 } : undefined,
    );
    const store = makeStore();
    const results = await Promise.all([refreshSession(store), refreshSession(store), refreshSession(store)]);

    expect(results).toEqual(["refreshed", "refreshed", "refreshed"]);
    expect(requests).toHaveLength(1);
  });

  it("401: the session is over · 5xx or no answer: the API is unreachable", async () => {
    mockFetch(() => ({ status: 401, json: { title: "Unauthorized" } }));
    expect(await refreshSession(makeStore())).toBe("ended");

    mockFetch(() => ({ status: 503, json: {} }));
    expect(await refreshSession(makeStore())).toBe("unreachable");

    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    expect(await refreshSession(makeStore())).toBe("unreachable");
  });

  it("an expired access token (401) is refreshed once and the request retried", async () => {
    const old = jwt(-10, "old");
    const fresh = jwt(900, "new");
    const { requests } = mockFetch((url, request) => {
      if (url.pathname === "/api/auth/refresh") return { json: { accessToken: fresh } };
      if (url.pathname === "/api/financial-products")
        return request.headers.get("authorization") === `Bearer ${fresh}` ? { json: [] } : { status: 401, json: { title: "Unauthorized", status: 401, code: "token_expired" } };
      return undefined;
    });
    const store = makeStore();
    store.dispatch({ type: "session/refreshed", payload: { accessToken: old } });

    const result = await store.dispatch(MontraPOSApi.endpoints.getApiFinancialProducts.initiate({ companyId: 1 } as never));
    expect(result.data).toEqual([]);
    expect(requests.map((r) => new URL(r.url).pathname)).toEqual(["/api/financial-products", "/api/auth/refresh", "/api/financial-products"]);
    expect(store.getState().auth.isAuthenticated).toBe(true);
  });

  it("when the refresh fails too, the user is signed out", async () => {
    const { requests } = mockFetch(() => ({ status: 401, json: { status: 401, code: "token_expired" } }));
    const store = makeStore();
    store.dispatch({ type: "session/refreshed", payload: { accessToken: jwt(-10) } });

    await store.dispatch(MontraPOSApi.endpoints.getApiFinancialProducts.initiate({ companyId: 1 } as never));
    expect(requests.map((r) => new URL(r.url).pathname)).toEqual(["/api/financial-products", "/api/auth/refresh"]);
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.token).toBeNull();
  });

  it("any other 401 signs the user out without trying a refresh", async () => {
    const { requests } = mockFetch(() => ({ status: 401, json: { title: "Unauthorized", status: 401, code: "invalid_token" } }));
    const store = makeStore();
    store.dispatch({ type: "session/refreshed", payload: { accessToken: jwt(900) } });

    await store.dispatch(MontraPOSApi.endpoints.getApiFinancialProducts.initiate({ companyId: 1 } as never));
    expect(requests.map((r) => new URL(r.url).pathname)).toEqual(["/api/financial-products"]);
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it("the e-mail confirmation is sent without the bearer token", async () => {
    const { requests } = mockFetch(() => ({ json: null }));
    const store = makeStore();
    store.dispatch({ type: "session/refreshed", payload: { accessToken: jwt(900) } });

    await store.dispatch(MontraPOSApi.endpoints.postApiUsersConfirmEmail.initiate({ emailConfirmationRequest: { code: "c" } }));
    expect(requests[0].headers.get("authorization")).toBeNull();
  });
});
