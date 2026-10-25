import { APPS_CLAIM } from "../appSwitcher/appAccess";
import { ADMINISTRATOR_ROLE, ROLE_CLAIM } from "../appSettings/appSettingsModel";

// DEVELOPMENT ONLY: a fake signed-in session to explore the app without the backend
// (login page → "Demo access", only rendered when import.meta.env.DEV). The token is unsigned:
// a real backend rejects it, so this is for the dev sample data only.

export const DEMO_USER = "Demo User";

const NAME_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
const HOURS = 8;

const base64url = (value: object) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/** An unsigned JWT for the demo user, with access to every Montra app, valid 8 hours */
export function demoToken(now = Date.now()): string {
  const header = { alg: "none", typ: "JWT" };
  const payload = {
    [NAME_CLAIM]: DEMO_USER,
    // MontraAplApplications codes, as the API issues them (700 = the mobile app)
    [APPS_CLAIM]: [700, 701, 702, 703, 704, 705],
    // Shows the administrators' screens (Settings → Application)
    [ROLE_CLAIM]: [ADMINISTRATOR_ROLE],
    exp: Math.floor(now / 1000) + HOURS * 3600,
  };
  return `${base64url(header)}.${base64url(payload)}.demo`;
}

/** The session was opened with "Demo access" (its token is the unsigned demo one) */
export const isDemoToken = (token: string | null | undefined): boolean => !!token && token.endsWith(".demo");
