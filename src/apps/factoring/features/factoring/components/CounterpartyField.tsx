import { useState } from "react";
import { useFactoringText } from "../factoringText";
import type { Counterparty } from "../model/factoring";
import CounterpartySearchModal, { type CounterpartyList } from "./CounterpartySearchModal";

type Props = {
  id: string;
  label: string;
  /** Title of the search dialog, e.g. "Select the debtor" */
  dialogTitle: string;
  value: Counterparty | null;
  onChange: (counterparty: Counterparty) => void;
  list: CounterpartyList;
  invalidMessage?: string | null;
  /** Smaller, for a row of fields */
  compact?: boolean;
};

// A debtor or supplier chosen through the search dialog: shows the choice (name and tax number) and
// a button to search for one or change it.
function CounterpartyField({ id, label, dialogTitle, value, onChange, list, invalidMessage, compact = false }: Props) {
  const tx = useFactoringText();
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
            <span className="d-block fw-semibold text-truncate">{value.name ?? value.taxNumber ?? tx("common.unavailable", "Unavailable")}</span>
            {!compact && value.name && value.taxNumber && <span className="d-block small text-body-secondary">{tx("counterparty.taxNumberOf", "Tax no. {{number}}", { number: value.taxNumber })}</span>}
          </span>
        ) : (
          <span className="flex-grow-1 text-start text-body-secondary">{tx("counterparty.searchPrompt", "Search…")}</span>
        )}
        <span className="app-entity-field-action">
          <i className="bi bi-search" aria-hidden="true" />
          <span className={compact ? "visually-hidden" : "ms-2"}>{value ? tx("counterparty.change", "Change") : tx("counterparty.search", "Search")}</span>
        </span>
      </button>
      {invalidMessage && (
        <div id={feedbackId} className="invalid-feedback d-block">
          {invalidMessage}
        </div>
      )}

      {open && (
        <CounterpartySearchModal
          title={dialogTitle}
          selectedId={value?.interventionId}
          list={list}
          onClose={() => setOpen(false)}
          onSelect={(counterparty) => {
            onChange(counterparty);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default CounterpartyField;
