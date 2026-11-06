import type { KeyboardEvent } from "react";
import type { Stage } from "../../model/credOperDraft";
import {
  countOf,
  countsLabel,
  messagesBySeverity,
  type MessageSeverity,
  type OperationMessage,
  type SaveOutcome,
} from "../../model/operationMessages";

const ICONS: Record<MessageSeverity, string> = {
  error: "bi-x-octagon-fill text-danger",
  warning: "bi-exclamation-triangle-fill text-warning-emphasis",
  info: "bi-info-circle-fill text-info-emphasis",
};

function MessageItems({ messages, onGoToFinancial }: { messages: OperationMessage[]; onGoToFinancial?: () => void }) {
  return (
    <ul className="app-message-items list-unstyled small mb-0">
      {messages.map(({ text, source }) => (
        <li key={text} className="d-flex flex-wrap justify-content-between column-gap-3">
          <span>{text}</span>
          {source === "calculation" && onGoToFinancial && (
            <button type="button" className="btn btn-link btn-sm p-0 text-nowrap" onClick={onGoToFinancial}>
              Go to Financial data
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

const GroupTitle = ({ severity, label }: { severity: MessageSeverity; label: string }) => (
  <span className="app-message-title fw-semibold small">
    <i className={`bi ${ICONS[severity]} me-2`} aria-hidden="true" />
    <span>{label}</span>
  </span>
);

/** The messages by level: errors and warnings always open, notes collapsed beside them */
export function MessageGroups({ messages, onGoToFinancial }: { messages: OperationMessage[]; onGoToFinancial?: () => void }) {
  const { error, warning, info } = messagesBySeverity(messages);
  return (
    <div className="d-flex flex-column gap-2">
      {error.length > 0 && (
        <div className="app-readiness-step">
          <GroupTitle severity="error" label={`${countOf(error.length, "error")} to fix`} />
          <MessageItems messages={error} onGoToFinancial={onGoToFinancial} />
        </div>
      )}
      {warning.length > 0 && (
        <div className="app-readiness-step">
          <GroupTitle severity="warning" label={`${countOf(warning.length, "warning")} to review`} />
          <MessageItems messages={warning} onGoToFinancial={onGoToFinancial} />
        </div>
      )}
      {info.length > 0 && (
        <details className="app-readiness-step" open={!error.length && !warning.length}>
          <summary>
            <GroupTitle severity="info" label={countOf(info.length, "note")} />
          </summary>
          <MessageItems messages={info} onGoToFinancial={onGoToFinancial} />
        </details>
      )}
    </div>
  );
}

type Action = { label: string; onClick: () => void; busy?: boolean };

type Results = {
  outcome: SaveOutcome;
  /** The operation as the user knows it: "Quotation #1042" */
  title: string;
  stage: Stage;
  /** The operation changed since this save */
  stale: boolean;
};

const STALE_NOTE = "You changed the operation after this save. Save again to update these results.";

/** The colour: the save failed; it worked with something to review; it worked */
const toneOf = ({ saved, messages }: SaveOutcome) =>
  !saved ? "is-failed" : messages.some((m) => m.severity !== "info") ? "is-warned" : "is-ready";

const iconOf = ({ saved }: SaveOutcome) => (saved ? "bi-check-circle-fill" : "bi-x-octagon-fill");

function subtitle({ outcome, stage, failure }: Results & { failure?: string }): string {
  const { error, warning, info } = messagesBySeverity(outcome.messages);
  if (!outcome.saved) {
    if (failure) return failure;
    if (error.length) return `Fix ${countOf(error.length, "error")} and save again. Your changes are still here.`;
    return "The operation couldn't be saved. Your changes are still here.";
  }
  if (warning.length) {
    const review = `Review ${countOf(warning.length, "warning")}`;
    return stage === "quotation" ? `${review} before you convert it to a proposal.` : `${review}.`;
  }
  if (info.length) return `${countOf(info.length, "note")} below.`;
  return stage === "quotation" ? "You can convert it to a proposal." : "Everything is saved.";
}

/**
 * The last save's result, in the action bar: what it answered, and the button that shows or hides
 * its messages. A clean save has nothing to open, and nothing left to say once it's been edited.
 */
export function SaveStatus({
  outcome,
  title,
  stale,
  open,
  onToggle,
}: Results & { open: boolean; onToggle: () => void }) {
  const hasSheet = !outcome.saved || outcome.messages.length > 0;
  if (!hasSheet) {
    if (stale) return null;
    return (
      <span id="save-status" className={`app-save-status ${toneOf(outcome)}`} role="status" tabIndex={-1}>
        <i className={`bi ${iconOf(outcome)}`} aria-hidden="true" />
        {title} saved
      </span>
    );
  }
  const counts = countsLabel(outcome.messages);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && open) onToggle();
  };
  return (
    <button
      type="button"
      id="save-status"
      className={`app-save-status ${toneOf(outcome)}`}
      aria-expanded={open}
      aria-controls={open ? "save-results" : undefined}
      onClick={onToggle}
      onKeyDown={onKeyDown}
    >
      <i className={`bi ${iconOf(outcome)}`} aria-hidden="true" />
      <span>
        {outcome.saved ? "Saved" : "Not saved"}
        {counts && `: ${counts}`}
        {stale && <span className="fw-normal"> (before your latest changes)</span>}
      </span>
      <i className="bi bi-chevron-up app-save-status-chevron" aria-hidden="true" />
    </button>
  );
}

/**
 * The last save's messages, above the action bar. It shows and hides like a modal, but leaves the
 * form usable behind it: that's where the fixes happen.
 */
export function SaveSheet(
  props: Results & {
    /** Why the save failed, when no message says it */
    failure?: string;
    /** What the user can do about the failure (e.g. reopen the operation) */
    action?: Action;
    onGoToFinancial?: () => void;
    onHide: () => void;
  },
) {
  const { outcome, title, stale, action, onGoToFinancial, onHide } = props;
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") onHide();
  };
  return (
    <div
      id="save-results"
      className={`app-save-sheet ${stale ? "is-stale" : ""}`}
      role={outcome.saved ? "status" : "alert"}
      aria-label="Save results"
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <div className={`app-save-sheet-head ${toneOf(outcome)}`}>
        <i className={`bi ${iconOf(outcome)} app-readiness-icon`} aria-hidden="true" />
        <div className="flex-grow-1 min-w-0">
          <div className="fw-semibold">{outcome.saved ? `${title} saved` : "Not saved"}</div>
          <div className="small">{subtitle(props)}</div>
        </div>
        <div className="d-flex flex-wrap justify-content-end gap-2">
          {action && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger text-nowrap"
              onClick={action.onClick}
              disabled={action.busy}
            >
              {action.busy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
              {action.label}
            </button>
          )}
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onHide}>
            Hide
          </button>
        </div>
      </div>
      {(stale || outcome.messages.length > 0) && (
        <div className="app-save-sheet-body">
          {stale && <div className="app-save-results-stale small">{STALE_NOTE}</div>}
          {outcome.messages.length > 0 && <MessageGroups messages={outcome.messages} onGoToFinancial={onGoToFinancial} />}
        </div>
      )}
    </div>
  );
}
