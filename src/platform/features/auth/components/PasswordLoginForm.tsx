import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@app/brand";

type Props = {
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  isLoading: boolean;
  isLoginLoading: boolean;
  onPasswordSubmit: (e: FormEvent<HTMLFormElement>) => void;
  setShowForgotPassword: (value: boolean) => void;
};

function PasswordLoginForm({
  username,
  setUsername,
  password,
  setPassword,
  rememberMe,
  setRememberMe,
  isLoading,
  isLoginLoading,
  onPasswordSubmit,
  setShowForgotPassword,
}: Props) {
  const { t } = useTranslation("auth");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <h1 className="h3 fw-bold mb-1">{t("login.title")}</h1>
      <p className="text-body-secondary mb-4">{t("login.intro", { app: APP_NAME })}</p>

      <form onSubmit={onPasswordSubmit}>
        <div className="mb-3">
          <label htmlFor="loginUsername" className="form-label">
            {t("login.username")}
          </label>
          <div className="input-group">
            <span className="input-group-text" aria-hidden="true">
              <i className="bi bi-person" />
            </span>
            <input
              type="text"
              className="form-control"
              id="loginUsername"
              value={username}
              autoComplete="username"
              autoFocus
              required
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="loginPassword" className="form-label">
            {t("login.password")}
          </label>
          <div className="input-group">
            <span className="input-group-text" aria-hidden="true">
              <i className="bi bi-lock" />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              id="loginPassword"
              value={password}
              autoComplete="current-password"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
              onClick={() => setShowPassword((v) => !v)}
            >
              <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} />
            </button>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="loginRememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="loginRememberMe">
              {t("login.rememberMe")}
            </label>
          </div>

          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none"
            onClick={() => setShowForgotPassword(true)}
          >
            {t("login.forgotPassword")}
          </button>
        </div>

        <button type="submit" className="btn btn-primary btn-lg w-100" disabled={isLoading}>
          {isLoginLoading && (
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          )}
          {isLoginLoading ? t("login.signingIn") : t("login.signIn")}
        </button>
      </form>
    </>
  );
}

export default PasswordLoginForm;
