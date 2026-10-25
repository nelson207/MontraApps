import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  forgotEmail: string;
  setForgotEmail: (value: string) => void;
  forgotLogin: string;
  setForgotLogin: (value: string) => void;
  forgotSuccessMessage: string | null;
  isForgotPasswordLoading: boolean;
  onForgotPasswordSubmit: (e: FormEvent<HTMLFormElement>) => void;
  setShowForgotPassword: (value: boolean) => void;
};

function ForgotPasswordForm({
  forgotEmail,
  setForgotEmail,
  forgotLogin,
  setForgotLogin,
  forgotSuccessMessage,
  isForgotPasswordLoading,
  onForgotPasswordSubmit,
  setShowForgotPassword,
}: Props) {
  const { t } = useTranslation(["auth", "common"]);
  return (
    <>
      <h1 className="h3 fw-bold mb-1">{t("forgot.title")}</h1>
      <p className="text-body-secondary mb-4">{t("forgot.intro")}</p>

      <form onSubmit={onForgotPasswordSubmit}>
        <div className="mb-3">
          <label htmlFor="forgotEmail" className="form-label">
            {t("login.username")}
          </label>
          <input
            type="text"
            className="form-control"
            id="forgotUsername"
            value={forgotLogin}
            onChange={(e) => setForgotLogin(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="forgotEmail" className="form-label">
            {t("forgot.email")}
          </label>
          <input
            type="email"
            className="form-control"
            id="forgotEmail"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            required
          />
        </div>

        <div className="d-flex gap-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isForgotPasswordLoading}
          >
            {isForgotPasswordLoading ? t("forgot.sending") : t("forgot.send")}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={isForgotPasswordLoading}
            onClick={() => setShowForgotPassword(false)}
          >
            {t("common:back")}
          </button>
        </div>
      </form>

      {forgotSuccessMessage && (
        <div
          className="alert alert-success mt-4 text-pre-line"
          role="alert"
        >
          {forgotSuccessMessage}
        </div>
      )}
    </>
  );
}

export default ForgotPasswordForm;
