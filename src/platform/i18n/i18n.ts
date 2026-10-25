import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { APP_MESSAGES } from "@app/i18n";
import { DEFAULT_LANGUAGE, type Language } from "./languages";
import { EN, NAMESPACES } from "./resources";

// The i18next instance of every Montra app: English bundled and ready before the first render;
// another language is loaded the first time it's chosen (setLanguage). The app's own texts are
// the "app" namespace (@app/i18n). Components use useTranslation(ns); code outside React (error
// messages built in the login flow…) uses i18n.t at the time the message is made.

void i18n.use(initReactI18next).init({
  resources: { [DEFAULT_LANGUAGE]: { ...EN, app: {} } },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: "common",
  ns: [...NAMESPACES, "app"],
  // React escapes what it renders
  interpolation: { escapeValue: false },
  // Synchronous: the English texts are bundled
  initAsync: false,
  returnNull: false,
});

type Bundles = Record<string, object>;

const LOADERS: Record<Exclude<Language, "en">, () => Promise<Bundles>> = {
  "pt-PT": async () => {
    const [platform, app] = await Promise.all([import("./locales/pt-PT/index"), APP_MESSAGES["pt-PT"]?.()]);
    return { ...platform.default, app: app?.default ?? {} };
  },
};

const loaded = new Set<Language>([DEFAULT_LANGUAGE]);

/** Shows the apps in `language`: its texts are loaded once, then everything re-renders in it */
export async function setLanguage(language: Language): Promise<void> {
  if (language !== "en" && !loaded.has(language)) {
    const bundles = await LOADERS[language]();
    for (const [ns, resources] of Object.entries(bundles)) i18n.addResourceBundle(language, ns, resources, true, true);
    loaded.add(language);
  }
  if (i18n.language !== language) await i18n.changeLanguage(language);
  document.documentElement.lang = language;
}

/** The language being shown (sent to the API as Accept-Language) */
export const currentLanguage = (): string => i18n.resolvedLanguage ?? i18n.language ?? DEFAULT_LANGUAGE;

export default i18n;
