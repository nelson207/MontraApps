import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { usePostApiAuthLogoutMutation } from "@platform/api/generated/MontraPOSApi";
import { useAppSelector } from "@platform/app/store";
import { endIdpSession } from "../idp/idpClient";
import { IDP_CONFIG } from "../idp/idpConfig";
import { pauseAutomaticWindowsSignIn } from "../windows/windowsSignIn";

type Props = {
  className?: string;
};

function LogoutButton({ className = "btn text-danger" }: Props) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [logout, { isLoading }] = usePostApiAuthLogoutMutation();
  // Read before logging out (the session, and with it this, is cleared by the logout)
  const signedInWithIdp = useAppSelector((state) => state.auth.signInMethod) === "idp";

  const handleLogout = async () => {
    try {
      // Ends the MontraAPI and Accipiens sessions (and the refresh cookie)
      await logout().unwrap();
    } catch (err) {
      console.error("Logout failed:", err);
    }
    // auth state is cleared on both success and failure
    // An explicit logout: the login page mustn't sign anyone back in with Windows by itself
    pauseAutomaticWindowsSignIn();
    if (signedInWithIdp && IDP_CONFIG) {
      // Also end the Keycloak session, so the next person at a shared terminal isn't signed in
      // automatically; Keycloak then returns to the login page
      try {
        await endIdpSession();
        return;
      } catch (err) {
        console.error("Keycloak logout failed:", err);
      }
    }
    navigate("/login", { replace: true });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      <i className="bi bi-box-arrow-right me-2" />
      {isLoading ? t("logout.loggingOut") : t("logout.logOut")}
    </button>
  );
}

export default LogoutButton;
