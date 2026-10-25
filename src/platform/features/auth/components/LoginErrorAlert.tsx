import { useTranslation } from "react-i18next";

type Props = {
  errorMessage: string | null;
  backCountdown: number | null;
};

function LoginErrorAlert({ errorMessage, backCountdown }: Props) {
  const { t } = useTranslation("auth");
  if (!errorMessage) return null;

  return (
    <div className="alert alert-danger mt-4" role="alert">
      {errorMessage}

      {backCountdown !== null && (
        <div className="mt-2">
          {t("login.returningIn", { count: backCountdown })}
        </div>
      )}
    </div>
  );
}

export default LoginErrorAlert;
