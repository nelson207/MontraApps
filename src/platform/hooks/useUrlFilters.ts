import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { rememberListUrl } from "./listUrl";

/**
 * List filters kept in the URL (survive Back, can be shared). Writes replace the history entry
 * so typing doesn't flood it; changing anything but `page` goes back to page 1.
 * The current filters are also remembered for the list's "back" links (see listUrl).
 */
export function useUrlFilters() {
  const [params, setParams] = useSearchParams();
  const { pathname, search } = useLocation();

  useEffect(() => rememberListUrl(pathname, search), [pathname, search]);

  const set = (changes: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
        if (!("page" in changes)) next.delete("page");
        return next;
      },
      { replace: true },
    );

  return { get: (key: string) => params.get(key) ?? "", set };
}
