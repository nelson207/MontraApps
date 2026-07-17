// features/auth/twoFactor/SetupAuthenticatorPage.tsx

import Alert from "react-bootstrap/Alert";
import { AuthenticatorQrCode } from "../components/authenticatorQrCode";
import { AuthenticatorVerificationForm } from "../components/authenticatorVerificationForm";
import { useSetupAuthenticator } from "../hooks/useSetupAuthenticator";

function getErrorMessage(error: unknown): string | null {
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
}

function SetupAuthenticatorPage() {
  const {
    data,
    code,
    setCode,
    startSetup,
    verifyCode,
    isSettingUp,
    isVerifying,
    setupError,
    verifyError,
  } = useSetupAuthenticator();

  const errorMessage = getErrorMessage(setupError || verifyError);

  return (
    <div className="container py-4" style={{ maxWidth: 520 }}>
      <h2>Set up Authenticator App</h2>

      <p className="text-muted">
        Use Google Authenticator, Microsoft Authenticator, or another compatible
        app.
      </p>

      {!data && (
        <button
          className="btn btn-primary"
          onClick={startSetup}
          disabled={isSettingUp}
        >
          {isSettingUp ? "Generating..." : "Generate QR Code"}
        </button>
      )}

      {data?.authenticatorUri && (
        <>
          <p className="mt-4">Scan this QR code with your authenticator app.</p>

          <AuthenticatorQrCode
            authenticatorUri={data.authenticatorUri}
            manualEntryKey={data.manualEntryKey}
          />

          <AuthenticatorVerificationForm
            code={code}
            isLoading={isVerifying}
            isRegenerating={isSettingUp}
            onCodeChange={setCode}
            onSubmit={verifyCode}
            onRegenerate={startSetup}
          />
        </>
      )}

      {errorMessage && (
        <Alert variant="danger" className="mt-4">
          {errorMessage}
        </Alert>
      )}
    </div>
  );
}

export default SetupAuthenticatorPage;
