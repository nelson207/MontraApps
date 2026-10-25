import type { MontraApp } from "./appAccess";

// Every Montra app the switcher can offer. Shared by all apps, so each one knows the others.
// `url: null` keeps an app out of the switcher until it's available.
// In development each app runs on its own dev server (npm run dev / dev:lawyer / dev:stock / dev:factoring / dev:customer).
const DEV = import.meta.env.DEV;

export const MONTRA_APPS: MontraApp[] = [
  {
    id: "credit",
    name: "Montra Credit",
    description: "Credit operations, from quotation to proposal.",
    icon: "bi-calculator",
    url: DEV ? "http://localhost:5173" : "/",
  },
  // In production, set Lawyer's url when it ships, e.g. "/lawyer" or "https://lawyer.montra.app":
  {
    id: "lawyer",
    name: "Montra Lawyer",
    description: "Legal actions and their deadlines.",
    icon: "bi-briefcase",
    url: DEV ? "http://localhost:5174" : null,
  },
  {
    id: "stockcredit",
    name: "Montra Stock Credit",
    description: "Stock financing under your agreements.",
    icon: "bi-car-front",
    url: DEV ? "http://localhost:5175" : null,
  },
  {
    id: "factoring",
    name: "Montra Factoring",
    description: "Invoice financing: factoring and confirming.",
    icon: "bi-receipt",
    url: DEV ? "http://localhost:5176" : null,
  },
  {
    id: "customer",
    name: "Montra Customer",
    description: "Your contracts, payments and documents.",
    icon: "bi-person-badge",
    url: DEV ? "http://localhost:5177" : null,
  },
];
