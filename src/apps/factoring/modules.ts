import { lazy } from "react";
import type { AppModule, MenuGroup } from "@platform/app/contract";

// Montra Factoring modules rendered inside the shared layout: routes, sidebar menu, top bar title.
// To add a module: create its page under features/<module>/pages and add an entry here.

export const NAV_SECTIONS = ["Overview", "Factoring", "Administration"] as const;

// Shared lazy components so routes that render the same page don't remount it.
const UserEditPage = lazy(() => import("@platform/features/users/pages/UserEditPage"));

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
    path: "/tasks",
    label: "Tasks",
    icon: "bi-list-check",
    section: "Overview",
    component: lazy(() => import("@platform/features/tasks/pages/TasksPage")),
  },
  {
    path: "/factoring/documents",
    label: "Documents",
    icon: "bi-files",
    section: "Factoring",
    component: lazy(() => import("./features/factoring/pages/DocumentsPage")),
  },
  {
    path: "/factoring/new",
    label: "New request",
    icon: "bi-plus-circle",
    section: "Factoring",
    component: lazy(() => import("./features/factoring/pages/NewRequestPage")),
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
