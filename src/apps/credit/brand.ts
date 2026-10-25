import type { MontraBrand } from "@platform/app/contract";

// Montra Credit branding. Every Montra app has its own brand.ts with this shape
// (platform/app/contract.ts); the platform reads it through @app/brand.

export const BRAND = {
  id: "credit",
  /** Shared by every Montra app */
  family: "Montra",
  /** This app */
  product: "Credit",
  /** Single-letter mark: favicon and collapsed sidebar (same across the family) */
  mark: "M",
  tagline: "Credit operations, from quotation to contract.",
  /** Value points on the login page */
  highlights: [
    {
      icon: "bi-file-earmark-text",
      title: "Quotations & proposals",
      text: "Simulate, compare and submit credit operations in minutes.",
    },
    {
      icon: "bi-diagram-3",
      title: "Your whole network",
      text: "Work across credit intermediaries, suppliers and vendors.",
    },
    {
      icon: "bi-shield-lock",
      title: "Secure by default",
      text: "Two-factor authentication and role-based access.",
    },
  ],
} as const satisfies MontraBrand;

/** "Montra Credit": page title, accessible labels */
export const APP_NAME = `${BRAND.family} ${BRAND.product}`;
