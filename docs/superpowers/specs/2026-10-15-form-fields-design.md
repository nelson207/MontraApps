# Form fields: compact soft-filled style + date format — design spec

Date: 2026-10-15 · Status: approved design

## Goal

Every input and select in every Montra app looks the same, is more compact and less monochromatic,
from one place (shared styles). Date fields show their format as placeholder, chosen by the user.

## Decisions

| Topic | Decision |
|---|---|
| Style | Soft filled: 34px high, 15px text, main-colour tint (5% over the body background), transparent border; hover border; focus = body background + main-colour border + ring |
| Scope | Global `.form-control`, `.form-select` (incl. the searchable select trigger), `.form-label`, `.input-group-text` — one correction fits all |
| Labels | Small, medium weight, secondary colour |
| Input groups | Units/icons inside the field in the main colour; one focus ring for the whole group |
| States | Invalid: danger border + faint danger tint. Disabled/read-only: flat secondary background |
| Date field | `DateInput` text field: placeholder = format, separators added while typing, calendar button (native picker), value in/out stays `yyyy-MM-dd`, min/max honoured, incomplete/impossible date = invalid |
| Date format | `ThemeState.dateFormat`: `dd/MM/yyyy` (default) / `MM/dd/yyyy` / `yyyy-MM-dd`, Settings → Appearance, persisted per browser |
| Out of scope | Plain-text date display elsewhere (task/news labels) |

## Testing

Vitest: `formatDate`, `parseDate` (31/02 rejected), `maskDate` per format, `parseDateFormat` fallback.
Browser: light/dark screenshots of quotation/proposal steps, stock new unit, factoring request, login,
settings, user form; typing a date and the format setting. Lint, tests, five builds.
