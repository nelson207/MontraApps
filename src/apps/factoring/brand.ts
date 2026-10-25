import type { MontraBrand } from "@platform/app/contract";

// Montra Factoring branding (shape: platform/app/contract.ts); the platform reads it through @app/brand.

export const BRAND = {
  /** AplApplications "Factoring" */
  id: "factoring",
  /** Shared by every Montra app */
  family: "Montra",
  /** This app */
  product: "Factoring",
  /** Single-letter mark: favicon and collapsed sidebar (same across the family) */
  mark: "M",
  tagline: "Turn your invoices into cash under the agreements you already have.",
  /** Value points on the login page */
  highlights: [
    {
      icon: "bi-receipt",
      title: "Invoices in two steps",
      text: "Choose the agreement, add the invoices. Factoring or confirming.",
    },
    {
      icon: "bi-calendar-check",
      title: "Every due date in view",
      text: "What is financed, what is coming due and what is late.",
    },
    {
      icon: "bi-shield-lock",
      title: "Secure by default",
      text: "Two-factor authentication and role-based access.",
    },
  ],
} as const satisfies MontraBrand;

/** "Montra Factoring": page title, accessible labels */
export const APP_NAME = `${BRAND.family} ${BRAND.product}`;
