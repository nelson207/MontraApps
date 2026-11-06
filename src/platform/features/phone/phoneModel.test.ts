import { describe, expect, it } from "vitest";
import { dialCodeCountry, formatPhone, isValidPhone, parsePhone, phoneDigits, toPhoneCountries, type PhoneCountry } from "./phoneModel";

const PT: PhoneCountry = {
  id: "PRT",
  code: "PT",
  name: "Portugal",
  dialCode: "351",
  groups: [3, 3, 3],
  minDigits: 9,
  maxDigits: 9,
  examples: { mobile: "912 345 678", landline: "212 345 678" },
};
const ES: PhoneCountry = { ...PT, id: "ESP", code: "ES", name: "Spain", dialCode: "34" };
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
  it("the country of its countryId, with the number as it is", () => {
    expect(parsePhone({ phoneNumber: "612345678", countryId: "ESP" }, COUNTRIES, PT)).toEqual({ country: ES, digits: "612345678" });
  });

  it("a number with its dial code is split into its country and local digits", () => {
    expect(parsePhone({ phoneNumber: "+351912345678" }, COUNTRIES, ES)).toEqual({ country: PT, digits: "912345678" });
    expect(parsePhone({ phoneNumber: "+34612345678", countryId: "PRT" }, COUNTRIES, PT)).toEqual({ country: ES, digits: "612345678" });
  });

  it("keeps the default country without a countryId", () => {
    expect(parsePhone({ phoneNumber: "" }, COUNTRIES, PT)).toEqual({ country: PT, digits: "" });
    expect(parsePhone(null, COUNTRIES, PT)).toEqual({ country: PT, digits: "" });
    expect(parsePhone({ phoneNumber: "912345678" }, COUNTRIES, PT)).toEqual({ country: PT, digits: "912345678" });
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

describe("toPhoneCountries (GET /api/companies/countries)", () => {
  it("alpha-2 code, name and phone prefix, in the API's order (the first is the default)", () =>
    expect(
      toPhoneCountries([
        { id: "ESP", abbreviation: "Espanha", alpha2Code: "es", phonePrefix: 34 },
        { id: "PRT", abbreviation: "Portugal", alpha2Code: "PT", phonePrefix: 351 },
      ]).map((c) => [c.code, c.name, c.dialCode, c.maxDigits]),
    ).toEqual([
      ["ES", "Espanha", "34", 13],
      ["PT", "Portugal", "351", 12],
    ]));

  it("leaves out countries without a code or a prefix; a missing name is the code", () => {
    const countries = toPhoneCountries([
      { id: "PRT", alpha2Code: "PT", phonePrefix: null },
      { id: "ESP", alpha2Code: null, phonePrefix: 34 },
      { alpha2Code: "ITA", phonePrefix: 39 },
      { id: "FRA", alpha2Code: "FR", phonePrefix: 33, abbreviation: " " },
    ]);
    expect(countries.map((c) => [c.code, c.name])).toEqual([["FR", "FR"]]);
    expect(toPhoneCountries(undefined)).toEqual([]);
  });

  it("works with the rest of the phone rules: +33 picks France, shown as the API's prefix", () => {
    const countries = toPhoneCountries([{ id: "PRT", alpha2Code: "PT", phonePrefix: 351 }, { id: "FRA", alpha2Code: "FR", phonePrefix: 33 }]);
    expect(parsePhone({ phoneNumber: "+33612345678" }, countries, countries[0])).toMatchObject({ country: { id: "FRA" }, digits: "612345678" });
  });
});
