// Extracts a readable message from an RTK Query / fetch error.
export function getApiErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;

  // RTK Query: request never reached the server (offline, CORS, server down)
  if ("status" in error && error.status === "FETCH_ERROR") {
    return "Can't reach the server. Check your connection and try again.";
  }

  if ("data" in error && error.data) {
    if (typeof error.data === "string") return error.data;

    if (
      typeof error.data === "object" &&
      "message" in error.data &&
      error.data.message
    ) {
      return String(error.data.message);
    }
  }

  if ("error" in error && error.error) return String(error.error);
  if ("message" in error && error.message) return String(error.message);

  return null;
}
