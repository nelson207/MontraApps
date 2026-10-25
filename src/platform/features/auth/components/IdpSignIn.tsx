import { useState } from "react";
import { useTranslation } from "react-i18next";
import { startIdpSignIn } from "../idp/idpClient";
import { IDP_CONFIG } from "../idp/idpConfig";
import type { IdpFailure } from "../idp/idpErrors";

type Props = {
  /** The login form's "Remember me": it applies to both ways of signing in */
  rememberMe: boolean;
  /** Where to go once signed in */
  from: string;
  /** Why the last Keycloak sign-in failed (shown above the button) */
  failure?: IdpFailure | null;
};

// "Sign in with Keycloak" (only when configured; shown by OtherSignInMethods).
function IdpSignIn({ rememberMe, from, failure }: Props) {
  const { t } = useTranslation("auth");
  const [starting, setStarting] = useState(false);
  const [unreachable, setUnreachable] = useState(false);
  if (!IDP_CONFIG) return null;

  const start = () => {
    setStarting(true);
    setUnreachable(false);
    // Leaves the page for Keycloak; only comes back here if Keycloak can't be reached
    startIdpSignIn({ rememberMe, from }).catch((error: unknown) => {
      console.error("Keycloak sign-in could not start", error);
      setStarting(false);
      setUnreachable(true);
    });
  };

  const message = unreachable ? t("idp.unreachable") : failure?.message;

  return (
    <div>
      {message && (
        <div className="alert alert-warning d-flex align-items-start gap-2 py-2 small" role="alert">
          <i className="bi bi-exclamation-triangle mt-1" aria-hidden="true" />
          <span>{message}</span>
        </div>
      )}
      <button
        type="button"
        className="btn btn-outline-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
        disabled={starting}
        onClick={start}
      >
        {starting ? (
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        ) : (
          <i className="bi bi-building-lock" aria-hidden="true" />
        )}
        {IDP_CONFIG.label}
      </button>
    </div>
  );
}

export default IdpSignIn;
