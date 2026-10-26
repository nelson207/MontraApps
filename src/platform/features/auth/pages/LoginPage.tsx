import { useState, type FormEvent, type JSX } from "react";
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
import SignInMessage from "../components/SignInMessage";
import type { IdpLoginNavState } from "./AuthCallbackPage";
import { selectIsRestoringSession, useAppSelector } from "@platform/app/store";

function LoginPage(): JSX.Element {
  const { t } = useTranslation("auth");
  const login = useLogin();
  const navState = useLocation().state as (LoginNavState & IdpLoginNavState) | null;
  const sessionExpired = navState?.reason === "sessionExpired";
  const onCredentials = !login.requiresTwoFactor && !login.requiresPasswordChange;
  // Why the last Windows / Keycloak sign-in failed (a Keycloak failure comes back with the page)
  const [otherMethodFailure, setOtherMethodFailure] = useState<string | null>(navState?.idpFailure?.message ?? null);
  // A reload: the session may come back (then useLogin goes on to the app)
  const isRestoring = useAppSelector(selectIsRestoringSession);
  if (isRestoring) return <SessionRestoring />;

  // One message at a time, from whichever way of signing in was tried last
  const onOtherMethodMessage = (message: string | null) => {
    setOtherMethodFailure(message);
    login.clearErrorMessage();
  };
  const onPasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    setOtherMethodFailure(null);
    void login.onPasswordSubmit(e);
  };

  const onLoginForm = onCredentials && !login.showForgotPassword;
  const notice = login.loginNotice ?? (sessionExpired ? t("login.sessionExpired") : null);

  return (
    <LoginLayout>
      {login.requiresPasswordChange ? (
        <PasswordChangeForm {...login} />
      ) : login.showForgotPassword ? (
        <ForgotPasswordForm {...login} />
      ) : !login.requiresTwoFactor ? (
        <>
          <PasswordLoginForm {...login} onPasswordSubmit={onPasswordSubmit} />
          {/* Windows / Keycloak (when configured): same Remember me; no automatic sign-in when
              this page was opened to say something */}
          <OtherSignInMethods
            rememberMe={login.rememberMe}
            from={login.from}
            hasNotice={sessionExpired || !!navState?.idpFailure || !!login.loginNotice}
            onMessage={onOtherMethodMessage}
          />
        </>
      ) : (
        <TwoFactorForm {...login} />
      )}
      {/* The other steps (two-factor code, forgot password) keep their message under the form */}
      {!onLoginForm && <LoginErrorAlert errorMessage={login.errorMessage} backCountdown={login.backCountdown} />}
      {/* Development only: not part of a production build */}
      {import.meta.env.DEV && onLoginForm && <DemoAccess />}
      {/* Last: it hangs below everything else without moving it */}
      {onLoginForm && <SignInMessage failure={login.errorMessage ?? otherMethodFailure} notice={notice} />}
    </LoginLayout>
  );
}

export default LoginPage;
