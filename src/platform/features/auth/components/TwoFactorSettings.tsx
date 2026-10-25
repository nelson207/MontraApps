import { useSetupAuthenticator } from "../hooks/useSetupAuthenticator";
import { AuthenticatorQrCode } from "./AuthenticatorQrCode";
import { AuthenticatorVerificationForm } from "./AuthenticatorVerificationForm";

const SCAN_STEPS = [
  "Open Google Authenticator, Microsoft Authenticator or a similar app.",
  "Scan the QR code, or type the setup key manually.",
  "Enter the 6-digit code the app shows to finish.",
];

// Two-factor authentication setup, embedded in Settings → Security.
function TwoFactorSettings() {
  const {
    step,
    secret,
    code,
    setCode,
    startSetup,
    verifyCode,
    reset,
    isSettingUp,
    isVerifying,
    errorMessage,
  } = useSetupAuthenticator();

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-body py-3">
        <h2 className="h6 mb-0">
          <i className="bi bi-shield-lock me-2 text-primary" />
          Two-factor authentication
        </h2>
      </div>

      <div className="card-body">
        {step === "intro" && (
          <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">
            <span className="app-feature-icon">
              <i className="bi bi-phone" />
            </span>
            <div className="flex-grow-1">
              <div className="fw-semibold">Authenticator app</div>
              <p className="text-body-secondary small mb-0">
                Add an extra layer of security: after your password, you'll be
                asked for a code from your phone.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary flex-shrink-0"
              onClick={startSetup}
              disabled={isSettingUp}
            >
              {isSettingUp && (
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              )}
              {isSettingUp ? "Preparing…" : "Set up"}
            </button>
          </div>
        )}

        {step === "scan" && secret?.authenticatorUri && (
          <div className="row g-4 align-items-start">
            <div className="col-12 col-md-5">
              <AuthenticatorQrCode
                authenticatorUri={secret.authenticatorUri}
                manualEntryKey={secret.manualEntryKey}
              />
            </div>

            <div className="col-12 col-md-7">
              <ol className="small text-body-secondary ps-3 mb-4">
                {SCAN_STEPS.map((text) => (
                  <li key={text} className="mb-1">
                    {text}
                  </li>
                ))}
              </ol>

              <AuthenticatorVerificationForm
                code={code}
                isLoading={isVerifying}
                isRegenerating={isSettingUp}
                onCodeChange={setCode}
                onSubmit={verifyCode}
                onRegenerate={startSetup}
                onCancel={reset}
              />
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">
            <span className="app-feature-icon bg-success-subtle text-success-emphasis">
              <i className="bi bi-shield-check" />
            </span>
            <div className="flex-grow-1">
              <div className="fw-semibold">Two-factor authentication is on</div>
              <p className="text-body-secondary small mb-0">
                You'll be asked for a code from your authenticator app the next
                time you sign in.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline-primary flex-shrink-0"
              onClick={reset}
            >
              Done
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-danger d-flex gap-2 mt-3 mb-0" role="alert">
            <i className="bi bi-exclamation-triangle-fill" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TwoFactorSettings;
