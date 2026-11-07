import InputField from "@platform/components/ui/InputField";
import { useFactoringText } from "../factoringText";
import { useFactoringFormat } from "../model/format";
import { advanceOf, isConfirming, totalOf, type Agreement, type Counterparty, type InvoiceRow } from "../model/factoring";
import type { FactoringErrors } from "../model/validation";
import CounterpartyField from "./CounterpartyField";
import type { CounterpartyList } from "./CounterpartySearchModal";

type Props = {
  agreement: Agreement;
  /** Confirming: every invoice is this supplier's (no debtor per invoice) */
  supplier: Counterparty | null;
  /** Factoring: the debtors to choose from */
  debtors: CounterpartyList;
  documents: InvoiceRow[];
  onChange: (index: number, changes: Partial<InvoiceRow>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  errors: FactoringErrors;
};

// The invoices of the request, one card each: number, issue date, due date and amount, plus the
// debtor under factoring. Totals at the bottom: invoices, total, advance and what is available. A
// total above what is available is only pointed out: Accipiens decides.
function DocumentsEditor({ agreement, supplier, debtors, documents, onChange, onAdd, onRemove, errors }: Props) {
  const tx = useFactoringText();
  const { money, percent } = useFactoringFormat();
  const confirming = isConfirming(agreement);
  const { currencyId, availableAmount, advancePercentage } = agreement;
  const total = totalOf(documents);
  const advance = advanceOf(total, advancePercentage);
  const error = (index: number, field: string) => errors[`documents.${index}.${field}`];

  return (
    <div className="d-flex flex-column gap-3">
      {confirming && supplier && (
        <div className="d-flex align-items-center gap-2 small text-body-secondary">
          <i className="bi bi-shop" aria-hidden="true" />
          <span>{tx("invoices.supplierNote", "Confirming: every invoice is from {{name}}.", { name: supplier.name ?? supplier.taxNumber ?? "" })}</span>
        </div>
      )}

      {documents.length === 0 && (
        <div className="app-documents-empty">
          <i className="bi bi-receipt fs-3 d-block mb-2" aria-hidden="true" />
          {tx("invoices.empty", "No invoices yet. Add the first one.")}
        </div>
      )}

      {documents.map((doc, index) => {
        const id = (field: string) => `document-${index}-${field}`;
        const hasErrors = Object.keys(errors).some((key) => key.startsWith(`documents.${index}.`));
        return (
          <section
            key={doc.key}
            className={`app-document-card ${hasErrors ? "has-errors" : ""}`}
            aria-label={tx("invoices.cardLabel", "Invoice {{index}}", { index: index + 1 })}
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="app-document-number" aria-hidden="true">
                {index + 1}
              </span>
              <span className="fw-semibold small flex-grow-1 text-truncate">
                {doc.invoiceNumber.trim() || tx("invoices.new", "New invoice")}
                {doc.amount ? <span className="text-body-secondary fw-normal"> · {money(doc.amount, currencyId)}</span> : null}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-link text-danger p-0"
                aria-label={tx("invoices.remove", "Remove invoice {{index}}", { index: index + 1 })}
                onClick={() => onRemove(index)}
              >
                <i className="bi bi-trash" />
              </button>
            </div>

            <div className="row gx-3">
              {!confirming && (
                <div className="col-12 col-xl-4">
                  <CounterpartyField
                    id={id("debtor")}
                    label={tx("invoices.debtor", "Debtor")}
                    dialogTitle={tx("invoices.debtorDialog", "Debtor of invoice {{index}}", { index: index + 1 })}
                    value={doc.debtor}
                    list={debtors}
                    onChange={(debtor) => onChange(index, { debtor })}
                    invalidMessage={error(index, "debtor")}
                    compact
                  />
                </div>
              )}
              <div className={`col-12 col-sm-6 ${confirming ? "col-xl-3" : "col-xl-2"}`}>
                <InputField
                  id={id("number")}
                  label={tx("invoices.number", "Invoice number")}
                  required
                  placeholder={tx("invoices.numberPlaceholder", "e.g. FT 2026/123")}
                  value={doc.invoiceNumber}
                  onChange={(e) => onChange(index, { invoiceNumber: e.target.value })}
                  invalidMessage={error(index, "invoiceNumber")}
                />
              </div>
              <div className={`col-6 col-sm-3 ${confirming ? "col-xl-3" : "col-xl-2"}`}>
                <InputField
                  id={id("issue")}
                  label={tx("invoices.issueDate", "Issue date")}
                  type="date"
                  required
                  value={doc.issueDate}
                  onChange={(e) => onChange(index, { issueDate: e.target.value })}
                  invalidMessage={error(index, "issueDate")}
                />
              </div>
              <div className={`col-6 col-sm-3 ${confirming ? "col-xl-3" : "col-xl-2"}`}>
                <InputField
                  id={id("due")}
                  label={tx("invoices.dueDate", "Due date")}
                  type="date"
                  required
                  min={doc.issueDate || undefined}
                  value={doc.dueDate}
                  onChange={(e) => onChange(index, { dueDate: e.target.value })}
                  invalidMessage={error(index, "dueDate")}
                />
              </div>
              <div className="col-12 col-sm-6 col-xl-2 flex-xl-grow-1">
                <InputField
                  id={id("amount")}
                  label={tx("invoices.amount", "Amount")}
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  inputGroupSpan={currencyId ?? undefined}
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
          {tx("invoices.add", "Add invoice")}
        </button>
      </div>

      <dl className="app-documents-totals" aria-label={tx("invoices.totals", "Totals")}>
        <div>
          <dt>{tx("invoices.count", "Invoices")}</dt>
          <dd>{documents.length}</dd>
        </div>
        <div>
          <dt>{tx("invoices.total", "Total")}</dt>
          <dd>{money(total, currencyId)}</dd>
        </div>
        {advance !== null && (
          <div>
            <dt>{tx("invoices.advance", "Advance ({{percent}})", { percent: percent(advancePercentage) ?? "" })}</dt>
            <dd>{money(advance, currencyId)}</dd>
          </div>
        )}
        <div>
          <dt>{tx("invoices.available", "Available")}</dt>
          {availableAmount === null || availableAmount === undefined ? (
            <dd className="text-body-secondary">{tx("common.unavailable", "Unavailable")}</dd>
          ) : (
            <dd className={total > availableAmount ? "text-danger" : ""}>{money(availableAmount, currencyId)}</dd>
          )}
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
