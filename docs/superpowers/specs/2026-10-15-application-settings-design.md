# Application settings (screen customizations) — design spec

Date: 2026-10-15 · Status: approved design

## Goal

Administrators configure each Montra app from Settings → Application. Values are read and saved
through the API as raw JSON under one identifier per app ("screen customizations"; database fixed).

## Decisions

| Topic | Decision |
|---|---|
| Who | Role claim (`http://schemas.microsoft.com/ws/2008/06/identity/claims/role` or `role`) contains "Administrator" (case-insensitive, value or list); demo token gets it |
| Endpoints | `GET /api/ScreenCustomizations/{identifier}` → raw JSON; `PUT` same path, body = JSON (placeholders; dev fallback keeps it in localStorage) |
| Identifiers | `MONTRA_APPLICATION_CREDIT`, `_LAWYER`, `_STOCK`, `_FACTORING`, `_CUSTOMER` |
| JSON | `{ availableBusinesses?: number[], proposalBusinesses?: number[], newsTypes?: string[] }`; unknown keys kept; bad JSON → {} |
| Per app | `apps/<app>/appSettings.ts`: identifier + options. Credit: availableBusinesses, proposalBusinesses, newsTypes. Lawyer/Stock/Factoring: newsTypes. Customer: none (tab says so) |
| Applied in the frontend | Only `proposalBusinesses`: a new proposal's Business step offers only those (empty = all). Available businesses and news types are applied by the backend |
| Screen | One card per option, checkbox list + All / None, Save / Discard; "Can start in proposal" lists only available businesses |

## Testing

Vitest: role claim, JSON parse/serialize, proposal business filter. Browser: admin vs not, save,
reload, Business step of a new proposal. Lint, tests, five builds.
