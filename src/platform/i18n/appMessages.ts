import type { Language } from "./languages";

// The app's own texts (namespace "app"), from the @app/i18n contract: module labels by their
// English label, and the login page's brand texts. English is the source text in the app's code
// (modules.ts, brand.ts), so only the other languages are listed, each loaded when chosen.

export type AppTranslations = {
  modules?: Record<string, string>;
  /** Menu sections, by their English name */
  sections?: Record<string, string>;
  brand?: { tagline?: string; highlights?: { title?: string; text?: string }[] };
  /** The working context's texts (apps/<app>/workContext.ts), same keys */
  workContext?: {
    levels?: Partial<Record<"organization" | "unit" | "member", { label?: string; plural?: string }>>;
    memberRole?: string;
    purpose?: string;
    impersonationNote?: string;
  };
};

export type AppMessages = Partial<Record<Exclude<Language, "en">, () => Promise<{ default: AppTranslations }>>>;
