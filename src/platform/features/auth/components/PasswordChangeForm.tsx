import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  isPasswordChangeLoading: boolean;
  passwordChangeError: { message: string; traceId: string | null } | null;
  onPasswordChangeSubmit: (e: FormEvent<HTMLFormElement>) => void;
  cancelPasswordChange: () => void;
};

// Login step: the server requires a new password before continuing (same look as the 2FA step).
// The current password is the one just typed on the login form (kept by the login flow); only the
// new one is asked here, twice.
function PasswordChangeForm({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  isPasswordChangeLoading,
  passwordChangeError,
  onPasswordChangeSubmit,
  cancelPasswordChange,
}: Props) {
  const { t } = useTranslation("auth");
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = !!newPassword && !!confirmPassword && !mismatch && !isPasswordChangeLoading;

  return (
    <>
      <h1 className="h3 fw-bold mb-1">{t("passwordChange.title")}</h1>
      <p className="text-body-secondary mb-4">{t("passwordChange.intro")}</p>

      <form onSubmit={onPasswordChangeSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="newPassword" className="form-label">
            {t("passwordChange.newPassword")}
          </label>
          <input
            type="password"
            className="form-control"
            id="newPassword"
            value={newPassword}
            autoComplete="new-password"
            autoFocus
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label">
            {t("passwordChange.confirmPassword")}
          </label>
          <input
            type="password"
            className={`form-control ${mismatch ? "is-invalid" : ""}`}
            id="confirmPassword"
            value={confirmPassword}
            autoComplete="new-password"
            aria-invalid={mismatch || undefined}
            aria-describedby={mismatch ? "confirmPassword-feedback" : undefined}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {mismatch && (
            <div id="confirmPassword-feedback" className="invalid-feedback d-block">
              {t("passwordChange.mismatch")}
            </div>
          )}
        </div>

        {passwordChangeError && (
          <div className="alert alert-danger" role="alert">
            {passwordChangeError.message}
            {passwordChangeError.traceId && (
              <details className="small mt-2">
                <summary>{t("passwordChange.details")}</summary>
                {t("passwordChange.reference")} <code>{passwordChangeError.traceId}</code>
              </details>
            )}
          </div>
        )}

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            {isPasswordChangeLoading ? t("passwordChange.saving") : t("passwordChange.submit")}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={isPasswordChangeLoading}
            onClick={cancelPasswordChange}
          >
            {t("passwordChange.backToLogin")}
          </button>
        </div>
      </form>
    </>
  );
}

export default PasswordChangeForm;
