import { fileURLToPath, URL } from "node:url";

// Path aliases shared by vite.config.ts and vitest.config.ts (mirrored in tsconfig.*.json).
//   @platform/*  shared by every Montra app (src/platform)
//   @credit/*    Montra Credit (src/apps/credit)
//   @lawyer/*    Montra Lawyer (src/apps/lawyer)
//   @stock/*     Montra Stock Credit (src/apps/stock)
//   @factoring/* Montra Factoring (src/apps/factoring)
//   @customer/*  Montra Customer (src/apps/customer)
//   @app/*       the app being run: the contract the platform reads (platform/app/contract.ts)

export const MONTRA_APPS = ["credit", "lawyer", "stock", "factoring", "customer"] as const;
export type MontraAppId = (typeof MONTRA_APPS)[number];

/**
 * Which app to run / build: `vite --mode lawyer` (npm run dev:lawyer), `vite --mode stock`
 * (npm run dev:stock), `vite --mode factoring` (npm run dev:factoring),
 * `vite --mode customer` (npm run dev:customer), or MONTRA_APP=<app>.
 * Anything else (development, production, test) is Montra Credit.
 */
export function montraAppFor(mode?: string): MontraAppId {
  const wanted = process.env.MONTRA_APP ?? mode;
  return (MONTRA_APPS as readonly string[]).includes(wanted ?? "") ? (wanted as MontraAppId) : "credit";
}

const dir = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export const montraAliases = (app: MontraAppId) => ({
  "@platform": dir("./src/platform"),
  "@credit": dir("./src/apps/credit"),
  "@lawyer": dir("./src/apps/lawyer"),
  "@stock": dir("./src/apps/stock"),
  "@factoring": dir("./src/apps/factoring"),
  "@customer": dir("./src/apps/customer"),
  "@app": dir(`./src/apps/${app}`),
});

/** The app's SCSS folder: platform/styles/montra.scss imports its "montra-app" stylesheet from here */
export const montraAppStyles = (app: MontraAppId) => dir(`./src/apps/${app}/styles`);
