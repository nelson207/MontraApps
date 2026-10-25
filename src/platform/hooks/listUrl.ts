// The last filters of each list page (e.g. /news?category=Compliance), so the "back" links of
// the pages opened from a list (article, user form…) return to it as it was left.
// Kept per browser tab (sessionStorage); without storage the links fall back to the bare path.

type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const key = (path: string) => `montra:list:${path}`;

const browserStorage = (): KeyValueStorage | null => {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
};

/** Remember `search` ("?a=1", or "" when cleared) as the filters of the list at `path` */
export function rememberListUrl(path: string, search: string, storage = browserStorage()): void {
  try {
    if (search && search !== "?") storage?.setItem(key(path), search);
    else storage?.removeItem(key(path));
  } catch {
    // Storage blocked or full: the back links just lose the filters
  }
}

/** `path` with the filters it was last left with */
export function listUrl(path: string, storage = browserStorage()): string {
  try {
    return `${path}${storage?.getItem(key(path)) ?? ""}`;
  } catch {
    return path;
  }
}
