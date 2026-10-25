import { lazy } from "react";
import type { AppModule, MenuGroup } from "@platform/app/contract";

// Montra Credit modules rendered inside the shared layout: the routes (platform/app/App.tsx),
// the sidebar menu and the top bar title. Platform pages (news, notifications, settings)
// are listed here too, so each app chooses which ones it offers.
// To add a module: create its page under features/<module>/pages and add an entry here.

export const NAV_SECTIONS = ["Overview", "Credit operations", "Administration"] as const;
export type NavSection = (typeof NAV_SECTIONS)[number];

// Shared lazy components so routes that render the same page don't remount it.
const UserEditPage = lazy(() => import("@platform/features/users/pages/UserEditPage"));

export const APP_MODULES: AppModule[] = [
  {
    path: "/dashboard",
    label: "Home",
    icon: "bi-house-door",
    section: "Overview",
    component: lazy(() => import("@credit/features/dashboard/pages/DashboardPage")),
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
    path: "/tasks",
    label: "Tasks",
    icon: "bi-list-check",
    section: "Overview",
    component: lazy(() => import("@platform/features/tasks/pages/TasksPage")),
  },
  {
    path: "/search",
    label: "Search operations",
    icon: "bi-search",
    section: "Credit operations",
    component: lazy(() => import("@credit/features/search/pages/SearchOperationsPage")),
  },
  {
    path: "/quotation",
    label: "Quotation",
    icon: "bi-calculator",
    section: "Credit operations",
    component: lazy(() => import("@credit/features/credoper/pages/QuotationRoute")),
  },
  {
    path: "/proposal",
    label: "Proposal",
    icon: "bi-file-earmark-text",
    section: "Credit operations",
    component: lazy(() => import("@credit/features/credoper/pages/ProposalRoute")),
  },
  {
    path: "/admin/users",
    label: "Users",
    icon: "bi-people",
    section: "Administration",
    access: "manageUsers",
    component: lazy(() => import("@platform/features/users/pages/UsersPage")),
  },
  {
    path: "/admin/users/new",
    label: "New user",
    icon: "bi-person-plus",
    component: UserEditPage,
  },
  {
    path: "/admin/users/:userId",
    label: "Edit user",
    icon: "bi-person-gear",
    component: UserEditPage,
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
