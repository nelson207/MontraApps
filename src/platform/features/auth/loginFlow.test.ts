import { describe, expect, it } from "vitest";
import {
  CHALLENGE_LIFETIME_MS,
  INITIAL_LOGIN_FLOW,
  loginFlow,
  passwordChangeRequest,
  problemOf,
  type LoginFlowState,
} from "./loginFlow";

const now = 1_000_000;
const typedPassword = "Old#Pass1";

const loginAnswered = (response: object, at = now): LoginFlowState =>
  loginFlow(INITIAL_LOGIN_FLOW, { type: "loginAnswered", response, password: typedPassword, now: at });

const problem = (status: number, code: string, traceId = "00-abc-01") => ({
  status,
  data: { title: "Problem", status, code, traceId },
});

describe("login response precedence", () => {
  it("a password change comes first, even when 2FA is also required", () => {
    const state = loginAnswered({ requiresPasswordChange: true, requiresTwoFactor: true, challengeToken: "pc-1" });
    expect(state).toMatchObject({ step: "passwordChange", challengeToken: "pc-1", rememberedPassword: typedPassword });
    expect(state.challengeExpiresAt).toBe(now + CHALLENGE_LIFETIME_MS);
  });

  it("2FA when only 2FA is required (the typed password isn't kept)", () => {
    expect(loginAnswered({ requiresTwoFactor: true, challengeToken: "2fa-1" })).toMatchObject({
      step: "twoFactor",
      challengeToken: "2fa-1",
      rememberedPassword: null,
    });
  });

  it("signed in with an access token", () => {
    expect(loginAnswered({ accessToken: "jwt" })).toMatchObject({ step: "loggedIn", rememberedPassword: null, challengeToken: null });
  });
});

describe("required password change", () => {
  it("login → requiresPasswordChange → change → signed in", () => {
    const changing = loginAnswered({ requiresPasswordChange: true, challengeToken: "pc-1" });
    expect(passwordChangeRequest(changing, "New#Pass2", now + 1000)).toEqual({
      challengeToken: "pc-1",
      oldPassword: typedPassword,
      newPassword: "New#Pass2",
    });
    const done = loginFlow(changing, { type: "passwordChangeAnswered", response: { accessToken: "jwt" }, now: now + 2000 });
    expect(done).toMatchObject({ step: "loggedIn", rememberedPassword: null, challengeToken: null });
  });

  it("login → change → 2FA (with the new challenge) → signed in", () => {
    const changing = loginAnswered({ requiresPasswordChange: true, challengeToken: "pc-1" });
    const twoFactor = loginFlow(changing, {
      type: "passwordChangeAnswered",
      response: { requiresTwoFactor: true, challengeToken: "2fa-2" },
      now: now + 2000,
    });
    expect(twoFactor).toMatchObject({ step: "twoFactor", challengeToken: "2fa-2", rememberedPassword: null });
    expect(loginFlow(twoFactor, { type: "twoFactorAnswered", response: { accessToken: "jwt" }, now: now + 3000 }).step).toBe(
      "loggedIn",
    );
  });

  it("a password-change challenge is never handed to the 2FA step", () => {
    const changing = loginAnswered({ requiresPasswordChange: true, challengeToken: "pc-1" });
    expect(loginFlow(changing, { type: "twoFactorAnswered", response: { accessToken: "jwt" }, now }).step).toBe(
      "passwordChange",
    );
  });

  it("an expired challenge (401 session_expired) → back to login with a message", () => {
    const changing = loginAnswered({ requiresPasswordChange: true, challengeToken: "pc-1" });
    const back = loginFlow(changing, { type: "passwordChangeFailed", error: problem(401, "session_expired") });
    expect(back).toMatchObject({ step: "credentials", challengeToken: null, rememberedPassword: null });
    expect(back.notice).toMatch(/expired/i);
  });

  it("a challenge past its lifetime isn't sent: back to login", () => {
    const changing = loginAnswered({ requiresPasswordChange: true, challengeToken: "pc-1" });
    expect(passwordChangeRequest(changing, "New#Pass2", now + CHALLENGE_LIFETIME_MS + 1)).toBeNull();
    const back = loginFlow(changing, { type: "challengeExpired" });
    expect(back).toMatchObject({ step: "credentials", rememberedPassword: null });
    expect(back.notice).toMatch(/expired/i);
  });

  it("a rejected new password (400 validation_failed) stays on the step, same challenge", () => {
    const changing = loginAnswered({ requiresPasswordChange: true, challengeToken: "pc-1" });
    const rejected = loginFlow(changing, { type: "passwordChangeFailed", error: problem(400, "validation_failed", "trace-9") });
    expect(rejected).toMatchObject({ step: "passwordChange", challengeToken: "pc-1", rememberedPassword: typedPassword });
    expect(rejected.error?.message).toMatch(/password/i);
    expect(rejected.error?.traceId).toBe("trace-9");
  });

  it("too many attempts / server errors stay on the step with their own message", () => {
    const changing = loginAnswered({ requiresPasswordChange: true, challengeToken: "pc-1" });
    expect(loginFlow(changing, { type: "passwordChangeFailed", error: problem(429, "rate_limited") }).error?.message).toMatch(
      /too many attempts/i,
    );
    const failed = loginFlow(changing, { type: "passwordChangeFailed", error: problem(502, "backend_unavailable") });
    expect(failed.step).toBe("passwordChange");
    expect(failed.error?.message).not.toMatch(/backend_unavailable|Problem/);
  });

  it("cancel discards the challenge and the remembered password", () => {
    const changing = loginAnswered({ requiresPasswordChange: true, challengeToken: "pc-1" });
    const cancelled = loginFlow(changing, { type: "cancel" });
    expect(cancelled).toEqual(INITIAL_LOGIN_FLOW);
    expect(JSON.stringify(cancelled)).not.toContain(typedPassword);
  });
});

describe("problemOf", () => {
  it("reads ProblemDetails from an RTK Query error", () => {
    expect(problemOf(problem(400, "validation_failed", "t-1"))).toEqual({ status: 400, code: "validation_failed", traceId: "t-1" });
  });

  it("copes with errors that aren't ProblemDetails", () => {
    expect(problemOf({ status: "FETCH_ERROR", error: "x" })).toEqual({ status: null, code: null, traceId: null });
    expect(problemOf(undefined)).toEqual({ status: null, code: null, traceId: null });
  });
});
