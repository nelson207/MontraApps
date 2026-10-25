// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { mockFetch } from "@platform/features/news/testing/renderWithApi";
import authReducer from "../authSlice";
import { finishIdpSignIn } from "../idp/idpClient";
import AuthCallbackPage, { type IdpLoginNavState } from "./AuthCallbackPage";

vi.mock("../idp/idpClient", () => ({ finishIdpSignIn: vi.fn() }));

const KEYCLOAK_TOKEN = "keycloak.access.token";
const MONTRA_TOKEN = `${btoa(JSON.stringify({ alg: "HS256" }))}.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 900 }))}.sig`;

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer, [emptySplitApi.reducerPath]: emptySplitApi.reducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
  });

function LoginProbe() {
  const state = useLocation().state as IdpLoginNavState | null;
  return <p>login page: {state?.idpFailure?.message}</p>;
}

function renderCallback(store = makeStore()) {
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/auth/callback?code=abc&state=xyz"]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/login" element={<LoginProbe />} />
          <Route path="/tasks" element={<p>tasks page</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
}

const storage = () =>
  [localStorage, sessionStorage].flatMap((s) => Array.from({ length: s.length }, (_, i) => s.getItem(s.key(i)!) ?? ""));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.mocked(finishIdpSignIn).mockReset();
});

describe("Keycloak callback", () => {
  it("exchanges Keycloak's access token for a MontraAPI session, then goes where the user was going", async () => {
    vi.mocked(finishIdpSignIn).mockResolvedValue({ accessToken: KEYCLOAK_TOKEN, state: { rememberMe: true, from: "/tasks" } });
    const { requests } = mockFetch((url) =>
      url.pathname === "/api/auth/login/idp" ? { json: { accessToken: MONTRA_TOKEN, expiresInSeconds: 900, requiresTwoFactor: false } } : undefined,
    );
    const store = renderCallback();

    expect(await screen.findByText("tasks page")).toBeTruthy();
    const exchange = requests.find((r) => new URL(r.url).pathname === "/api/auth/login/idp")!;
    expect(await exchange.clone().json()).toEqual({
      token: KEYCLOAK_TOKEN,
      montraAplApplication: "MONTRA_APPLICATION_CREDIT",
      rememberMe: true,
    });
    // Anonymous: Keycloak's token travels in the body only, never as a bearer
    expect(exchange.headers.get("authorization")).toBeNull();

    // The MontraAPI session is open, in memory; Keycloak's token is kept nowhere
    expect(store.getState().auth).toMatchObject({ token: MONTRA_TOKEN, isAuthenticated: true, signInMethod: "idp", rememberMe: true });
    expect(JSON.stringify(store.getState())).not.toContain(KEYCLOAK_TOKEN);
    expect(storage().some((value) => value.includes(KEYCLOAK_TOKEN) || value.includes(MONTRA_TOKEN))).toBe(false);
  });

  it("401 invalid_credentials: back to the login page with the organization account message", async () => {
    vi.mocked(finishIdpSignIn).mockResolvedValue({ accessToken: KEYCLOAK_TOKEN, state: { rememberMe: false, from: "/" } });
    mockFetch(() => ({ status: 401, json: { status: 401, code: "invalid_credentials", title: "Unauthorized" } }));
    const store = renderCallback();

    expect(await screen.findByText(/Could not sign in with your organization account/)).toBeTruthy();
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it("the user cancelled at Keycloak (error in the callback): back to the login page with a message", async () => {
    vi.mocked(finishIdpSignIn).mockRejectedValue(Object.assign(new Error("access_denied"), { error: "access_denied" }));
    const { requests } = mockFetch(() => undefined);
    renderCallback();

    expect(await screen.findByText(/was cancelled/)).toBeTruthy();
    await waitFor(() => expect(requests).toHaveLength(0));
  });
});
