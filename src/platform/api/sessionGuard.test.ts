import { describe, expect, it } from "vitest";
import { carriesInvalidSession, INVALID_SESSION_CODE, isInvalidSession } from "./sessionGuard";

describe("isInvalidSession", () => {
  it("an error response with ErrorCode ErrInvalidSessionToken", () => {
    expect(isInvalidSession({ status: 401, data: { ErrorCode: INVALID_SESSION_CODE, Message: "Session expired" } })).toBe(true);
    expect(isInvalidSession({ status: 400, data: { errorCode: "ErrInvalidSessionToken" } })).toBe(true);
  });

  it("a body that is JSON text", () =>
    expect(isInvalidSession({ status: 401, data: JSON.stringify({ ErrorCode: "ErrInvalidSessionToken" }) })).toBe(true));

  it("a successful response whose body carries the code (even if it has a data field)", () => {
    expect(carriesInvalidSession({ success: false, errorCode: "ErrInvalidSessionToken" })).toBe(true);
    expect(carriesInvalidSession({ ErrorCode: "ErrInvalidSessionToken", data: { id: 1 } })).toBe(true);
    expect(carriesInvalidSession({ data: { ErrorCode: "ErrInvalidSessionToken" } })).toBe(false);
  });

  it("anything else", () => {
    expect(isInvalidSession({ status: 401, data: { ErrorCode: "ErrWrongPassword" } })).toBe(false);
    expect(isInvalidSession({ status: "FETCH_ERROR", error: "TypeError" })).toBe(false);
    expect(isInvalidSession("<html>")).toBe(false);
    expect(isInvalidSession(undefined)).toBe(false);
  });
});
