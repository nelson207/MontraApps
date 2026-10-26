import { DEPLOYMENT_SETTINGS } from "@platform/app/deployment";

/** The Montra API (every app talks to the same one): VITE_API_BASE_URL in config.js or .env */
export const API_BASE_URL = DEPLOYMENT_SETTINGS.VITE_API_BASE_URL?.trim().replace(/\/+$/, "") || "https://localhost:5165";
