import type { FormEvent } from "react";
import { useEffect, useReducer, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_SETTINGS } from "@app/appSettings";
import { selectIsAuthenticated, useAppDispatch, useAppSelector } from "@platform/app/store";
import {
  usePostApiAuth2FaVerifyMutation,
  usePostApiAuthLoginMutation,
  usePostApiAuthPasswordChangeRequiredMutation,
  usePostApiAuthPasswordForgotMutation,
  type ForgotPasswordRequest,
  type LoginRequest,
  type LoginResponse,
  type MontraAplApplications,
  type TwoFactorVerifyRequest,
} from "@platform/api/generated/MontraPOSApi";
import {
  INITIAL_LOGIN_FLOW,
  loginFlow,
  loginOutcome,
  passwordChangeRequest,
  type LoginFlowEvent,
} from "../loginFlow";
import { setRememberMe as rememberLoginChoice } from "../authSlice";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import i18n from "@platform/i18n/i18n";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthed = useAppSelector(selectIsAuthenticated);
  const dispatch = useAppDispatch();

  const [login, { isLoading: isLoginLoading, error: loginError }] =
    usePostApiAuthLoginMutation();

  const [validate2FA, { isLoading: isOtpLoading, error: otpError }] =
    usePostApiAuth2FaVerifyMutation();

  const [
    forgotPassword,
    { isLoading: isForgotPasswordLoading, error: forgotPasswordError },
  ] = usePostApiAuthPasswordForgotMutation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // The sign-in steps (memory only; see loginFlow.ts)
  const [flow, dispatchFlow] = useReducer(loginFlow, INITIAL_LOGIN_FLOW);
  const requiresTwoFactor = flow.step === "twoFactor";
  const requiresPasswordChange = flow.step === "passwordChange";
  const [otpCode, setOtpCode] = useState("");

  const [changePassword, { isLoading: isPasswordChangeLoading }] =
    usePostApiAuthPasswordChangeRequiredMutation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [backCountdown, setBackCountdown] = useState<number | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLogin, setForgotLogin] = useState("");
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<
    string | null
  >(null);

  const from =
    (location.state as LocationState | null)?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthed) {
      navigate(from, { replace: true });
    }
  }, [isAuthed, from, navigate]);

  const errorMessage = getApiErrorMessage(
    loginError || otpError || forgotPasswordError,
  );
  const isLoading = isLoginLoading || isOtpLoading;

  const resetTwoFactor = () => {
    dispatchFlow({ type: "cancel" });
    setOtpCode("");
  };

  // An expired code: count down 10 s, then back to the start. The countdown starts when a new
  // "expired" message appears (set while rendering); the effect only runs the timer.
  const expiredMessage = errorMessage?.toLowerCase().includes("expired") ? errorMessage : null;
  const [countdownFor, setCountdownFor] = useState<string | null>(null);
  if (expiredMessage !== countdownFor) {
    setCountdownFor(expiredMessage);
    if (expiredMessage) setBackCountdown(10);
  }

  useEffect(() => {
    if (!expiredMessage) return;
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
  }, [expiredMessage]);

  /** The new-password fields go with the step (whatever the outcome) */
  const clearPasswordChangeFields = () => {
    setNewPassword("");
    setConfirmPassword("");
  };

  /**
   * One handler for the LoginResponse of /login, /password/change-required and /2fa/verify:
   * the flow moves to the step it asks for; signed in → off to the app.
   */
  const handleLoginResponse = (event: LoginFlowEvent & { response: LoginResponse }) => {
    dispatchFlow(event);
    if (loginOutcome(event.response) === "loggedIn") navigate(from, { replace: true });
  };

  // The password-change challenge lasts ~5 minutes: then back to the login form
  useEffect(() => {
    if (flow.step !== "passwordChange" || flow.challengeExpiresAt === null) return;
    const timer = setTimeout(() => {
      clearPasswordChangeFields();
      dispatchFlow({ type: "challengeExpired" });
    }, Math.max(0, flow.challengeExpiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [flow.step, flow.challengeExpiresAt]);

  const onPasswordChangeSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword || isPasswordChangeLoading) return;

    const request = passwordChangeRequest(flow, newPassword, Date.now());
    if (!request) {
      clearPasswordChangeFields();
      dispatchFlow({ type: "challengeExpired" });
      return;
    }
    dispatchFlow({ type: "clearError" });
    try {
      // Anonymous: the challenge travels in the body, never as a bearer token
      const response = await changePassword({ requiredPasswordChangeRequest: request }).unwrap();
      clearPasswordChangeFields();
      handleLoginResponse({ type: "passwordChangeAnswered", response, now: Date.now() });
    } catch (error) {
      // Not logged (the request carries passwords); the flow decides: retry here or back to login
      dispatchFlow({ type: "passwordChangeFailed", error });
      if ((error as { status?: unknown })?.status === 401) clearPasswordChangeFields();
    }
  };

  const cancelPasswordChange = () => {
    clearPasswordChangeFields();
    dispatchFlow({ type: "cancel" });
  };

  const onPasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // The app signing in (its screen customization identifier is the API's application id)
    const loginRequest: LoginRequest = {
      username,
      password,
      method: "Custom",
      montraAplApplication: APP_SETTINGS.identifier as MontraAplApplications,
      // Not in the API contract yet (ignored until then): asks for a refresh cookie that ends
      // with the browser when off. Meanwhile the app ends such sessions itself (sessionSync.ts).
      ...({ rememberMe } as Partial<LoginRequest>),
    };

    try {
      dispatch(rememberLoginChoice(rememberMe));
      const response = await login({ loginRequest }).unwrap();
      // The typed password leaves the form: only a required password change keeps it (in the flow)
      setPassword("");
      handleLoginResponse({ type: "loginAnswered", response, password, now: Date.now() });
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const onOtpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Only a 2FA challenge goes to /2fa/verify
    if (flow.step !== "twoFactor" || !flow.challengeToken) return;

    try {
      const twoFactorVerifyRequest: TwoFactorVerifyRequest = {
        challengeToken: flow.challengeToken,
        code: otpCode,
      };
      const response = await validate2FA({ twoFactorVerifyRequest }).unwrap();
      handleLoginResponse({ type: "twoFactorAnswered", response, now: Date.now() });
    } catch (err) {
      console.error("2FA validation failed:", err);
    }
  };

  const onForgotPasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const forgotPasswordRequest: ForgotPasswordRequest = {
        email: forgotEmail,
        username: forgotLogin,
      };
      const answer = await forgotPassword({ forgotPasswordRequest }).unwrap();
      // The API may answer with a message to show; otherwise the usual one
      const response = typeof answer === "string" && answer.trim() ? answer : null;

      setForgotSuccessMessage(response ?? i18n.t("auth:forgot.sent"));

      setUsername(forgotLogin);

      let seconds = 10;

      const interval = setInterval(() => {
        seconds--;

        setForgotSuccessMessage(
          `${response ?? i18n.t("auth:forgot.sent")}\n${i18n.t("auth:forgot.redirecting", { count: seconds })}`,
        );

        if (seconds <= 0) {
          clearInterval(interval);

          setShowForgotPassword(false);
          setForgotSuccessMessage(null);
          setForgotEmail("");
          setForgotLogin("");
        }
      }, 1000);
    } catch (err) {
      console.error("Forgot password failed:", err);
    }
  };

  return {
    /** Where to go once signed in (also carried through the Keycloak round trip) */
    from,
    username,
    setUsername,
    password,
    setPassword,
    rememberMe,
    setRememberMe,

    requiresTwoFactor,
    otpCode,

    requiresPasswordChange,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isPasswordChangeLoading,
    passwordChangeError: flow.error,
    onPasswordChangeSubmit,
    cancelPasswordChange,
    /** Shown on the login form after a step sent the user back (e.g. the challenge expired) */
    loginNotice: flow.notice,
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
