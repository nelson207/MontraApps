import type { PhoneCountry } from "../phoneModel";

// Development-only stand-in for GET /api/Countries/Phone (the real list comes from the API).
export const SAMPLE_PHONE_COUNTRIES: PhoneCountry[] = [
  {
    code: "PT",
    name: "Portugal",
    dialCode: "351",
    groups: [3, 3, 3],
    minDigits: 9,
    maxDigits: 9,
    examples: { mobile: "912 345 678", landline: "212 345 678" },
  },
  {
    code: "EN",
    name: "England",
    dialCode: "44",
    groups: [3, 3, 3],
    minDigits: 9,
    maxDigits: 9,
    examples: { mobile: "912 345 678", landline: "212 345 678" },
  },
];
