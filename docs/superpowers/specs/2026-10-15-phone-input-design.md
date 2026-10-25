# Own phone input + customer folder — design spec

Date: 2026-10-15 · Status: approved design

## Goal

Replace `intl-tel-input` with a small `PhoneInput` that matches the app's fields, keeping: country
picker with dial code, formatting while typing, example placeholder, E.164 value, validity.
Reorganize the Credit customer files like `insurance/`.

## Decisions

| Topic | Decision |
|---|---|
| Countries | `GET /api/Countries/Phone` (placeholder endpoint, injected) → `PhoneCountry[]`; dev sample: Portugal only |
| PhoneCountry | `{ code, name, dialCode, groups: number[], minDigits, maxDigits, examples: { mobile, landline } }` |
| Look | "PT +351" in the main colour inside the field (input-group addon/button); searchable country list |
| Value | E.164 (`+351912345678`) in and out; "" when empty |
| Typing | digits only, grouped per `groups`; a pasted `+<dial>…` selects that country |
| Validity | digit count within min/max; reported via `onValidityChange` |
| Removed | `intl-tel-input` dependency, its CSS, `platform/styles/phoneinput.scss` |
| Customer files | `credoper/customer/components/{CustomerStep,CustomerDetail}.tsx`, `customer/customerRules.ts` (+ test) |

## Testing

Vitest: `phoneModel` (format, digits, parse E.164, toE164, validity), sample fallback via API shape.
Browser: wizard Customer step + Settings → Account, light/dark. Lint, tests, five builds.
