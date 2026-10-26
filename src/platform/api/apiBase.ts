import { DEPLOYMENT_SETTINGS } from "@platform/app/deployment";

type Settings = Partial<Record<string, string | undefined>>;

const baseUrl = (value: string | undefined) => value?.trim().replace(/\/+$/, "") ?? "";

/** The Montra API (every app talks to the same one): VITE_API_BASE_URL in config.js or .env */
export const API_BASE_URL = baseUrl(DEPLOYMENT_SETTINGS.VITE_API_BASE_URL) || "https://localhost:5165";

/**
 * The API's Windows-login application (VITE_WINDOWS_LOGIN_URL, e.g. https://vmafs-fe02:8443/windows):
 * the only one with Windows Authentication, so only POST /api/auth/login/windows goes there (see
 * emptyApi). "" when not set: never the main API instead.
 */
export const readWindowsLoginUrl = (settings: Settings) => baseUrl(settings.VITE_WINDOWS_LOGIN_URL);

export const WINDOWS_LOGIN_URL = readWindowsLoginUrl(DEPLOYMENT_SETTINGS);
