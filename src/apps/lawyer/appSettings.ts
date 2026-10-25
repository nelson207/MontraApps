import type { AppSettingsConfig } from "@platform/features/appSettings/appSettingsModel";

// Montra Lawyer's application settings (Settings → Application, administrators); the backend
// applies them.
export const APP_SETTINGS: AppSettingsConfig = {
  identifier: "MONTRA_APPLICATION_LAWYER",
  sections: ["newsTypes", "emailTypes"],
};
