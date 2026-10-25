import { useState } from "react";
import type { Entity } from "../model/factoring";
import EntitySearchModal from "./EntitySearchModal";

type Props = {
  id: string;
  label: string;
  /** Title of the search dialog, e.g. "Select the debtor" */
  dialogTitle: string;
  value: Entity | null;
  onChange: (entity: Entity) => void;
  invalidMessage?: string | null;
  /** Smaller, for a row of fields */
  compact?: boolean;
};

// A company chosen through the search dialog: shows the choice (name and tax number) and a button
// to search for one or change it.
function EntityField({ id, label, dialogTitle, value, onChange, invalidMessage, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const feedbackId = `${id}-feedback`;

  return (
    <div className="mb-3">
      <span className="form-label d-block" id={`${id}-label`}>
        {label}
        <span className="text-danger ms-1">*</span>
      </span>
      <button
        type="button"
        id={id}
        className={`app-entity-field ${compact ? "is-compact" : ""} ${invalidMessage ? "is-invalid" : ""}`}
        aria-labelledby={`${id}-label ${id}`}
        aria-describedby={invalidMessage ? feedbackId : undefined}
        aria-invalid={invalidMessage ? true : undefined}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {value ? (
          <span className="min-w-0 flex-grow-1 text-start">
            <span className="d-block fw-semibold text-truncate">{value.name}</span>
            {!compact && <span className="d-block small text-body-secondary">Tax no. {value.taxNumber}</span>}
          </span>
        ) : (
          <span className="flex-grow-1 text-start text-body-secondary">Search…</span>
        )}
        <span className="app-entity-field-action">
          <i className="bi bi-search" aria-hidden="true" />
          <span className={compact ? "visually-hidden" : "ms-2"}>{value ? "Change" : "Search"}</span>
        </span>
      </button>
      {invalidMessage && (
        <div id={feedbackId} className="invalid-feedback d-block">
          {invalidMessage}
        </div>
      )}

      {open && (
        <EntitySearchModal
          title={dialogTitle}
          selectedId={value?.id}
          onClose={() => setOpen(false)}
          onSelect={(entity) => {
            onChange(entity);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default EntityField;
