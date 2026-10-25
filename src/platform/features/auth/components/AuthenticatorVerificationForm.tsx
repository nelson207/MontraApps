import type { FormEvent } from "react";
import { OTP_LENGTH } from "../hooks/useSetupAuthenticator";

type Props = {
  code: string;
  isLoading: boolean;
  isRegenerating: boolean;
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
};

export function AuthenticatorVerificationForm({
  code,
  isLoading,
  isRegenerating,
  onCodeChange,
  onSubmit,
  onRegenerate,
  onCancel,
}: Props) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="authenticator-code" className="form-label fw-semibold">
        Verification code
      </label>
      <input
        id="authenticator-code"
        className="form-control form-control-lg font-monospace text-center app-otp-input"
        placeholder={"0".repeat(OTP_LENGTH)}
        value={code}
        maxLength={OTP_LENGTH}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, ""))}
      />
      <div className="form-text">
        Enter the {OTP_LENGTH}-digit code shown in your authenticator app.
      </div>

      <div className="d-flex flex-wrap gap-2 mt-3">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || code.length !== OTP_LENGTH}
        >
          {isLoading && (
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          )}
          {isLoading ? "Verifying…" : "Verify and enable"}
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <button
        type="button"
        className="btn btn-link btn-sm px-0 mt-2"
        onClick={onRegenerate}
        disabled={isRegenerating}
      >
        <i className="bi bi-arrow-repeat me-1" />
        {isRegenerating ? "Generating…" : "Generate a new QR code"}
      </button>
    </form>
  );
}
