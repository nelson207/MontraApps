import type { AppSettingsConfig } from "@platform/features/appSettings/appSettingsModel";

// Montra Stock Credit's application settings (Settings → Application, administrators); the backend
// applies them. Its equipment lists only offer the types and categories listed per company, so
// without "companies" no stock could be added.
export const APP_SETTINGS: AppSettingsConfig = {
  identifier: "MONTRA_APPLICATION_STOCK",
  sections: ["companies", "newsTypes", "emailTypes"],
};
