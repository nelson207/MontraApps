// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { mockFetch } from "@platform/features/news/testing/renderWithApi";
import { endIdpSession } from "../idp/idpClient";
import { isAutomaticWindowsSignInPaused } from "../windows/windowsSignIn";
import LogoutButton from "./LogoutButton";

vi.mock("../idp/idpClient", () => ({ endIdpSession: vi.fn(() => Promise.resolve()) }));
vi.mock("../idp/idpConfig", () => ({
  IDP_CONFIG: { authority: "https://sso.example.com/realms/montra", clientId: "pos", scope: "openid", label: "Keycloak" },
  IDP_CALLBACK_PATH: "/auth/callback",
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.mocked(endIdpSession).mockClear();
});

function renderLogout(signInMethod: "password" | "idp") {
  const store = configureStore({
    reducer: {
      auth: () => ({ token: "montra-token", isAuthenticated: true, signInMethod }),
      [emptySplitApi.reducerPath]: emptySplitApi.reducer,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<LogoutButton />} />
          <Route path="/login" element={<p>login page</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe("logout", () => {
  it("Keycloak session: POST /api/auth/logout, then Keycloak's end-session too", async () => {
    const { requests } = mockFetch((url) => (url.pathname === "/api/auth/logout" ? { status: 204 } : undefined));
    renderLogout("idp");
    await userEvent.click(screen.getByRole("button", { name: /Log out/ }));

    await waitFor(() => expect(endIdpSession).toHaveBeenCalledTimes(1));
    expect(requests.map((r) => new URL(r.url).pathname)).toEqual(["/api/auth/logout"]);
  });

  it("password session: only the API logout, back to the login page", async () => {
    mockFetch((url) => (url.pathname === "/api/auth/logout" ? { status: 204 } : undefined));
    renderLogout("password");
    await userEvent.click(screen.getByRole("button", { name: /Log out/ }));

    expect(await screen.findByText("login page")).toBeTruthy();
    expect(endIdpSession).not.toHaveBeenCalled();
  });

  it("any logout pauses automatic Windows sign-in (the next person isn't signed in as this one)", async () => {
    mockFetch((url) => (url.pathname === "/api/auth/logout" ? { status: 204 } : undefined));
    renderLogout("password");
    await userEvent.click(screen.getByRole("button", { name: /Log out/ }));
    await screen.findByText("login page");
    expect(isAutomaticWindowsSignInPaused()).toBe(true);
  });
});
