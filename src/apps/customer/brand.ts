import type { MontraBrand } from "@platform/app/contract";

// Montra Customer branding (shape: platform/app/contract.ts); the platform reads it through @app/brand.

export const BRAND = {
  /** AplApplications "Customer" */
  id: "customer",
  /** Shared by every Montra app */
  family: "Montra",
  /** This app */
  product: "Customer",
  /** Single-letter mark: favicon and collapsed sidebar (same across the family) */
  mark: "M",
  tagline: "Your contracts, payments and documents, whenever you need them.",
  /** Value points on the login page */
  highlights: [
    {
      icon: "bi-calendar-check",
      title: "Your next payment, at a glance",
      text: "What you pay, when, and anything overdue.",
    },
    {
      icon: "bi-file-earmark-pdf",
      title: "Every invoice, any time",
      text: "View each document in detail and download its PDF.",
    },
    {
      icon: "bi-shield-lock",
      title: "Secure by default",
      text: "Two-factor authentication keeps your account safe.",
    },
  ],
} as const satisfies MontraBrand;

/** "Montra Customer": page title, accessible labels */
export const APP_NAME = `${BRAND.family} ${BRAND.product}`;
