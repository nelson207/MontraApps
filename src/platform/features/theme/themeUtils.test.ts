import { describe, expect, it } from "vitest";
import { contrastRatio, DARK_BODY_BG, parseMode, readableOnDark, resolveMode } from "./themeUtils";

describe("resolveMode", () => {
  it("follows the system in system mode", () => {
    expect(resolveMode("system", true)).toBe("dark");
    expect(resolveMode("system", false)).toBe("light");
  });

  it("keeps an explicit choice whatever the system says", () => {
    expect(resolveMode("light", true)).toBe("light");
    expect(resolveMode("dark", false)).toBe("dark");
  });
});

describe("parseMode", () => {
  it("accepts the three modes", () => {
    expect(parseMode("dark")).toBe("dark");
    expect(parseMode("light")).toBe("light");
  });

  it("falls back to system for missing or unknown values (older saved preferences)", () => {
    expect(parseMode(undefined)).toBe("system");
    expect(parseMode("sepia")).toBe("system");
  });
});

describe("readableOnDark", () => {
  it("lightens a dark main colour until it reads on the dark background", () => {
    const shade = readableOnDark("#1f2937");
    expect(contrastRatio(shade, DARK_BODY_BG)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps a light main colour as it is", () => {
    expect(readableOnDark("#f5b301")).toBe("#f5b301");
  });

  it("lightens the Montra blue", () => {
    expect(readableOnDark("#0c6fb7")).not.toBe("#0c6fb7");
    expect(contrastRatio(readableOnDark("#0c6fb7"), DARK_BODY_BG)).toBeGreaterThanOrEqual(4.5);
  });
});
