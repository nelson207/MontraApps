import type { AppSettingsConfig } from "@platform/features/appSettings/appSettingsModel";

// Montra Factoring's application settings (Settings → Application, administrators); the backend
// applies them.
export const APP_SETTINGS: AppSettingsConfig = {
  identifier: "MONTRA_APPLICATION_FACTORING",
  sections: ["newsTypes", "emailTypes"],
};
