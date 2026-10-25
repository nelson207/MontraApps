import { describe, expect, it } from "vitest";
import { languageFromCulture, parseLanguage, resolveLanguage } from "./languages";

describe("languageFromCulture (the user's uiCulture)", () => {
  it("any Portuguese culture → pt-PT, any English one → en", () => {
    expect(languageFromCulture("pt-PT")).toBe("pt-PT");
    expect(languageFromCulture("pt-BR")).toBe("pt-PT");
    expect(languageFromCulture("PT")).toBe("pt-PT");
    expect(languageFromCulture("en-GB")).toBe("en");
  });

  it("other or no culture: none", () => {
    expect(languageFromCulture("fr-FR")).toBeNull();
    expect(languageFromCulture("")).toBeNull();
    expect(languageFromCulture(null)).toBeNull();
  });
});

describe("resolveLanguage", () => {
  it("the user's choice first", () => expect(resolveLanguage({ choice: "en", uiCulture: "pt-PT" })).toBe("en"));
  it("then their uiCulture", () => expect(resolveLanguage({ choice: null, uiCulture: "pt-PT" })).toBe("pt-PT"));
  it("then English", () => {
    expect(resolveLanguage({ choice: null, uiCulture: "fr-FR" })).toBe("en");
    expect(resolveLanguage({ choice: null })).toBe("en");
  });
});

describe("parseLanguage (a stored choice)", () => {
  it("only the apps' languages", () => {
    expect(parseLanguage("pt-PT")).toBe("pt-PT");
    expect(parseLanguage("pt")).toBeNull();
    expect(parseLanguage(undefined)).toBeNull();
  });
});
