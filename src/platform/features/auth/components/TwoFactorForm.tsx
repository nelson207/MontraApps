import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation(["auth", "common"]);
  return (
    <>
      <h1 className="h3 fw-bold mb-1">{t("twoFactor.title")}</h1>
      <p className="text-body-secondary mb-4">{t("twoFactor.intro")}</p>

      <form onSubmit={onOtpSubmit}>
        <div className="mb-3">
          <label htmlFor="otpCode" className="form-label">
            {t("twoFactor.code")}
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
            {isOtpLoading ? t("twoFactor.verifying") : t("twoFactor.verify")}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={isLoading}
            onClick={resetTwoFactor}
          >
            {backCountdown !== null ? t("twoFactor.backIn", { count: backCountdown }) : t("common:back")}
          </button>
        </div>
      </form>
    </>
  );
}

export default TwoFactorForm;
