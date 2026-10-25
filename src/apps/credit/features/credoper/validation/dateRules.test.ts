import { describe, expect, it } from "vitest";
import { ageOn, toLocalDate } from "./localDate";
import { isAdult, notAfterToday, notBeforeToday } from "./dateRules";

const today = "2026-10-05";

describe("local dates", () => {
  it("toLocalDate drops a time part", () => expect(toLocalDate("2026-10-05T00:00:00")).toBe("2026-10-05"));
  it("toLocalDate rejects garbage", () => expect(toLocalDate("05/10/2026")).toBeNull());
  it("Feb 29 birthday counts from Mar 1 on non-leap years", () => {
    expect(ageOn("2008-02-29", "2026-02-28")).toBe(17);
    expect(ageOn("2008-02-29", "2026-03-01")).toBe(18);
  });
});

describe("date rules vs today", () => {
  it("registration today is fine, tomorrow is not", () => {
    expect(notAfterToday("2026-10-05", today, "Registration date")).toBeNull();
    expect(notAfterToday("2026-10-06", today, "Registration date")).toBe("Registration date can't be in the future.");
  });
  it("document valid today is fine, yesterday expired", () => {
    expect(notBeforeToday("2026-10-05", today, "Document")).toBeNull();
    expect(notBeforeToday("2026-10-04", today, "Document")).toBe("Document has expired.");
  });
  it("turns 18 today → adult", () => expect(isAdult("2008-10-05", today)).toBeNull());
  it("turns 18 tomorrow → not adult", () => expect(isAdult("2008-10-06", today)).toBe("Must be at least 18 years old."));
  it("future birth date", () => expect(isAdult("2026-10-06", today)).toBe("Birth date can't be in the future."));
  it("empty values are not this module's concern", () => expect(notAfterToday(null, today, "X")).toBeNull());
});
