import { lazy } from "react";
import type { AppModule, MenuGroup } from "@platform/app/contract";

// Montra Customer modules rendered inside the shared layout: routes, sidebar menu, top bar title.
// A customer's own app: no tasks, no working context, no user management.

export const NAV_SECTIONS = ["Overview", "Contracts"] as const;

export const APP_MODULES: AppModule[] = [
  {
    path: "/dashboard",
    label: "Home",
    icon: "bi-house-door",
    section: "Overview",
    component: lazy(() => import("./features/dashboard/pages/DashboardPage")),
  },
  {
    path: "/news",
    label: "News",
    icon: "bi-newspaper",
    section: "Overview",
    component: lazy(() => import("@platform/features/news/pages/NewsPage")),
  },
  {
    path: "/news/:id",
    label: "News",
    icon: "bi-newspaper",
    component: lazy(() => import("@platform/features/news/pages/NewsArticlePage")),
  },
  {
    path: "/contracts",
    label: "My contracts",
    icon: "bi-file-earmark-text",
    section: "Contracts",
    component: lazy(() => import("./features/contracts/pages/ContractsPage")),
  },
  {
    path: "/contracts/:contractId",
    label: "Contract",
    icon: "bi-file-earmark-text",
    component: lazy(() => import("./features/contracts/pages/ContractPage")),
  },
  {
    path: "/notifications",
    label: "Notifications",
    icon: "bi-bell",
    component: lazy(() => import("@platform/features/notifications/pages/NotificationsPage")),
  },
  {
    path: "/settings",
    label: "Settings",
    icon: "bi-gear",
    component: lazy(() => import("@platform/features/settings/pages/SettingsPage")),
  },
];

export const DEFAULT_MODULE_PATH = "/dashboard";

export const MENU_GROUPS: MenuGroup[] = NAV_SECTIONS.map((section) => ({
  section,
  modules: APP_MODULES.filter((module) => module.section === section),
}));
