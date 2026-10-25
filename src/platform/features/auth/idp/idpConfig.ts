// "Sign in with Keycloak" (OpenID Connect): configured per environment, never in code.
//   VITE_IDP_ENABLED=true, VITE_IDP_AUTHORITY, VITE_IDP_CLIENT_ID, VITE_IDP_SCOPE, VITE_IDP_LABEL

export type IdpConfig = {
  authority: string;
  clientId: string;
  scope: string;
  label: string;
};

const DEFAULT_SCOPE = "openid profile";
const DEFAULT_LABEL = "Sign in with Keycloak";

/** The IdP settings, or null when it's off or incompletely configured (no button then) */
export function readIdpConfig(env: Partial<Record<string, string | undefined>>): IdpConfig | null {
  if (env.VITE_IDP_ENABLED?.trim().toLowerCase() !== "true") return null;
  const authority = env.VITE_IDP_AUTHORITY?.trim().replace(/\/+$/, "");
  const clientId = env.VITE_IDP_CLIENT_ID?.trim();
  if (!authority || !clientId) {
    console.warn("VITE_IDP_ENABLED is true but VITE_IDP_AUTHORITY or VITE_IDP_CLIENT_ID is missing: Keycloak sign-in is off.");
    return null;
  }
  const scope = env.VITE_IDP_SCOPE?.trim() || DEFAULT_SCOPE;
  return {
    authority,
    clientId,
    // The ID token needs openid, whatever else is configured
    scope: scope.split(/\s+/).includes("openid") ? scope : `openid ${scope}`,
    label: env.VITE_IDP_LABEL?.trim() || DEFAULT_LABEL,
  };
}

export const IDP_CONFIG = readIdpConfig(import.meta.env);

/** The POS route Keycloak redirects back to (register it on the client, per app origin) */
export const IDP_CALLBACK_PATH = "/auth/callback";
