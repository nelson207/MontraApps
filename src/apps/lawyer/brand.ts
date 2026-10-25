import type { MontraBrand } from "@platform/app/contract";

// Montra Lawyer branding (shape: platform/app/contract.ts); the platform reads it through @app/brand.

export const BRAND = {
  id: "lawyer",
  /** Shared by every Montra app */
  family: "Montra",
  /** This app */
  product: "Lawyer",
  /** Single-letter mark: favicon and collapsed sidebar (same across the family) */
  mark: "M",
  tagline: "Legal actions, deadlines and documents, in one place.",
  /** Value points on the login page */
  highlights: [
    {
      icon: "bi-briefcase",
      title: "Every legal action",
      text: "Follow each case from filing to decision.",
    },
    {
      icon: "bi-calendar-event",
      title: "Never miss a deadline",
      text: "Hearings and due dates where you can see them.",
    },
    {
      icon: "bi-shield-lock",
      title: "Secure by default",
      text: "Two-factor authentication and role-based access.",
    },
  ],
} as const satisfies MontraBrand;

/** "Montra Lawyer": page title, accessible labels */
export const APP_NAME = `${BRAND.family} ${BRAND.product}`;
