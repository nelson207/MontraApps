import type { ThemeState } from "@platform/features/theme/themeSlice";

// UI preferences persisted per browser: platform ones (sidebar state, theme colors) plus
// whatever the app adds (e.g. Credit's working context), each under its own key.
// Storage can be unavailable (private mode, blocked site data), so every access is guarded.

const STORAGE_KEY = "montra:preferences";

export type Preferences = {
  sidebarCollapsed?: boolean;
  theme?: Partial<ThemeState>;
  /** The language the user chose (platform/i18n); none = their uiCulture, then English */
  language?: unknown;
  /** App-specific preferences (read them with a cast to the app's own type) */
  [appKey: string]: unknown;
};

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Preferences) : {};
  } catch {
    return {};
  }
}

export function savePreferences(preferences: Preferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // ignore: preferences just won't persist
  }
}
