import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

// Helpers for placeholder endpoints that the backend doesn't implement yet.

/**
 * The endpoint isn't implemented yet: server unreachable, 404, or a non-JSON answer.
 * The last one matters because the backend's SPA fallback answers unknown /api routes
 * with its index.html (HTTP 200), which RTK Query reports as PARSING_ERROR.
 */
export const isMissingEndpoint = (error: FetchBaseQueryError | undefined) =>
  !!error &&
  (error.status === "FETCH_ERROR" ||
    error.status === "PARSING_ERROR" ||
    error.status === 404 ||
    isSpaFallbackError(error));

/**
 * For POST/PUT to an unknown /api route, the same SPA fallback fails with a 500 whose
 * message names the SPA middleware. Only that exact signature counts as "missing":
 * other 500s are real server errors and must surface.
 */
function isSpaFallbackError(error: FetchBaseQueryError) {
  const message = (error as { data?: { message?: unknown } }).data?.message;
  return (
    error.status === 500 &&
    typeof message === "string" &&
    message.includes("SPA default page middleware")
  );
}

/** In development, use sample data while the endpoint is missing. Production surfaces the error. */
export const shouldUseSample = (error: FetchBaseQueryError | undefined) =>
  import.meta.env.DEV && isMissingEndpoint(error);

/** A 2xx answer that isn't the agreed JSON shape, reported as an error instead of used. */
export const unexpectedResponse = (what: string): FetchBaseQueryError => ({
  status: "CUSTOM_ERROR",
  error: `Unexpected ${what} response from the server`,
});

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Development samples only: a stable small number from an opaque id (ids are strings that must
 * never be parsed or computed with), to vary sample data per record.
 */
export const sampleSeed = (id: string): number => [...id].reduce((seed, char) => (seed * 31 + char.charCodeAt(0)) % 997, 7);
