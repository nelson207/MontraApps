import InputField from "@platform/components/ui/InputField";
import {
  addDays,
  advanceOf,
  availableOf,
  formatEuro,
  totalOf,
  type Entity,
  type FactoringAgreement,
  type FactoringDocument,
} from "../model/factoring";
import type { FactoringErrors } from "../model/validation";
import EntityField from "./EntityField";

type Props = {
  agreement: FactoringAgreement;
  /** Confirming: every invoice is this supplier's (no debtor per invoice) */
  supplier: Entity | null;
  documents: FactoringDocument[];
  onChange: (index: number, changes: Partial<FactoringDocument>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  errors: FactoringErrors;
  today: string;
};

// The invoices of the request, one card each: number, issue date, due date and amount, plus the
// debtor under factoring. Totals at the bottom: invoices, total, advance and what is available.
function DocumentsEditor({ agreement, supplier, documents, onChange, onAdd, onRemove, errors, today }: Props) {
  const confirming = agreement.nature === 1;
  const total = totalOf(documents);
  const lastDueDate = addDays(today, agreement.maxTermDays);
  const error = (index: number, field: string) => errors[`documents.${index}.${field}`];

  return (
    <div className="d-flex flex-column gap-3">
      {confirming && supplier && (
        <div className="d-flex align-items-center gap-2 small text-body-secondary">
          <i className="bi bi-shop" aria-hidden="true" />
          <span>
            Confirming: every invoice is from <span className="fw-semibold text-body">{supplier.name}</span>.
          </span>
        </div>
      )}

      {documents.length === 0 && (
        <div className="app-documents-empty">
          <i className="bi bi-receipt fs-3 d-block mb-2" aria-hidden="true" />
          No invoices yet. Add the first one.
        </div>
      )}

      {documents.map((doc, index) => {
        const id = (field: string) => `document-${index}-${field}`;
        const hasErrors = Object.keys(errors).some((key) => key.startsWith(`documents.${index}.`));
        return (
          <section
            key={doc.key}
            className={`app-document-card ${hasErrors ? "has-errors" : ""}`}
            aria-label={`Invoice ${index + 1}${doc.invoiceNumber ? ` ${doc.invoiceNumber}` : ""}`}
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="app-document-number" aria-hidden="true">
                {index + 1}
              </span>
              <span className="fw-semibold small flex-grow-1 text-truncate">
                {doc.invoiceNumber.trim() || "New invoice"}
                {doc.amount ? <span className="text-body-secondary fw-normal"> · {formatEuro(doc.amount)}</span> : null}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-link text-danger p-0"
                aria-label={`Remove invoice ${index + 1}`}
                onClick={() => onRemove(index)}
              >
                <i className="bi bi-trash" />
              </button>
            </div>

            <div className="row gx-3">
              {!confirming && (
                <div className="col-12 col-xl-4">
                  <EntityField
                    id={id("debtor")}
                    label="Debtor"
                    dialogTitle={`Debtor of invoice ${index + 1}`}
                    value={doc.debtor}
                    onChange={(debtor) => onChange(index, { debtor })}
                    invalidMessage={error(index, "debtor")}
                    compact
                  />
                </div>
              )}
              <div className={`col-12 col-sm-6 ${confirming ? "col-xl-3" : "col-xl-2"}`}>
                <InputField
                  id={id("number")}
                  label="Invoice number"
                  required
                  placeholder="e.g. FT 2026/123"
                  value={doc.invoiceNumber}
                  onChange={(e) => onChange(index, { invoiceNumber: e.target.value })}
                  invalidMessage={error(index, "invoiceNumber")}
                />
              </div>
              <div className={`col-6 col-sm-3 ${confirming ? "col-xl-3" : "col-xl-2"}`}>
                <InputField
                  id={id("issue")}
                  label="Issue date"
                  type="date"
                  required
                  max={today}
                  value={doc.issueDate}
                  onChange={(e) => onChange(index, { issueDate: e.target.value })}
                  invalidMessage={error(index, "issueDate")}
                />
              </div>
              <div className={`col-6 col-sm-3 ${confirming ? "col-xl-3" : "col-xl-2"}`}>
                <InputField
                  id={id("due")}
                  label="Due date"
                  type="date"
                  required
                  min={doc.issueDate || today}
                  max={lastDueDate}
                  value={doc.dueDate}
                  onChange={(e) => onChange(index, { dueDate: e.target.value })}
                  invalidMessage={error(index, "dueDate")}
                />
              </div>
              <div className="col-12 col-sm-6 col-xl-2 flex-xl-grow-1">
                <InputField
                  id={id("amount")}
                  label="Amount"
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  inputGroupSpan="€"
                  value={doc.amount ?? ""}
                  onChange={(e) => onChange(index, { amount: e.target.value === "" ? null : Number(e.target.value) })}
                  invalidMessage={error(index, "amount")}
                />
              </div>
            </div>
          </section>
        );
      })}

      <div>
        <button type="button" className="btn btn-outline-primary" onClick={onAdd}>
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Add invoice
        </button>
      </div>

      <dl className="app-documents-totals" aria-label="Totals">
        <div>
          <dt>Invoices</dt>
          <dd>{documents.length}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{formatEuro(total)}</dd>
        </div>
        <div>
          <dt>Advance ({agreement.advancePercent}%)</dt>
          <dd>{formatEuro(advanceOf(total, agreement))}</dd>
        </div>
        <div>
          <dt>Available</dt>
          <dd className={total > availableOf(agreement) ? "text-danger" : ""}>{formatEuro(availableOf(agreement))}</dd>
        </div>
      </dl>
      {errors.documents && (
        <div className="alert alert-danger py-2 mb-0" role="alert">
          {errors.documents}
        </div>
      )}
    </div>
  );
}

export default DocumentsEditor;
