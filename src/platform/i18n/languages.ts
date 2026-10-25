// The languages of the Montra apps and which one a user sees:
//   1) their choice in this browser (Settings → Appearance, the user menu);
//   2) their uiCulture from the API (GET /api/users/me), pt* → Portuguese, en* → English;
//   3) English.
// The browser's language isn't used.

export const LANGUAGES = ["en", "pt-PT"] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "en";

/** Each language in itself (shown in the language pickers, the same in every language) */
export const LANGUAGE_NAMES: Record<Language, string> = { en: "English", "pt-PT": "Português" };

/** A stored value, if it's a language the apps have */
export const parseLanguage = (value: unknown): Language | null =>
  (LANGUAGES as readonly unknown[]).includes(value) ? (value as Language) : null;

/** A .NET culture name (e.g. "pt-PT", "pt-BR", "en-GB") → the apps' language for it, if any */
export function languageFromCulture(culture: string | null | undefined): Language | null {
  const value = culture?.trim().toLowerCase() ?? "";
  if (value === "pt" || value.startsWith("pt-")) return "pt-PT";
  if (value === "en" || value.startsWith("en-")) return "en";
  return null;
}

export function resolveLanguage({ choice, uiCulture }: { choice: Language | null; uiCulture?: string | null }): Language {
  return choice ?? languageFromCulture(uiCulture) ?? DEFAULT_LANGUAGE;
}
