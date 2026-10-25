import type { AppSettingsConfig } from "@platform/features/appSettings/appSettingsModel";

// Montra Credit's application settings (Settings → Application, administrators): the available
// companies and, in each one, its businesses (and those that can start in proposal) and its
// equipment types and categories; the news types; the e-mail types. The backend applies them;
// the app applies "can start in proposal" (a new proposal's Business step,
// features/credoper/business/useBusinessChoices.ts).
export const APP_SETTINGS: AppSettingsConfig = {
  identifier: "MONTRA_APPLICATION_CREDIT",
  sections: ["companies", "newsTypes", "emailTypes"],
};
