import type { FormEvent } from "react";

type Props = {
  otpCode: string;
  setOtpCode: (value: string) => void;
  isLoading: boolean;
  isOtpLoading: boolean;
  backCountdown: number | null;
  onOtpSubmit: (e: FormEvent<HTMLFormElement>) => void;
  resetTwoFactor: () => void;
};

function TwoFactorForm({
  otpCode,
  setOtpCode,
  isLoading,
  isOtpLoading,
  backCountdown,
  onOtpSubmit,
  resetTwoFactor,
}: Props) {
  return (
    <>
      <h2 className="fw-bold mb-2">Two-Factor Authentication</h2>
      <p className="text-muted mb-4">
        Enter the verification code sent to your account.
      </p>

      <form onSubmit={onOtpSubmit}>
        <div className="mb-3">
          <label htmlFor="otpCode" className="form-label">
            Verification code
          </label>
          <input
            type="text"
            className="form-control"
            id="otpCode"
            value={otpCode}
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            onChange={(e) => setOtpCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && otpCode.length === 6) {
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
        </div>

        <div className="d-flex gap-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || otpCode.length < 6}
          >
            {isOtpLoading ? "Verifying..." : "Verify"}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={isLoading}
            onClick={resetTwoFactor}
          >
            {backCountdown !== null ? `Back (${backCountdown}s)` : "Back"}
          </button>
        </div>
      </form>
    </>
  );
}

export default TwoFactorForm;
