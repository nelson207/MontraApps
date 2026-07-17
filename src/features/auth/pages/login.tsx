import type { JSX } from "react";
import { useLogin } from "../hooks/useLogin";
import TwoFactorForm from "../twofactor/components/twoFactorForm";
import PasswordLoginForm from "../components/passwordLoginForm";
import LoginErrorAlert from "../components/loginErrorAlert";
import LoginLayout from "../layout/loginLayout";
import ForgotPasswordForm from "../components/forgotPasswordForm";

function LoginPage(): JSX.Element {
  const login = useLogin();

  return (
    <LoginLayout>
      {login.showForgotPassword ? (
        <ForgotPasswordForm {...login} />
      ) : !login.requiresTwoFactor ? (
        <PasswordLoginForm {...login} />
      ) : (
        <TwoFactorForm {...login} />
      )}
      <LoginErrorAlert
        errorMessage={login.errorMessage}
        backCountdown={login.backCountdown}
      />
    </LoginLayout>
  );
}

export default LoginPage;
