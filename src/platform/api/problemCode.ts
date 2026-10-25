import i18n from "@platform/i18n/i18n";

// MontraAPI errors are ProblemDetails with a machine-readable `code` (e.g. "invalid_id",
// "backend_unavailable"): { title, status, code, traceId }. These read it from an RTK Query error;
// screens show messages by code, never the server's title.

/** The codes the screens react to */
export const PROBLEM = {
  tokenExpired: "token_expired",
  validationFailed: "validation_failed",
  userManagementForbidden: "user_management_forbidden",
  userHasNoEntity: "user_has_no_entity",
  invalidEmailConfirmationCode: "invalid_email_confirmation_code",
  backendUnavailable: "backend_unavailable",
  invalidId: "invalid_id",
} as const;

/** The ProblemDetails `code` of an RTK Query error, if any */
export function problemCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("data" in error)) return undefined;
  const data = (error as { data?: unknown }).data;
  const code = data && typeof data === "object" ? (data as { code?: unknown }).code : undefined;
  return typeof code === "string" ? code : undefined;
}

/** The HTTP status of an RTK Query error (a number), if any */
export function problemStatus(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | undefined)?.status;
  return typeof status === "number" ? status : undefined;
}

/** The message of a code in the user's language (errors:codes.<code>), if there is one */
const codeMessage = (code: string): string | null => {
  const key = `errors:codes.${code}`;
  return i18n.exists(key) ? i18n.t(key as never) : null;
};

/**
 * A message for the error, by its `code` (screens can override or add codes), then by status;
 * null when neither is known (the caller shows its own generic text).
 */
export function problemMessage(error: unknown, messages: Record<string, string> = {}): string | null {
  if (!error) return null;
  const code = problemCode(error);
  const byCode = code ? (messages[code] ?? codeMessage(code)) : null;
  if (byCode) return byCode;
  const status = (error as { status?: unknown }).status;
  if (status === "FETCH_ERROR") return i18n.t("errors:unreachable");
  if (status === 403) return i18n.t("errors:forbidden");
  if (status === 429) return i18n.t("errors:tooManyAttempts");
  if (status === 502) return codeMessage(PROBLEM.backendUnavailable);
  return null;
}

/**
 * 400 invalid_id: an id that isn't a valid token for its field. Usually a bug; for an id the app
 * saved (working context, bookmarked position…) it means the server's keys changed: drop it.
 */
export const isInvalidId = (error: unknown): boolean =>
  problemStatus(error) === 400 && problemCode(error) === PROBLEM.invalidId;
