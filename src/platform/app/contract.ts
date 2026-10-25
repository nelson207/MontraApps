import type { ComponentType, LazyExoticComponent } from "react";

// What every Montra app provides under src/apps/<app>, read by the platform through @app/*
// (the alias points at the app being run or built, see montra.aliases.ts):
//
//   brand.ts               BRAND (MontraBrand), APP_NAME
//   modules.ts             APP_MODULES, DEFAULT_MODULE_PATH, MENU_GROUPS
//   shell.tsx              TopbarExtras, LayoutBanner (slots in the shared layout; e.g. the working context)
//   store.ts               store, from createMontraStore (platform/app/store.ts)
//   styles/montra-app.scss the app's styles (Bootstrap variables available)
//   i18n.ts                APP_MESSAGES: the app's texts in other languages (module labels, brand texts; platform/i18n)
//   appSettings.ts         APP_SETTINGS: the screen customization identifier + sections of Settings → Application
//                          (platform/features/appSettings; an app with nothing to configure lists no sections)
//
// Only for the shared features the app uses (Montra Customer uses none of them):
//   users.tsx              USERS_ACCESS: the app part of user management (platform/features/users)
//   workContext.ts         WORK_CONTEXT: level labels, endpoints, sample names (platform/features/workContext)
//   insights.ts            INSIGHTS: the dashboards tab: endpoint + sample (platform/features/insights)
//
// The platform never imports anything else from an app.

export type AppModule = {
  path: string;
  label: string;
  /** Bootstrap Icons class, e.g. "bi-house-door" */
  icon: string;
  /** Sidebar group. Modules without a section are routable but not listed in the menu. */
  section?: string;
  /** Listed in the menu only for users who have this access (still routable) */
  access?: "manageUsers";
  component: LazyExoticComponent<ComponentType>;
};

export type MenuGroup = { section: string; modules: AppModule[] };

export type MontraBrand = {
  /** App id: the app switcher (AplApplications claim, e.g. "StockCredit" → "stockcredit") and stored preferences */
  id: string;
  /** Shared by every Montra app */
  family: "Montra";
  /** This app, e.g. "Credit" */
  product: string;
  /** Single-letter mark: favicon and collapsed sidebar (same across the family) */
  mark: string;
  tagline: string;
  /** Value points on the login page */
  highlights: readonly { icon: string; title: string; text: string }[];
};
