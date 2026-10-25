import type { AppMessages } from "@platform/i18n/appMessages";

// The app's own texts (namespace "app": module labels, the login page's brand texts) per language.
// English is the source text in the code (modules.ts, brand.ts): only translations live here.
export const APP_MESSAGES: AppMessages = {
  "pt-PT": () => import("./i18n/pt-PT.json"),
};
