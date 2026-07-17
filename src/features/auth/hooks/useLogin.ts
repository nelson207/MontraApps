import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { selectIsAuthenticated, useAppSelector } from "../../../app/store";
import {
  usePostApiAuthLoginMutation,
  usePostApiAuthRecoverPasswordMutation,
  usePostApiAuthValidate2FaMutation,
  type LoginRequestDto,
  type RecoverPasswordDto,
  type ValidateTwoFactorRequestDto,
} from "../../../services/api/generated/MontraPOSApi";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthed = useAppSelector(selectIsAuthenticated);

  const [login, { isLoading: isLoginLoading, error: loginError }] =
    usePostApiAuthLoginMutation();

  const [validate2FA, { isLoading: isOtpLoading, error: otpError }] =
    usePostApiAuthValidate2FaMutation();

  const [
    forgotPassword,
    { isLoading: isForgotPasswordLoading, error: forgotPasswordError },
  ] = usePostApiAuthRecoverPasswordMutation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");

  const [backCountdown, setBackCountdown] = useState<number | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLogin, setForgotLogin] = useState("");
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<
    string | null
  >(null);
  const [forgotRedirectCountdown, setForgotRedirectCountdown] = useState<
    number | null
  >(null);

  const from =
    (location.state as LocationState | null)?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthed) {
      navigate(from, { replace: true });
    }
  }, [isAuthed, from, navigate]);

  const getErrorMessage = (error: unknown): string | null => {
    if (!error || typeof error !== "object") return null;

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
  };

  const errorMessage = getErrorMessage(
    loginError || otpError || forgotPasswordError,
  );
  const isLoading = isLoginLoading || isOtpLoading;

  useEffect(() => {
    if (errorMessage?.toLowerCase().includes("expired")) {
      setBackCountdown(10);

      const interval = setInterval(() => {
        setBackCountdown((prev) => {
          if (prev === null) return null;

          if (prev <= 1) {
            clearInterval(interval);
            resetTwoFactor();
            return null;
          }

          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [errorMessage]);

  const resetTwoFactor = () => {
    setRequiresTwoFactor(false);
    setTwoFactorToken(null);
    setOtpCode("");
  };

  const onPasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const loginRequestDto: LoginRequestDto = {
      identifier: username,
      password,
      method: "Password",
      rememberMe,
    };

    try {
      const response = await login({ loginRequestDto }).unwrap();

      if (response?.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setTwoFactorToken(response.twoFactorToken ?? null);
        return;
      }

      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const onOtpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!twoFactorToken) return;

    try {
      const validateTwoFactorRequestDto: ValidateTwoFactorRequestDto = {
        twoFactorToken,
        otpCode,
      };
      await validate2FA({ validateTwoFactorRequestDto }).unwrap();

      navigate(from, { replace: true });
    } catch (err) {
      console.error("2FA validation failed:", err);
    }
  };

  const onForgotPasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const recoverPasswordDto: RecoverPasswordDto = {
        userEmail: forgotEmail,
        userLogin: forgotLogin,
      };
      const response = await forgotPassword({ recoverPasswordDto }).unwrap();

      setForgotSuccessMessage(
        response ??
          "If an account with that email exists, a reset link has been sent.",
      );

      setUsername(forgotLogin);

      let seconds = 10;

      const interval = setInterval(() => {
        seconds--;

        setForgotRedirectCountdown(seconds);

        setForgotSuccessMessage(
          `${
            response ??
            "If an account with that email exists, a reset link has been sent."
          }\nRedirecting to login in ${seconds} seconds...`,
        );

        if (seconds <= 0) {
          clearInterval(interval);

          setShowForgotPassword(false);
          setForgotSuccessMessage(null);
          setForgotRedirectCountdown(null);
          setForgotEmail("");
          setForgotLogin("");
        }
      }, 1000);
    } catch (err) {
      console.error("Forgot password failed:", err);
    }
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    rememberMe,
    setRememberMe,

    requiresTwoFactor,
    otpCode,
    setOtpCode,

    isLoading,
    isLoginLoading,
    isOtpLoading,
    errorMessage,
    backCountdown,

    onPasswordSubmit,
    onOtpSubmit,
    resetTwoFactor,
    showForgotPassword,
    setShowForgotPassword,
    forgotEmail,
    setForgotEmail,
    forgotLogin,
    setForgotLogin,
    forgotSuccessMessage,
    setForgotSuccessMessage,
    isForgotPasswordLoading,
    onForgotPasswordSubmit,
  };
}
