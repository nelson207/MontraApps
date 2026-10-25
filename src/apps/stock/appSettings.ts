import type { AppSettingsConfig } from "@platform/features/appSettings/appSettingsModel";

// Montra Stock Credit's application settings (Settings → Application, administrators); the backend
// applies them.
export const APP_SETTINGS: AppSettingsConfig = {
  identifier: "MONTRA_APPLICATION_STOCK",
  sections: ["newsTypes", "emailTypes"],
};
