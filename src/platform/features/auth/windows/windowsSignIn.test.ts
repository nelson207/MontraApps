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

afterEach(() => localStorage.clear());

describe("VITE_WINDOWS_LOGIN", () => {
  it("off unless set to button or auto", () => {
    expect(readWindowsLoginMode({})).toBe("off");
    expect(readWindowsLoginMode({ VITE_WINDOWS_LOGIN: "yes" })).toBe("off");
    expect(readWindowsLoginMode({ VITE_WINDOWS_LOGIN: "Button" })).toBe("button");
    expect(readWindowsLoginMode({ VITE_WINDOWS_LOGIN: "auto" }, "https://api.example.com")).toBe("auto");
  });

  it("automatic only against an HTTPS API (the browser sends Windows credentials to it)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(readWindowsLoginMode({ VITE_WINDOWS_LOGIN: "auto" }, "http://api.example.com")).toBe("button");
    warn.mockRestore();
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
});
