import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";

type Props = {
  isFirst: boolean;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
  isSaving: boolean;
  /** Quotation summary only */
  showConvert: boolean;
  canConvert: boolean;
  onConvert: () => void;
  isConverting: boolean;
  convertHint?: string;
  error: unknown;
};

const spinner = <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />;

// Bottom bar of the step card: Back · Next, and on the last step (Summary) Save · (Convert to proposal).
function WizardActions(props: Props) {
  const busy = props.isSaving || props.isConverting;
  return (
    <div className="d-flex flex-column gap-2">
      {!!props.error && (
        <div className="alert alert-danger d-flex gap-2 mb-0 py-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span>{getApiErrorMessage(props.error) ?? "Something went wrong. Please try again."}</span>
        </div>
      )}

      <div className="d-flex flex-wrap align-items-center gap-2">
        {!props.isFirst && (
          <button type="button" className="btn btn-outline-secondary" onClick={props.onBack} disabled={busy}>
            <i className="bi bi-arrow-left me-1" aria-hidden="true" />
            Back
          </button>
        )}

        <div className="ms-auto d-flex flex-wrap gap-2">
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

          {!props.isLast && (
            <button type="button" className="btn btn-primary" onClick={props.onNext} disabled={busy}>
              Next
              <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
            </button>
          )}

          {props.showConvert && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={props.onConvert}
              disabled={busy || !props.canConvert}
              title={!props.canConvert ? props.convertHint : undefined}
            >
              {props.isConverting && spinner}
              {props.isConverting ? "Converting…" : "Convert to proposal"}
            </button>
          )}
        </div>
      </div>

      {props.showConvert && !props.canConvert && props.convertHint && (
        <small className="text-body-secondary text-end">{props.convertHint}</small>
      )}
    </div>
  );
}

export default WizardActions;
