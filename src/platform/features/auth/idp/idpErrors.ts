import { problemCode } from "@platform/api/problemCode";
import i18n from "@platform/i18n/i18n";

// What the login page says when "Sign in with Keycloak" fails (POST /api/auth/login/idp, or the
// Keycloak round trip itself). Never the server's or Keycloak's raw text.

export type IdpFailure = {
  message: string;
  /** Offer to try again with Keycloak */
  canRetry: boolean;
};

/** In the user's language when it's read */
export const organizationAccountFailed = () => i18n.t("auth:idp.failed");

/** POST /api/auth/login/idp errors (ProblemDetails `code`) */
export function idpLoginFailure(error: unknown): IdpFailure {
  const status = (error as { status?: unknown } | undefined)?.status;
  const code = problemCode(error);
  if (status === 401 || code === "invalid_credentials") {
    return { message: i18n.t("auth:idp.invalidCredentials"), canRetry: true };
  }
  if (status === 429 || code === "rate_limited") {
    return { message: i18n.t("auth:idp.rateLimited"), canRetry: false };
  }
  if (status === 502 || code === "backend_unavailable") {
    return { message: i18n.t("auth:idp.unavailable"), canRetry: true };
  }
  if (status === 400 && code === "validation_failed") {
    // No token reached the API: a bug on our side
    console.error("Keycloak sign-in: the token exchange was rejected (validation_failed)", error);
  }
  if (status === "FETCH_ERROR") {
    return { message: i18n.t("errors:unreachable"), canRetry: true };
  }
  return { message: organizationAccountFailed(), canRetry: true };
}

/** The Keycloak round trip failed (the user cancelled, or Keycloak sent an error back) */
export function idpCallbackFailure(error: unknown): IdpFailure {
  // OIDC error responses carry `error` (e.g. "access_denied" when the user cancels)
  const code = (error as { error?: unknown } | undefined)?.error;
  if (code === "access_denied") return { message: i18n.t("auth:idp.cancelled"), canRetry: true };
  return { message: organizationAccountFailed(), canRetry: true };
}
