// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isAutomaticWindowsSignInPaused,
  pauseAutomaticWindowsSignIn,
  readWindowsLoginMode,
  resumeAutomaticWindowsSignIn,
  shouldTryAutomatically,
  windowsSignInFailure,
} from "./windowsSignIn";
import { readWindowsLoginUrl } from "@platform/api/apiBase";

afterEach(() => localStorage.clear());

describe("VITE_WINDOWS_LOGIN and VITE_WINDOWS_LOGIN_URL", () => {
  const URL = { VITE_WINDOWS_LOGIN_URL: "https://api.example.com/windows" };

  it("off unless set to button or auto", () => {
    expect(readWindowsLoginMode({ ...URL })).toBe("off");
    expect(readWindowsLoginMode({ ...URL, VITE_WINDOWS_LOGIN: "yes" })).toBe("off");
    expect(readWindowsLoginMode({ ...URL, VITE_WINDOWS_LOGIN: "Button" })).toBe("button");
    expect(readWindowsLoginMode({ ...URL, VITE_WINDOWS_LOGIN: "auto" })).toBe("auto");
  });

  it("button or auto without the Windows-login URL: off (never the main API), with one error", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(readWindowsLoginMode({ VITE_WINDOWS_LOGIN: "button" })).toBe("off");
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][0]).toContain("VITE_WINDOWS_LOGIN_URL");
    expect(readWindowsLoginMode({ VITE_WINDOWS_LOGIN: "auto", VITE_WINDOWS_LOGIN_URL: "  " })).toBe("off");
    // Off by choice: nothing to say
    readWindowsLoginMode({});
    expect(error).toHaveBeenCalledTimes(2);
    error.mockRestore();
  });

  it("automatic only against an HTTPS Windows-login URL (the browser sends Windows credentials to it)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(readWindowsLoginMode({ VITE_WINDOWS_LOGIN: "auto", VITE_WINDOWS_LOGIN_URL: "http://api.example.com/windows" })).toBe(
      "button",
    );
    warn.mockRestore();
  });

  it("the URL without its trailing slash(es)", () => {
    expect(readWindowsLoginUrl({ VITE_WINDOWS_LOGIN_URL: " https://api.example.com/windows/ " })).toBe("https://api.example.com/windows");
    expect(readWindowsLoginUrl({ VITE_WINDOWS_LOGIN_URL: "https://api.example.com/windows//" })).toBe("https://api.example.com/windows");
    expect(readWindowsLoginUrl({})).toBe("");
  });
});

describe("when the login page tries Windows by itself", () => {
  const ready = { mode: "auto" as const, paused: false, hasNotice: false, isAuthenticated: false, isRestoring: false };

  it("in auto mode, once nothing else is going on", () => expect(shouldTryAutomatically(ready)).toBe(true));

  it("never after a logout, with a notice on the page, with a session open or being restored, or outside auto", () => {
    expect(shouldTryAutomatically({ ...ready, paused: true })).toBe(false);
    expect(shouldTryAutomatically({ ...ready, hasNotice: true })).toBe(false);
    expect(shouldTryAutomatically({ ...ready, isAuthenticated: true })).toBe(false);
    expect(shouldTryAutomatically({ ...ready, isRestoring: true })).toBe(false);
    expect(shouldTryAutomatically({ ...ready, mode: "button" })).toBe(false);
  });

  it("a logout pauses it in every tab until someone chooses Windows again", () => {
    expect(isAutomaticWindowsSignInPaused()).toBe(false);
    pauseAutomaticWindowsSignIn();
    expect(isAutomaticWindowsSignInPaused()).toBe(true);
    resumeAutomaticWindowsSignIn();
    expect(isAutomaticWindowsSignInPaused()).toBe(false);
  });
});

describe("Windows sign-in messages", () => {
  const problem = (status: number, code: string) => ({ status, data: { status, code, title: "server text" } });

  it("an automatic attempt that doesn't work says nothing: the form is there", () => {
    expect(windowsSignInFailure(problem(401, "invalid_credentials"), true)).toBeNull();
    expect(windowsSignInFailure({ status: "TIMEOUT_ERROR" }, true)).toBeNull();
  });

  it("a chosen sign-in explains, without the server's text", () => {
    expect(windowsSignInFailure(problem(401, "invalid_credentials"), false)).toContain("username and password");
    expect(windowsSignInFailure(problem(502, "backend_unavailable"), false)).toContain("temporarily unavailable");
    expect(windowsSignInFailure(problem(429, "rate_limited"), true)).toContain("wait");
    expect(windowsSignInFailure(problem(500, "x"), false)).not.toContain("server text");
  });

  it("button: 401 failed (use the form); 404 and network errors unavailable; never a status code", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const failed = windowsSignInFailure({ status: 401 }, false);
    const wrongApp = windowsSignInFailure(problem(404, "x"), false);
    const network = windowsSignInFailure({ status: "FETCH_ERROR", error: "TypeError: Failed to fetch" }, false);

    expect(failed).toContain("username and password");
    expect(wrongApp).toContain("isn't available");
    expect(network).toBe(wrongApp);
    for (const message of [failed, wrongApp, network]) expect(message).not.toMatch(/\d{3}|FETCH_ERROR/);
    error.mockRestore();
  });

  it("a 404 logs which setting to fix, in auto mode too", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    windowsSignInFailure(problem(404, "x"), false);
    windowsSignInFailure(problem(404, "x"), true);
    expect(error).toHaveBeenCalledTimes(2);
    expect(error.mock.calls[0][0]).toContain("VITE_WINDOWS_LOGIN_URL");
    error.mockRestore();
  });

  it("auto: 401, 404 and network errors say nothing", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(windowsSignInFailure({ status: 401 }, true)).toBeNull();
    expect(windowsSignInFailure(problem(404, "x"), true)).toBeNull();
    expect(windowsSignInFailure({ status: "FETCH_ERROR", error: "x" }, true)).toBeNull();
    error.mockRestore();
  });
});
