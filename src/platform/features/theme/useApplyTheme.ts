import { useLayoutEffect, useSyncExternalStore } from "react";
import { useAppSelector } from "@platform/app/store";
import { selectTheme } from "./themeSlice";
import { applyThemeVariables, resolveMode } from "./themeUtils";

const DARK_QUERY = "(prefers-color-scheme: dark)";

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const systemPrefersDark = () => window.matchMedia(DARK_QUERY).matches;

/** "light" or "dark": the user's choice, or the computer's setting in "system" mode (live) */
export function useResolvedMode() {
  const { mode } = useAppSelector(selectTheme);
  const prefersDark = useSyncExternalStore(subscribe, systemPrefersDark, () => false);
  return resolveMode(mode, prefersDark);
}

// Keeps <html>'s color mode and CSS theme variables in sync with the Redux theme.
// Layout effect so the saved theme is applied before the first paint (no color flash);
// index.html sets the mode even earlier, before the app loads.
export function useApplyTheme(): void {
  const theme = useAppSelector(selectTheme);
  const mode = useResolvedMode();

  useLayoutEffect(() => {
    applyThemeVariables(theme, mode);
  }, [theme, mode]);
}
