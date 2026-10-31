import { PROBLEM, problemCode, problemMessage } from "@platform/api/problemCode";
import type { Choice } from "./choices";

// Small pieces shared by the sections of Settings → Application.

/** 403 settings_forbidden: the catalog and saving are for administrators only; retrying won't help */
const isSettingsForbidden =(error: unknown) => problemCode(error) === PROBLEM.settingsForbidden;

export function LoadError({ error, text, onRetry }: { error: unknown; text: string; onRetry: () => void }) {
  return (
    <div className="small text-danger d-flex flex-wrap gap-2" role="alert">
      {problemMessage(error) ?? text}
      {!isSettingsForbidden(error) && (
        <button type="button" className="btn btn-link btn-sm p-0" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

/** A choice's label, greyed and tagged when it's expired or unknown to the catalog */
export function ChoiceLabel({ choice }: { choice: Choice }) {
  const tag = choice.expired ? "Expired" : choice.unknown ? "Not in the catalog" : null;
  return (
    <span className={tag ? "text-body-secondary" : undefined}>
      {choice.label}
      {tag && <span className="badge rounded-pill bg-body-secondary text-body-secondary fw-normal ms-2">{tag}</span>}
    </span>
  );
}

export function Loading({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="small text-body-secondary">
      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
      {text}
    </div>
  );
}

/** "Select all" / "Clear" for a list of checkboxes */
export function AllOrNone({ label, onAll, onNone }: { label: string; onAll: () => void; onNone: () => void }) {
  return (
    <span className="d-inline-flex gap-2 small">
      <button type="button" className="btn btn-link btn-sm p-0" onClick={onAll} aria-label={`Select all ${label}`}>
        Select all
      </button>
      <span className="text-body-tertiary" aria-hidden="true">
        ·
      </span>
      <button type="button" className="btn btn-link btn-sm p-0" onClick={onNone} aria-label={`Clear ${label}`}>
        Clear
      </button>
    </span>
  );
}

/** A section's title, what it does, and an optional warning when nothing is offered */
export function SectionHeader({ title, help, warning }: { title: string; help: string; warning?: string | null }) {
  return (
    <div className="mb-3">
      <h3 className="h6 fw-semibold mb-1">{title}</h3>
      <p className="small text-body-secondary mb-0">{help}</p>
      {warning && (
        <div className="alert alert-warning small py-2 px-3 mt-2 mb-0 d-flex gap-2" role="status">
          <i className="bi bi-exclamation-triangle" aria-hidden="true" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
}
