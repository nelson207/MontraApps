import { describe, expect, it } from "vitest";
import { isInvalidId, problemCode, problemMessage } from "./problemCode";

const problem = (status: number, code?: string) => ({ status, data: { title: "Server title", status, code, traceId: "t" } });

describe("ProblemDetails codes", () => {
  it("reads the code of an RTK Query error", () => {
    expect(problemCode(problem(400, "validation_failed"))).toBe("validation_failed");
    expect(problemCode({ status: "FETCH_ERROR", error: "x" })).toBeUndefined();
  });

  it("messages come from the code (never the server's title), overridable per screen", () => {
    expect(problemMessage(problem(403, "user_management_forbidden"))).toBe("You can't manage this user.");
    expect(problemMessage(problem(400, "validation_failed"), { validation_failed: "Fix the user." })).toBe("Fix the user.");
  });

  it("falls back on the status, then null", () => {
    expect(problemMessage(problem(429))).toBe("Too many attempts, try again later.");
    expect(problemMessage(problem(502))).toMatch(/temporarily unavailable/);
    expect(problemMessage(problem(500))).toBeNull();
  });

  it("invalid_id only on a 400", () => {
    expect(isInvalidId(problem(400, "invalid_id"))).toBe(true);
    expect(isInvalidId(problem(404, "invalid_id"))).toBe(false);
  });
});
