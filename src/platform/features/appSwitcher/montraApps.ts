import { DEPLOYMENT_SETTINGS } from "@platform/app/deployment";
import type { MontraApp } from "./appAccess";

// Every Montra app the switcher can offer. Shared by all apps, so each one knows the others.
// `url: null` keeps an app out of the switcher until it's available.
// In development each app runs on its own dev server (npm run dev / dev:lawyer / dev:stock / dev:factoring / dev:customer).
// In production config.js sets where each app lives: VITE_APP_URL_CREDIT, VITE_APP_URL_LAWYER,
// VITE_APP_URL_STOCKCREDIT, … (e.g. "/Credit/" or "https://lawyer.montra.app"), else the default below.
const DEV = import.meta.env.DEV;

const appUrl = (id: string, dev: string, production: string | null) =>
  DEV ? dev : DEPLOYMENT_SETTINGS[`VITE_APP_URL_${id.toUpperCase()}`]?.trim() || production;

export const MONTRA_APPS: MontraApp[] = [
  {
    id: "credit",
    name: "Montra Credit",
    description: "Credit operations, from quotation to proposal.",
    icon: "bi-calculator",
    url: appUrl("credit", "http://localhost:5173", "/"),
  },
  {
    id: "lawyer",
    name: "Montra Lawyer",
    description: "Legal actions and their deadlines.",
    icon: "bi-briefcase",
    url: appUrl("lawyer", "http://localhost:5174", null),
  },
  {
    id: "stockcredit",
    name: "Montra Stock Credit",
    description: "Stock financing under your agreements.",
    icon: "bi-car-front",
    url: appUrl("stockcredit", "http://localhost:5175", null),
  },
  {
    id: "factoring",
    name: "Montra Factoring",
    description: "Invoice financing: factoring and confirming.",
    icon: "bi-receipt",
    url: appUrl("factoring", "http://localhost:5176", null),
  },
  {
    id: "customer",
    name: "Montra Customer",
    description: "Your contracts, payments and documents.",
    icon: "bi-person-badge",
    url: appUrl("customer", "http://localhost:5177", null),
  },
];
