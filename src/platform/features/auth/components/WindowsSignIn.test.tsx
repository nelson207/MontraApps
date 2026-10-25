// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { mockFetch, type MockAnswer } from "@platform/features/news/testing/renderWithApi";
import authReducer from "../authSlice";
import { isAutomaticWindowsSignInPaused, pauseAutomaticWindowsSignIn } from "../windows/windowsSignIn";
import WindowsSignIn from "./WindowsSignIn";

const config = vi.hoisted(() => ({ mode: "auto" as "off" | "button" | "auto" }));
vi.mock("../windows/windowsSignIn", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../windows/windowsSignIn")>()),
  get WINDOWS_LOGIN_MODE() {
    return config.mode;
  },
}));

const TOKEN = `${btoa(JSON.stringify({ alg: "HS256" }))}.${btoa(JSON.stringify({ lm: "windows", exp: Math.floor(Date.now() / 1000) + 900 }))}.sig`;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  config.mode = "auto";
});

function setup(answer: MockAnswer & { delay?: number }, props: { rememberMe?: boolean; hasNotice?: boolean } = {}) {
  const { requests } = mockFetch((url) => (url.pathname === "/api/auth/login/windows" ? answer : undefined));
  const store = configureStore({
    reducer: { auth: authReducer, [emptySplitApi.reducerPath]: emptySplitApi.reducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
  });
  render(
    <Provider store={store}>
      <WindowsSignIn rememberMe={props.rememberMe ?? false} hasNotice={props.hasNotice ?? false} />
    </Provider>,
  );
  const windowsCalls = () => requests.filter((r) => new URL(r.url).pathname === "/api/auth/login/windows");
  return { store, windowsCalls };
}

const signedIn: MockAnswer = { json: { accessToken: TOKEN, expiresInSeconds: 900, requiresTwoFactor: false } };
const notAWindowsUser: MockAnswer = { status: 401, json: { status: 401, code: "invalid_credentials" } };

describe("automatic Windows sign-in (VITE_WINDOWS_LOGIN=auto)", () => {
  it("tries once; the request names no account (the browser proves who it is) and carries no bearer", async () => {
    const { store, windowsCalls } = setup(signedIn, { rememberMe: true });
    await waitFor(() => expect(store.getState().auth.isAuthenticated).toBe(true));

    expect(windowsCalls()).toHaveLength(1);
    const [request] = windowsCalls();
    // Exactly these fields: no username, and Remember me off for an automatic sign-in
    expect(await request.clone().json()).toEqual({ montraAplApplication: "MONTRA_APPLICATION_CREDIT", rememberMe: false });
    expect(request.headers.get("authorization")).toBeNull();
    expect(request.credentials).toBe("include");
    expect(store.getState().auth.signInMethod).toBe("windows");
  });

  it("not a Windows user here (401): no message, the button (and the form) are there", async () => {
    const { store } = setup(notAWindowsUser);
    expect(await screen.findByRole("button", { name: /Sign in with Windows/ })).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it("not after a logout: nobody is signed in by surprise", async () => {
    pauseAutomaticWindowsSignIn();
    const { windowsCalls } = setup(signedIn);
    expect(await screen.findByRole("button", { name: /Sign in with Windows/ })).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(windowsCalls()).toHaveLength(0);
  });

  it("not when the page was opened to say something (e.g. session expired)", async () => {
    const { windowsCalls } = setup(signedIn, { hasNotice: true });
    await screen.findByRole("button", { name: /Sign in with Windows/ });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(windowsCalls()).toHaveLength(0);
  });

  it("'Use another account' stops it and pauses it", async () => {
    const { store } = setup({ ...signedIn, delay: 300 });
    await userEvent.click(await screen.findByRole("button", { name: "Use another account" }));

    expect(await screen.findByRole("button", { name: /Sign in with Windows/ })).toBeTruthy();
    expect(isAutomaticWindowsSignInPaused()).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });
});

describe("the Sign in with Windows button (VITE_WINDOWS_LOGIN=button)", () => {
  it("asks only when clicked, with the form's Remember me; a sign-in resumes automatic sign-in", async () => {
    config.mode = "button";
    pauseAutomaticWindowsSignIn();
    const { store, windowsCalls } = setup(signedIn, { rememberMe: true });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(windowsCalls()).toHaveLength(0);

    await userEvent.click(screen.getByRole("button", { name: /Sign in with Windows/ }));
    await waitFor(() => expect(store.getState().auth.isAuthenticated).toBe(true));
    expect((await windowsCalls()[0].clone().json()).rememberMe).toBe(true);
    expect(isAutomaticWindowsSignInPaused()).toBe(false);
  });

  it("explains when this Windows account can't sign in", async () => {
    config.mode = "button";
    setup(notAWindowsUser);
    await userEvent.click(screen.getByRole("button", { name: /Sign in with Windows/ }));
    expect((await screen.findByRole("alert")).textContent).toContain("username and password");
  });

  it("nothing at all when off", () => {
    config.mode = "off";
    setup(signedIn);
    expect(screen.queryByRole("button", { name: /Sign in with Windows/ })).toBeNull();
  });
});
