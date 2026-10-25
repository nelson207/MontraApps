import { useTranslation } from "react-i18next";

// Shown at start while the session is restored (refresh cookie or another tab), instead of
// flashing the login page or the app.
function SessionRestoring() {
  const { t } = useTranslation("auth");
  return (
    <div className="d-flex min-vh-100 align-items-center justify-content-center bg-body" role="status">
      <span className="spinner-border spinner-border-sm text-primary me-2" aria-hidden="true" />
      <span className="text-body-secondary small">{t("login.restoring")}</span>
    </div>
  );
}

export default SessionRestoring;
