import type { CountryDto } from "@platform/api/generated/MontraPOSApi";

// Phone numbers in every Montra app: a country (from the API) + its local digits, exchanged as
// E.164 ("+351912345678"). Formatting and the validity check follow the country's data.

export type PhoneCountry = {
  /** ISO 3166-1 alpha-2, e.g. "PT" */
  code: string;
  name: string;
  /** Without "+", e.g. "351" */
  dialCode: string;
  /** How the local digits are grouped when shown, e.g. [3, 3, 3] → "912 345 678" */
  groups: number[];
  minDigits: number;
  maxDigits: number;
  /** Placeholders per number type */
  examples: { mobile: string; landline: string };
};

export type PhoneType = keyof PhoneCountry["examples"];

/** E.164: at most 15 digits, dial code included */
const E164_MAX_DIGITS = 15;

/**
 * GET /api/companies/countries → the phone countries, in the API's order (the backend orders
 * them; the first is the default). Only countries with an alpha-2 code and a phone prefix. The API
 * doesn't say how each country groups or counts its digits: grouped in threes, from 6 digits up to
 * what E.164 allows after the dial code, no placeholder.
 */
export function toPhoneCountries(countries: CountryDto[] | null | undefined): PhoneCountry[] {
  return (countries ?? []).flatMap((c) => {
    const code = c.alpha2Code?.trim().toUpperCase();
    if (!code || typeof c.phonePrefix !== "number" || c.phonePrefix <= 0) return [];
    const dialCode = String(c.phonePrefix);
    return [
      {
        code,
        name: c.abbreviation?.trim() || code,
        dialCode,
        groups: [3, 3, 3],
        minDigits: 6,
        maxDigits: E164_MAX_DIGITS - dialCode.length,
        examples: { mobile: "", landline: "" },
      },
    ];
  });
}

/** The typed text reduced to digits, at most the country's maximum */
export const phoneDigits = (text: string, country: PhoneCountry) =>
  text.replace(/\D/g, "").slice(0, country.maxDigits);

/** "912345678" → "912 345 678" (partial input grouped as far as it goes; extra digits at the end) */
export function formatPhone(digits: string, country: PhoneCountry): string {
  const parts: string[] = [];
  let rest = digits;
  for (const size of country.groups) {
    if (!rest) break;
    parts.push(rest.slice(0, size));
    rest = rest.slice(size);
  }
  if (rest) parts.push(rest);
  return parts.join(" ");
}

/** The country of an international number being typed ("+351…"), once its whole dial code is there */
export function dialCodeCountry(text: string, countries: PhoneCountry[]): PhoneCountry | null {
  if (!text.trim().startsWith("+")) return null;
  const digits = text.replace(/\D/g, "");
  return (
    [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length).find((c) => digits.startsWith(c.dialCode)) ??
    null
  );
}

/**
 * A stored number → its country and local digits. "+<dial code>…" picks the country with the
 * longest matching dial code; anything else (empty, local, unknown code) keeps `fallback`.
 */
export function parsePhone(
  value: string | null | undefined,
  countries: PhoneCountry[],
  fallback: PhoneCountry,
): { country: PhoneCountry; digits: string } {
  const text = (value ?? "").trim();
  if (text.startsWith("+")) {
    const all = text.replace(/\D/g, "");
    const country = [...countries]
      .sort((a, b) => b.dialCode.length - a.dialCode.length)
      .find((c) => all.startsWith(c.dialCode));
    if (country) return { country, digits: phoneDigits(all.slice(country.dialCode.length), country) };
  }
  return { country: fallback, digits: phoneDigits(text, fallback) };
}

/** Local digits → "+351912345678"; "" when there are none */
export const toE164 = (digits: string, country: PhoneCountry) => (digits ? `+${country.dialCode}${digits}` : "");

/** Enough digits for the country (an empty number isn't invalid: "required" is checked elsewhere) */
export const isValidPhone = (digits: string, country: PhoneCountry) =>
  !digits || (digits.length >= country.minDigits && digits.length <= country.maxDigits);
