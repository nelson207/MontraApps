# Dark mode — design spec

Date: 2026-10-14 · Status: approved design

## Goal

A dark appearance for every Montra app (Credit, Lawyer, Stock, Factoring, Customer) covering
every existing feature, chosen per browser as Light, Dark or System.

## Decisions

| Topic | Decision |
|---|---|
| Modes | `light` / `dark` / `system`; default **system** (follows the OS, live) |
| Storage | `ThemeState.mode`, persisted with the other theme preferences |
| Mechanism | `data-bs-theme` on `<html>` (Bootstrap 5.3 color modes), set before first paint |
| Main colour | Same in both modes (sidebar, buttons, chips) |
| Main colour as text | Light: `readableOnWhite` (darken to AA on white). Dark: `readableOnDark` (lighten to AA on the dark body background) |
| Subtle tints | Mixed with the mode's body background, not `#fff` |
| Content text colour setting | Light mode only; dark uses Bootstrap's dark body colour. Settings explains it |
| Switch | Settings → Appearance (segmented control) + user menu (3 compact buttons) |
| Charts | Dark palette for `--viz-*` in insights.scss, contrast-checked |
| QR code | Keeps a white background (scannability) |

## Scope

Shared: layout, login, results views (tasks, news, users, operations search), task/news modals,
news strip and article, notifications, settings, user form, work context, app switcher, insights.
Apps: each app stylesheet and light-only classes (`text-bg-light`, `text-dark`, `bg-white`) made
mode-aware.

## Testing

Vitest: mode resolution (`resolveMode`), `readableOnDark`, preference loading of `mode`.
Browser: light/dark screenshots of the main screens of Credit and each other app's home.
`npm run lint` (no new errors), `npm test`, all five builds.
