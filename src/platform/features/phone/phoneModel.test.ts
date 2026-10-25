import { describe, expect, it } from "vitest";
import { dialCodeCountry, formatPhone, isValidPhone, parsePhone, phoneDigits, toE164, type PhoneCountry } from "./phoneModel";

const PT: PhoneCountry = {
  code: "PT",
  name: "Portugal",
  dialCode: "351",
  groups: [3, 3, 3],
  minDigits: 9,
  maxDigits: 9,
  examples: { mobile: "912 345 678", landline: "212 345 678" },
};
const ES: PhoneCountry = { ...PT, code: "ES", name: "Spain", dialCode: "34" };
const COUNTRIES = [PT, ES];

describe("phoneDigits", () => {
  it("keeps digits only, up to the country's maximum", () => {
    expect(phoneDigits("912 34-5a678", PT)).toBe("912345678");
    expect(phoneDigits("9123456789999", PT)).toBe("912345678");
  });
});

describe("formatPhone", () => {
  it("groups the digits as the country does, while typing too", () => {
    expect(formatPhone("912345678", PT)).toBe("912 345 678");
    expect(formatPhone("9123", PT)).toBe("912 3");
    expect(formatPhone("", PT)).toBe("");
  });
});

describe("parsePhone", () => {
  it("splits an international number into its country and local digits", () => {
    expect(parsePhone("+351912345678", COUNTRIES, PT)).toEqual({ country: PT, digits: "912345678" });
    expect(parsePhone("+34612345678", COUNTRIES, PT)).toEqual({ country: ES, digits: "612345678" });
  });

  it("keeps the default country for empty or local numbers", () => {
    expect(parsePhone("", COUNTRIES, PT)).toEqual({ country: PT, digits: "" });
    expect(parsePhone(null, COUNTRIES, PT)).toEqual({ country: PT, digits: "" });
    expect(parsePhone("912345678", COUNTRIES, PT)).toEqual({ country: PT, digits: "912345678" });
  });
});

describe("toE164", () => {
  it("adds the dial code; empty stays empty", () => {
    expect(toE164("912345678", PT)).toBe("+351912345678");
    expect(toE164("", PT)).toBe("");
  });
});

describe("isValidPhone", () => {
  it("checks the number of digits for the country; empty is not invalid", () => {
    expect(isValidPhone("912345678", PT)).toBe(true);
    expect(isValidPhone("91234", PT)).toBe(false);
    expect(isValidPhone("", PT)).toBe(true);
  });
});

describe("dialCodeCountry", () => {
  it("finds the country once its whole dial code is typed", () => {
    expect(dialCodeCountry("+3", COUNTRIES)).toBeNull();
    expect(dialCodeCountry("+35", COUNTRIES)).toBeNull();
    expect(dialCodeCountry("+351", COUNTRIES)).toBe(PT);
    expect(dialCodeCountry("+34 6", COUNTRIES)).toBe(ES);
    expect(dialCodeCountry("912", COUNTRIES)).toBeNull();
  });
});
