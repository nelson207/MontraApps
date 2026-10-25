# MONTRA POS

MONTRA POS is an early-stage Point of Sale project created to test and explore different React and TypeScript features.

The project is currently focused on experimentation, prototyping, and validating frontend approaches rather than providing a production-ready POS solution.

## Project Status

> **Early development**

MONTRA POS is still in a very early stage. Features, structure, dependencies, and implementation details may change frequently.

## Goals

- Experiment with React and TypeScript
- Test reusable component patterns
- Explore application state management
- Validate form and wizard-based workflows
- Test API integration
- Improve responsive user-interface design
- Evaluate project architecture and development practices

## Technology Stack

- React
- TypeScript
- Vite
- React Router
- Bootstrap / SCSS
- REST APIs

## Getting Started

### Requirements

- Node.js
- npm

### Installation

Clone the repository:

```bash
git clone <repository-url>
cd montra-pos
```

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The terminal will display the local URL where the application is available.

## Available Scripts

```bash
npm run dev
```

Starts the application in development mode.

```bash
npm run build
```

Creates a production build.

```bash
npm run preview
```

Runs the production build locally for testing.

## Current Focus

The current development focus includes:

- Navigation and routing
- Reusable UI components
- Multi-step forms
- Data validation
- API communication
- Authentication experiments
- Application state management
- Responsive layouts

## Disclaimer

MONTRA POS is an experimental project and is not currently intended for use in production or in real commercial environments.
.NET10 Backend API to be release in the future.

## License

No license has been defined yet.

## Montra apps (Credit, Lawyer, …)

Montra is a family of apps that share one platform. This repository runs and builds **one app at a time**:

```bash
npm run dev            # Montra Credit  (port 5173)
npm run dev:lawyer     # Montra Lawyer  (port 5174)
npm run build          # → dist/credit
npm run build:lawyer   # → dist/lawyer
```

`tsc -b` type-checks the shared platform against both apps (`tsconfig.app.json` = Credit, `tsconfig.lawyer.json` = Lawyer).

### Structure

```
src/
  platform/        shared by every app — never imports from src/apps (enforced by ESLint)
    app/           shell: routes, store base (createMontraStore), preferences, contract.ts
    api/           backend client (generated MontraPOSApi, emptyApi, devFallback)
    components/    ui/ and brand/
    features/      auth, account, settings, theme, layout, news, notifications, appSwitcher, users,
                   workContext (3-level hierarchy, top-bar menu), tasks (assigned tasks on the dashboard)
    hooks/ utils/ styles/ assets/
  apps/
    credit/        Montra Credit: brand, modules, shell, store, users, styles, features/
    lawyer/        Montra Lawyer: dashboard, news and user management (role) for now
```

Imports: `@platform/*` (shared), `@credit/*` / `@lawyer/*` (each app), and `@app/*`, the app being run, which is how the
platform reads it (see `montra.aliases.ts`).

### Adding an app (e.g. Montra Factoring)

Copy `src/apps/lawyer/` (the smallest app) and adapt what `src/platform/app/contract.ts` lists:

| File | Provides |
|---|---|
| `brand.ts` | `BRAND` (product "Lawyer", tagline, login highlights) and `APP_NAME` |
| `modules.ts` | `APP_MODULES` (its pages + the platform ones it offers), `DEFAULT_MODULE_PATH`, `MENU_GROUPS` |
| `shell.tsx` | `TopbarExtras`, `LayoutBanner` (layout slots; `() => null` if unused) |
| `store.ts` | `store = createMontraStore({ …its slices })`, typed hooks and selectors |
| `users.tsx` | `USERS_ACCESS`: the access part of user management (Credit: level + network; Lawyer: role) |
| `workContext.ts` | `WORK_CONTEXT`: level labels (Credit: Credit intermediary → Supplier → Vendor; Lawyer: Lawyers office → Lawyer department → Lawyer), endpoints, sample names |
| `tasks.ts` | `TASKS`: task categories and dev sample titles |
| `styles/montra-app.scss` | its styles |
| `features/` | its features (legal actions, …) |

Then register it in `montra.aliases.ts` (`MONTRA_APPS`, alias) and `vite.config.ts` (`APP_NAMES`), add its path to
`tsconfig.app.json` plus a `tsconfig.<app>.json` like Lawyer's, a lint rule in `eslint.config.js`, `dev:`/`build:`
scripts, and its `url` in `src/platform/features/appSwitcher/montraApps.ts` once it's deployed.

### App switcher

The grid icon at the top-left lists the Montra apps the user can open: the JWT claim `AplApplications`
(e.g. `["Credit", "Lawyer"]`) intersected with the apps that have a `url` in `montraApps.ts`. Without the
claim only the current app is shown.
