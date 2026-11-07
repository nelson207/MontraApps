import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type BarProps = {
  /** Left out on the first step */
  onBack?: () => void;
  backDisabled?: boolean;
  /** The last result, beside Back */
  status?: ReactNode;
  /** Something above the bar */
  sheet?: ReactNode;
  /** Next, or the last step's final action */
  children: ReactNode;
};

// A wizard's actions, fixed at the bottom of the screen: Back · a result · Next, or on the last step
// the final action. The page around it has app-has-wizard-bar, so nothing stays behind it.
function WizardBar({ onBack, backDisabled, status, sheet, children }: BarProps) {
  const { t } = useTranslation();
  return (
    <div className="app-wizard-bar">
      {sheet}

      {onBack && (
        <button type="button" className="btn btn-ghost" onClick={onBack} disabled={backDisabled}>
          <i className="bi bi-arrow-left me-1" aria-hidden="true" />
          {t("wizard.back", { defaultValue: "Back" })}
        </button>
      )}

      {status && <div className="app-wizard-bar-status">{status}</div>}

      <div className="app-wizard-bar-actions">{children}</div>
    </div>
  );
}

type NextProps = {
  onClick: () => void;
  /** Only while something is running: invalid data is what Next says, it never turns it off */
  disabled?: boolean;
  /** It waits for something: it doesn't lead, but still answers a click */
  blocked?: boolean;
};

export function WizardNextButton({ onClick, disabled, blocked }: NextProps) {
  const { t } = useTranslation();
  return (
    <button type="button" className={`btn ${blocked ? "btn-outline-primary" : "btn-primary"}`} onClick={onClick} disabled={disabled}>
      {t("wizard.next", { defaultValue: "Next" })}
      <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
    </button>
  );
}

export default WizardBar;
