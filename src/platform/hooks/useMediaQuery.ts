import { useCallback, useSyncExternalStore } from "react";

// Matches Bootstrap's lg breakpoint, where the layout switches from drawer to fixed sidebar.
export const DESKTOP_MEDIA_QUERY = "(min-width: 992px)";

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}
