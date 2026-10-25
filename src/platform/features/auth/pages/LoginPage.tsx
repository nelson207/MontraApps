import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import type { LoginNavState } from "../useSessionExpiredRedirect";
import { useLogin } from "../hooks/useLogin";
import TwoFactorForm from "../components/TwoFactorForm";
import PasswordChangeForm from "../components/PasswordChangeForm";
import PasswordLoginForm from "../components/PasswordLoginForm";
import LoginErrorAlert from "../components/LoginErrorAlert";
import LoginLayout from "../components/LoginLayout";
import ForgotPasswordForm from "../components/ForgotPasswordForm";
import DemoAccess from "../components/DemoAccess";
import SessionRestoring from "../components/SessionRestoring";
import OtherSignInMethods from "../components/OtherSignInMethods";
import type { IdpLoginNavState } from "./AuthCallbackPage";
import { selectIsRestoringSession, useAppSelector } from "@platform/app/store";

function LoginPage(): JSX.Element {
  const { t } = useTranslation("auth");
  const login = useLogin();
  const navState = useLocation().state as (LoginNavState & IdpLoginNavState) | null;
  const sessionExpired = navState?.reason === "sessionExpired";
  const onCredentials = !login.requiresTwoFactor && !login.requiresPasswordChange;
  // A reload: the session may come back (then useLogin goes on to the app)
  const isRestoring = useAppSelector(selectIsRestoringSession);
  if (isRestoring) return <SessionRestoring />;

  return (
    <LoginLayout>
      {/* A sign-in step sent the user back (e.g. the password-change challenge expired) */}
      {login.loginNotice && onCredentials && !login.showForgotPassword && (
        <div className="alert alert-warning d-flex align-items-center gap-2 py-2" role="status">
          <i className="bi bi-clock-history" aria-hidden="true" />
          {login.loginNotice}
        </div>
      )}
      {sessionExpired && !login.loginNotice && onCredentials && (
        <div className="alert alert-warning d-flex align-items-center gap-2 py-2" role="status">
          <i className="bi bi-clock-history" aria-hidden="true" />
          {t("login.sessionExpired")}
        </div>
      )}
      {login.requiresPasswordChange ? (
        <PasswordChangeForm {...login} />
      ) : login.showForgotPassword ? (
        <ForgotPasswordForm {...login} />
      ) : !login.requiresTwoFactor ? (
        <>
          <PasswordLoginForm {...login} />
          {/* Windows / Keycloak (when configured): same Remember me; no automatic sign-in when
              this page was opened to say something */}
          <OtherSignInMethods
            rememberMe={login.rememberMe}
            from={login.from}
            idpFailure={navState?.idpFailure}
            hasNotice={sessionExpired || !!navState?.idpFailure || !!login.loginNotice}
          />
        </>
      ) : (
        <TwoFactorForm {...login} />
      )}
      <LoginErrorAlert
        errorMessage={login.errorMessage}
        backCountdown={login.backCountdown}
      />
      {/* Development only: not part of a production build */}
      {import.meta.env.DEV && onCredentials && !login.showForgotPassword && <DemoAccess />}
    </LoginLayout>
  );
}

export default LoginPage;
