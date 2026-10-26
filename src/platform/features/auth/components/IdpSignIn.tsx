import { useState } from "react";
import { useTranslation } from "react-i18next";
import { startIdpSignIn } from "../idp/idpClient";
import { IDP_CONFIG } from "../idp/idpConfig";

type Props = {
  /** The login form's "Remember me": it applies to both ways of signing in */
  rememberMe: boolean;
  /** Where to go once signed in */
  from: string;
  /** The login screen's message (SignInMessage): null when an attempt starts, then why it failed */
  onMessage: (message: string | null) => void;
};

// "Sign in with Keycloak" (only when configured; shown by OtherSignInMethods). A failure after the
// Keycloak round trip comes back to the login page (AuthCallbackPage), which shows it.
function IdpSignIn({ rememberMe, from, onMessage }: Props) {
  const { t } = useTranslation("auth");
  const [starting, setStarting] = useState(false);
  if (!IDP_CONFIG) return null;

  const start = () => {
    setStarting(true);
    onMessage(null);
    // Leaves the page for Keycloak; only comes back here if Keycloak can't be reached
    startIdpSignIn({ rememberMe, from }).catch((error: unknown) => {
      console.error("Keycloak sign-in could not start", error);
      setStarting(false);
      onMessage(t("idp.unreachable"));
    });
  };

  return (
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
  );
}

export default IdpSignIn;
