import type { ReactNode } from "react";
import WizardBar, { WizardNextButton } from "@platform/components/wizard/WizardBar";

type Props = {
  isFirst: boolean;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
  /** Next waits for something (e.g. the operation must be calculated first): it doesn't lead, but still answers a click */
  nextBlocked?: boolean;
  /** Why Next doesn't move on yet */
  nextHint?: string;
  onSave: () => void;
  isSaving: boolean;
  /** Quotation summary only */
  showConvert: boolean;
  canConvert: boolean;
  onConvert: () => void;
  isConverting: boolean;
  convertHint?: string;
  /** The last save's result */
  status?: ReactNode;
  /** The last save's messages, above the bar */
  sheet?: ReactNode;
};

const spinner = <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />;

// The wizard's actions, fixed at the bottom of the screen: Back · the last save's result · Next, and
// on the last step (Summary) Save · (Convert to proposal).
function WizardActions(props: Props) {
  const busy = props.isSaving || props.isConverting;
  return (
    <WizardBar
      onBack={props.isFirst ? undefined : props.onBack}
      backDisabled={busy}
      status={props.status}
      sheet={props.sheet}
    >
        {!props.isLast && props.nextHint && (
          <small className="app-wizard-bar-hint text-warning-emphasis" role="status">
            <i className="bi bi-calculator me-1" aria-hidden="true" />
            {props.nextHint}
          </small>
        )}

        {props.showConvert && !props.canConvert && props.convertHint && (
          <small className="app-wizard-bar-hint text-body-secondary">{props.convertHint}</small>
        )}

        {props.isLast && (
          <button
            type="button"
            className={props.showConvert ? "btn btn-outline-primary" : "btn btn-primary"}
            onClick={props.onSave}
            disabled={busy}
          >
            {props.isSaving && spinner}
            {props.isSaving ? "Saving…" : "Save"}
          </button>
        )}

        {!props.isLast && <WizardNextButton onClick={props.onNext} disabled={busy} blocked={props.nextBlocked} />}

        {props.showConvert && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={props.onConvert}
            disabled={busy || !props.canConvert}
            title={!props.canConvert ? props.convertHint : undefined}
            // Shorter on a phone, the same for a screen reader
            aria-label={props.isConverting ? undefined : "Convert to proposal"}
          >
            {props.isConverting && spinner}
            {props.isConverting ? (
              "Converting…"
            ) : (
              <>
                Convert<span className="d-none d-sm-inline"> to proposal</span>
              </>
            )}
          </button>
        )}
    </WizardBar>
  );
}

export default WizardActions;
