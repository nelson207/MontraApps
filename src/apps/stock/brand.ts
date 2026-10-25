import type { MontraBrand } from "@platform/app/contract";

// Montra Stock Credit branding (shape: platform/app/contract.ts); the platform reads it through @app/brand.

export const BRAND = {
  /** AplApplications "StockCredit" */
  id: "stockcredit",
  /** Shared by every Montra app */
  family: "Montra",
  /** This app */
  product: "Stock Credit",
  /** Single-letter mark: favicon and collapsed sidebar (same across the family) */
  mark: "M",
  tagline: "Finance your stock under the agreements you already have.",
  /** Value points on the login page */
  highlights: [
    {
      icon: "bi-car-front",
      title: "Stock in two steps",
      text: "Vehicle and amount, then the supplier's invoice. The agreement sets the terms.",
    },
    {
      icon: "bi-bar-chart-line",
      title: "Your credit lines at a glance",
      text: "Usage, ageing stock and due dates for every agreement.",
    },
    {
      icon: "bi-shield-lock",
      title: "Secure by default",
      text: "Two-factor authentication and role-based access.",
    },
  ],
} as const satisfies MontraBrand;

/** "Montra Stock Credit": page title, accessible labels */
export const APP_NAME = `${BRAND.family} ${BRAND.product}`;
