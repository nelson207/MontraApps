import { describe, expect, it } from "vitest";
import { formatDate, maskDate, parseDate, parseDateFormat } from "./dateFormat";

describe("formatDate", () => {
  it("writes an ISO date in each format", () => {
    expect(formatDate("2026-10-05", "dd/MM/yyyy")).toBe("05/10/2026");
    expect(formatDate("2026-10-05", "MM/dd/yyyy")).toBe("10/05/2026");
    expect(formatDate("2026-10-05", "yyyy-MM-dd")).toBe("2026-10-05");
  });

  it("ignores a time part and is empty for no date", () => {
    expect(formatDate("2026-10-05T13:00:00", "dd/MM/yyyy")).toBe("05/10/2026");
    expect(formatDate("", "dd/MM/yyyy")).toBe("");
    expect(formatDate(null, "dd/MM/yyyy")).toBe("");
  });
});

describe("parseDate", () => {
  it("reads a complete date in each format", () => {
    expect(parseDate("05/10/2026", "dd/MM/yyyy")).toBe("2026-10-05");
    expect(parseDate("10/05/2026", "MM/dd/yyyy")).toBe("2026-10-05");
    expect(parseDate("2026-10-05", "yyyy-MM-dd")).toBe("2026-10-05");
  });

  it("rejects incomplete and impossible dates", () => {
    expect(parseDate("05/10/20", "dd/MM/yyyy")).toBeNull();
    expect(parseDate("31/02/2026", "dd/MM/yyyy")).toBeNull();
    expect(parseDate("29/02/2025", "dd/MM/yyyy")).toBeNull();
    expect(parseDate("29/02/2024", "dd/MM/yyyy")).toBe("2024-02-29");
    expect(parseDate("13/13/2026", "MM/dd/yyyy")).toBeNull();
  });
});

describe("maskDate", () => {
  it("adds the separators while typing digits", () => {
    expect(maskDate("05", "dd/MM/yyyy")).toBe("05");
    expect(maskDate("051", "dd/MM/yyyy")).toBe("05/1");
    expect(maskDate("05102026", "dd/MM/yyyy")).toBe("05/10/2026");
    expect(maskDate("20261005", "yyyy-MM-dd")).toBe("2026-10-05");
  });

  it("keeps typed separators and drops anything else", () => {
    expect(maskDate("05/10/2026", "dd/MM/yyyy")).toBe("05/10/2026");
    expect(maskDate("05a/1b0", "dd/MM/yyyy")).toBe("05/10");
    expect(maskDate("051020261234", "dd/MM/yyyy")).toBe("05/10/2026");
  });
});

describe("parseDateFormat", () => {
  it("falls back to dd/MM/yyyy for missing or unknown values", () => {
    expect(parseDateFormat("MM/dd/yyyy")).toBe("MM/dd/yyyy");
    expect(parseDateFormat(undefined)).toBe("dd/MM/yyyy");
    expect(parseDateFormat("d.M.yy")).toBe("dd/MM/yyyy");
  });
});
