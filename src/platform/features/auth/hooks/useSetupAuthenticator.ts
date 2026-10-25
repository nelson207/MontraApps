import { useState } from "react";
import {
  usePostApiAuth2FaEnableMutation,
  usePostApiAuth2FaSetupMutation,
} from "@platform/api/generated/MontraPOSApi";

/** The authenticator secret, as the setup screens show it (QR + manual key) */
export type AuthenticatorSecret = { manualEntryKey: string | null; authenticatorUri: string | null; secret: string | null };
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";

export type SetupStep = "intro" | "scan" | "done";

export const OTP_LENGTH = 6;

// Authenticator app setup: request a secret (QR / manual key), then confirm it with a code.
export function useSetupAuthenticator() {
  const [step, setStep] = useState<SetupStep>("intro");
  const [secret, setSecret] = useState<AuthenticatorSecret | null>(null);
  const [code, setCode] = useState("");

  const [setupAuthenticator, setupState] =
    usePostApiAuth2FaSetupMutation();
  const [verifyAuthenticator, verifyState] =
    usePostApiAuth2FaEnableMutation();

  // Errors are shown from the mutation state, so failures are only caught here.
  const startSetup = async () => {
    try {
      const response = await setupAuthenticator().unwrap();
      setSecret({
        manualEntryKey: response.secret ?? null,
        authenticatorUri: response.otpAuthUri ?? null,
        secret: response.secret ?? null,
      });
      setCode("");
      verifyState.reset();
      setStep("scan");
    } catch {
      // surfaced via errorMessage
    }
  };

  const verifyCode = async () => {
    if (code.length !== OTP_LENGTH) return;

    try {
      // Enabling confirms the secret just shown with a code from the app
      await verifyAuthenticator({
        twoFactorEnableRequest: { secret: secret?.secret ?? null, code },
      }).unwrap();
      setSecret(null);
      setCode("");
      setStep("done");
    } catch {
      setCode("");
    }
  };

  const reset = () => {
    setSecret(null);
    setCode("");
    setupState.reset();
    verifyState.reset();
    setStep("intro");
  };

  return {
    step,
    secret,
    code,
    setCode,
    startSetup,
    verifyCode,
    reset,
    isSettingUp: setupState.isLoading,
    isVerifying: verifyState.isLoading,
    errorMessage:
      getApiErrorMessage(verifyState.error) ??
      getApiErrorMessage(setupState.error),
  };
}
