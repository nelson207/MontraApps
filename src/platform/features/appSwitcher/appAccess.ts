// Which Montra apps a user can switch to: the "apps" claim of their JWT (MontraAplApplications
// codes, e.g. [701, 702]) intersected with the apps that exist.

export type MontraApp = {
  /** e.g. "credit" (matches BRAND.id; claim values are normalized: "Montra Stock Credit" → "stockcredit") */
  id: string;
  name: string;
  description: string;
  /** Bootstrap Icons class */
  icon: string;
  /** Where the app lives; null while it isn't available yet */
  url: string | null;
};

/** JWT claim with the user's apps: MontraAplApplications codes (e.g. [700, 701, 702]) */
export const APPS_CLAIM = "apps";
/** Older claim with app names (e.g. ["Credit", "Lawyer"]), still read when "apps" is missing */
export const LEGACY_APPS_CLAIM = "AplApplications";

/**
 * The backend's MontraAplApplications enum: its code (JWT "apps"), its name (the API's
 * MontraAplApplications, also the screen customization identifier) and the app it is here
 * (BRAND.id). 700 is the mobile app, which has no web app to switch to.
 */
export const MONTRA_APPLICATIONS = [
  { code: 700, identifier: "MONTRA_APPLICATION_APP", appId: "app" },
  { code: 701, identifier: "MONTRA_APPLICATION_CREDIT", appId: "credit" },
  { code: 702, identifier: "MONTRA_APPLICATION_LAWYER", appId: "lawyer" },
  { code: 703, identifier: "MONTRA_APPLICATION_STOCK", appId: "stockcredit" },
  { code: 704, identifier: "MONTRA_APPLICATION_FACTORING", appId: "factoring" },
  { code: 705, identifier: "MONTRA_APPLICATION_CUSTOMER", appId: "customer" },
] as const;

// 701 / "701" / "MONTRA_APPLICATION_CREDIT" → "credit" (unknown codes → null);
// older names: "Montra Lawyer" / "MontraLawyer" / "LAWYER" → "lawyer"
const toAppId = (value: unknown): string | null => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  if (/^\d+$/.test(text)) return MONTRA_APPLICATIONS.find((a) => a.code === Number(text))?.appId ?? null;
  const known = MONTRA_APPLICATIONS.find((a) => a.identifier === text.toUpperCase());
  if (known) return known.appId;
  const id = text.toLowerCase().replace(/^montra[\s_-]*/, "").replace(/[\s_-]+/g, "");
  return id || null;
};

const fromItem = (item: unknown): string | null => {
  if (item && typeof item === "object") {
    const { code, name, id } = item as { code?: unknown; name?: unknown; id?: unknown };
    return toAppId(code ?? name ?? id);
  }
  return toAppId(item);
};

/** App ids from the claim, which may be a list, a JSON list string or a separated string; null when absent. */
export function appIdsFromClaim(claim: unknown): string[] | null {
  let list: unknown[] | null = null;
  if (Array.isArray(claim)) list = claim;
  else if (typeof claim === "string") {
    const text = claim.trim();
    if (text.startsWith("[")) {
      try {
        const parsed: unknown = JSON.parse(text);
        if (Array.isArray(parsed)) list = parsed;
      } catch {
        // not JSON: fall through to the separated form
      }
    }
    list ??= text.split(/[\s,;]+/);
  }
  if (!list) return null;
  return [...new Set(list.map(fromItem).filter((id): id is string => !!id))];
}

/** The user's app ids from the JWT payload: the "apps" claim, or the older AplApplications one */
export function appIdsFromToken(claims: Record<string, unknown> | null | undefined): string[] | null {
  if (!claims) return null;
  return appIdsFromClaim(claims[APPS_CLAIM]) ?? appIdsFromClaim(claims[LEGACY_APPS_CLAIM]);
}

/**
 * Apps to offer in the switcher: the current one first (the user is in it), then the other
 * apps of the claim that exist. Without the claim only the current app is known.
 */
export function accessibleApps(registry: MontraApp[], claimIds: string[] | null, currentId: string): MontraApp[] {
  const allowed = new Set([currentId, ...(claimIds ?? [])]);
  // The current app is always listed (the user is in it), even before it has a url
  const available = registry.filter((app) => allowed.has(app.id) && (app.url !== null || app.id === currentId));
  return [
    ...available.filter((app) => app.id === currentId),
    ...available.filter((app) => app.id !== currentId),
  ];
}
