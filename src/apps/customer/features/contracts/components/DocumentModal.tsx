import { useEffect, useRef } from "react";
import { useGetDocumentQuery } from "../api/contractsApi";
import { DOCUMENT_STATUS_LABELS, formatDate, formatMoney, type InvoiceDocument, type InvoiceLine } from "../model/contracts";
import DocumentStatusBadge from "./DocumentStatusBadge";
import { usePdfDownload } from "./usePdfDownload";

type Props = {
  /** The list's row: shown at once, while its lines load */
  document: InvoiceDocument;
  contractNumber: number;
  onClose: () => void;
};

const vatOf = (line: InvoiceLine) => (line.isExempt ? "Exempt" : line.taxRate != null ? `${line.taxRate}%` : "—");

// One invoiced document in detail: dates, status, its lines with VAT, the totals, and its PDF.
// Focus moves in on open and back on close; Esc closes; page scroll is locked.
function DocumentModal({ document, contractNumber, onClose }: Props) {
  const { data: detail, isError, refetch } = useGetDocumentQuery(document.id);
  const pdf = usePdfDownload();
  const dialogRef = useRef<HTMLDivElement>(null);
  // Latest onClose without re-running the setup (parents pass a new function each render)
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previouslyFocused = window.document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>(".btn-close")?.focus();
    window.document.body.classList.add("overflow-hidden");
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    window.document.addEventListener("keydown", onKeyDown);
    return () => {
      window.document.removeEventListener("keydown", onKeyDown);
      window.document.body.classList.remove("overflow-hidden");
      previouslyFocused?.focus();
    };
  }, []);

  const loading = pdf.loadingId === document.id;
  const money = (value: number) => formatMoney(value, document.currency);

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby="document-title">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div ref={dialogRef} className="modal-content border-0 shadow-lg">
            <div className="modal-header">
              <div className="min-w-0">
                <div className="small text-body-secondary">{document.typeName}</div>
                <h2 id="document-title" className="modal-title h5 text-truncate">
                  {document.number}
                </h2>
              </div>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>

            <div className="modal-body">
              <dl className="row small mb-4">
                <div className="col-6 col-md-3 mb-2">
                  <dt className="fw-normal text-body-secondary">Issued</dt>
                  <dd className="fw-semibold mb-0">{document.issueDate ? formatDate(document.issueDate) : "—"}</dd>
                </div>
                <div className="col-6 col-md-3 mb-2">
                  <dt className="fw-normal text-body-secondary">Due</dt>
                  <dd className="fw-semibold mb-0">{document.dueDate ? formatDate(document.dueDate) : "—"}</dd>
                </div>
                <div className="col-6 col-md-3 mb-2">
                  <dt className="fw-normal text-body-secondary">Contract</dt>
                  <dd className="fw-semibold mb-0">{contractNumber}</dd>
                </div>
                <div className="col-6 col-md-3 mb-2">
                  <dt className="fw-normal text-body-secondary">Status</dt>
                  <dd className="mb-0">
                    <DocumentStatusBadge status={document.status} />
                  </dd>
                </div>
              </dl>

              <h3 className="h6">{document.description}</h3>
              {isError && (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-0" role="alert">
                  <span className="flex-grow-1">The document's lines couldn't be loaded.</span>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => refetch()}>
                    Retry
                  </button>
                </div>
              )}
              {!isError && !detail && (
                <div className="d-flex justify-content-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading…</span>
                  </div>
                </div>
              )}
              {!isError && detail && (
                <>
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr className="small text-body-secondary">
                          <th scope="col">Description</th>
                          <th scope="col" className="text-end">
                            VAT
                          </th>
                          <th scope="col" className="text-end">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.lines.map((line, i) => (
                          <tr key={i}>
                            <td>{line.description}</td>
                            <td className="text-end small text-body-secondary">{vatOf(line)}</td>
                            <td className="text-end app-tabular">{money(line.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="small">
                        <tr>
                          <td colSpan={2} className="text-end text-body-secondary border-0 pt-3">
                            Net
                          </td>
                          <td className="text-end app-tabular border-0 pt-3">{money(detail.net)}</td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="text-end text-body-secondary border-0">
                            VAT
                          </td>
                          <td className="text-end app-tabular border-0">{money(detail.tax)}</td>
                        </tr>
                        <tr className="fs-6">
                          <td colSpan={2} className="text-end fw-semibold border-0">
                            Total
                          </td>
                          <td className="text-end fw-bold app-tabular border-0">{money(detail.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {detail.status !== "paid" && (
                    <p className="small text-body-secondary mt-3 mb-0">
                      <i className="bi bi-info-circle me-1" aria-hidden="true" />
                      {detail.status === "overdue"
                        ? "This document is overdue. Late payment interest may apply until it is paid."
                        : `To be collected${detail.dueDate ? ` on ${formatDate(detail.dueDate)}` : ""}${detail.paymentMethod ? ` (${detail.paymentMethod})` : ""}.`}
                    </p>
                  )}
                </>
              )}
              {pdf.error && (
                <div className="alert alert-danger py-2 mt-3 mb-0" role="alert">
                  {pdf.error}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <span className="me-auto small text-body-secondary">{DOCUMENT_STATUS_LABELS[document.status]}</span>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
              {document.hasPdf && (
                <button type="button" className="btn btn-primary" onClick={() => pdf.download(document)} disabled={loading}>
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                  ) : (
                    <i className="bi bi-file-earmark-pdf me-2" aria-hidden="true" />
                  )}
                  Download PDF
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

export default DocumentModal;
