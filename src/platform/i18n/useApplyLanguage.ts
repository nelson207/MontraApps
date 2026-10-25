import { useEffect } from "react";
import { useGetApiUsersMeQuery } from "@platform/api/generated/MontraPOSApi";
import { selectIsAuthenticated, useAppSelector } from "@platform/app/store";
import { setLanguage } from "./i18n";
import { resolveLanguage } from "./languages";
import { selectLanguageChoice } from "./languageSlice";

/**
 * Keeps the apps in the user's language (languages.ts): their choice, else — once signed in —
 * their uiCulture, else English. Mounted once, in App.
 */
export function useApplyLanguage(): void {
  const choice = useAppSelector(selectLanguageChoice);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  // Only needed without a choice
  const me = useGetApiUsersMeQuery(undefined, { skip: !isAuthenticated || !!choice, refetchOnMountOrArgChange: false });
  const language = resolveLanguage({ choice, uiCulture: isAuthenticated ? me.currentData?.uiCulture : null });

  useEffect(() => {
    setLanguage(language).catch((error: unknown) => console.error(`Couldn't load the ${language} texts`, error));
  }, [language]);
}
