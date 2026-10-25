import type { AppSettingsConfig } from "@platform/features/appSettings/appSettingsModel";

// Montra Customer's application settings (Settings → Application, administrators); the backend
// applies them.
export const APP_SETTINGS: AppSettingsConfig = {
  identifier: "MONTRA_APPLICATION_CUSTOMER",
  sections: ["newsTypes", "emailTypes"],
};
