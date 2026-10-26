/// <reference types="vite/client" />

// Environment variables the platform reads (.env, .env.<app>; see .env.example).
interface ImportMetaEnv {
  /** "true" shows "Sign in with Keycloak" on the login page */
  readonly VITE_IDP_ENABLED?: string;
  /** https://<keycloak>/realms/<realm> */
  readonly VITE_IDP_AUTHORITY?: string;
  /** The POS public client (Authorization Code + PKCE) */
  readonly VITE_IDP_CLIENT_ID?: string;
  /** Space-separated: "openid profile" plus what the backend team asks for */
  readonly VITE_IDP_SCOPE?: string;
  /** "off" (default), "button", or "auto" (tries Windows sign-in when the login page opens) */
  readonly VITE_WINDOWS_LOGIN?: string;
  /** The API's Windows-login application (e.g. https://vmafs-fe02:8443/windows); required for button / auto */
  readonly VITE_WINDOWS_LOGIN_URL?: string;
  /** The Montra API (default https://localhost:5165) */
  readonly VITE_API_BASE_URL?: string;
  /** The button's label (default "Sign in with Keycloak") */
  readonly VITE_IDP_LABEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
