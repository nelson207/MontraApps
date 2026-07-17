import { useState } from "react";
import {
  usePostApiAuthSetupAuthenticatorMutation,
  usePostApiAuthVerifyAuthenticatorMutation,
  type SetupAuthenticatorResponseDto,
  type VerifyAuthenticatorRequestDto,
} from "../../../../services/api/generated/MontraPOSApi";

export function useSetupAuthenticator() {
  const [data, setData] = useState<SetupAuthenticatorResponseDto | null>(null);
  const [code, setCode] = useState("");

  const [setupAuthenticator, setupState] =
    usePostApiAuthSetupAuthenticatorMutation();

  const [verifyAuthenticator, verifyState] =
    usePostApiAuthVerifyAuthenticatorMutation();

  const startSetup = async () => {
    const response = await setupAuthenticator().unwrap();
    setData(response);
  };

  const verifyCode = async () => {
    const request: VerifyAuthenticatorRequestDto = {
      code,
    };

    await verifyAuthenticator({
      verifyAuthenticatorRequestDto: request,
    }).unwrap();
  };

  return {
    data,
    code,
    setCode,
    startSetup,
    verifyCode,
    isSettingUp: setupState.isLoading,
    isVerifying: verifyState.isLoading,
    setupError: setupState.error,
    verifyError: verifyState.error,
  };
}
