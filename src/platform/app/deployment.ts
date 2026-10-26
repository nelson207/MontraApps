// Where and how this build is deployed, read when the page loads, so one build serves any
// environment and any folder:
//  - settings: public/config.js (window.MONTRA_CONFIG), same names as the .env settings. A value
//    there wins over the build's .env, and changing it needs no new build.
//  - folder: the <base href> in index.html (e.g. "/Credit/" for https://site:5080/Credit/)

type Settings = Partial<Record<string, string | undefined>>;

declare global {
  interface Window {
    MONTRA_CONFIG?: Settings;
  }
}

const hasWindow = typeof window !== "undefined";

/** The deployment's settings: the build's .env, overridden by config.js */
export const DEPLOYMENT_SETTINGS: Settings = {
  ...(import.meta.env as Settings),
  ...(hasWindow ? window.MONTRA_CONFIG : undefined),
};

/** The folder the app is served from, without the trailing slash: "" at the site root, "/Credit" in /Credit/ */
export const APP_BASE_PATH = hasWindow ? new URL(document.baseURI).pathname.replace(/\/+$/, "") : "";

/** The absolute URL of an app route ("/login" → https://site:5080/Credit/login) */
export const appRouteUrl = (route: string) => `${window.location.origin}${APP_BASE_PATH}${route}`;
