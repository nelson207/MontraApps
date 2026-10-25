# Form Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Compact soft-filled fields everywhere + `DateInput` with a user date format.

**Architecture:** Global SCSS on Bootstrap field classes (`platform/styles/forms.scss`, Sass variables in
`montra.scss`); pure date helpers in `platform/utils/dateFormat.ts`; `DateInput` in `platform/components/ui`;
`dateFormat` in the theme slice (persisted with it).

**Spec:** `docs/superpowers/specs/2026-10-15-form-fields-design.md`

## Global Constraints

- Field height 34px, font 0.9375rem; tint `color-mix(in srgb, var(--app-primary) 5%, var(--bs-body-bg))`.
- Date values exchanged with forms stay `yyyy-MM-dd` ("" when empty).
- Formats: `dd/MM/yyyy` (default), `MM/dd/yyyy`, `yyyy-MM-dd`.

## Review Focus

- Typing a complete but impossible date (31/02/2026) → field invalid, form value "" (`parseDate` test).
- Date outside min/max → invalid styling (manual).
- Clearing a date → form value "" (manual).
- Input groups with buttons (password eye, action buttons) keep working and look joined (screenshot).
- Dark mode tint readable (screenshot).

---

### Task 1: Date helpers — `dateFormat.ts` + tests
`DATE_FORMATS`, `type DateFormat`, `parseDateFormat(value)`, `formatDate(iso, fmt)`, `parseDate(text, fmt) → iso | null`, `maskDate(typed, fmt)`.

### Task 2: Date format preference — theme slice `dateFormat`, `setDateFormat`; Settings → Appearance select.

### Task 3: `DateInput` + `InputField` date support; replace the 8 native date inputs.

### Task 4: Field styles — Sass variables + forms.scss rules.

### Task 5: Verify — screenshots light/dark, lint, tests, builds.
