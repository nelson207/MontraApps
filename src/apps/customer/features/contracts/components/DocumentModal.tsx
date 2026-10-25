import { useEffect, useRef } from "react";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
  formatDate,
  formatEuro,
  type Contract,
  type InvoiceDocument,
} from "../model/contracts";
import DocumentStatusBadge from "./DocumentStatusBadge";
import { usePdfDownload } from "./usePdfDownload";

type Props = {
  contract: Contract;
  document: InvoiceDocument;
  onClose: () => void;
};

// One invoiced document in detail: dates, status, its lines with VAT, the totals, and its PDF.
// Focus moves in on open and back on close; Esc closes; page scroll is locked.
function DocumentModal({ contract, document, onClose }: Props) {
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

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby="document-title">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div ref={dialogRef} className="modal-content border-0 shadow-lg">
            <div className="modal-header">
              <div className="min-w-0">
                <div className="small text-body-secondary">{DOCUMENT_TYPE_LABELS[document.type]}</div>
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
                  <dd className="fw-semibold mb-0">{formatDate(document.issueDate)}</dd>
                </div>
                <div className="col-6 col-md-3 mb-2">
                  <dt className="fw-normal text-body-secondary">Due</dt>
                  <dd className="fw-semibold mb-0">{formatDate(document.dueDate)}</dd>
                </div>
                <div className="col-6 col-md-3 mb-2">
                  <dt className="fw-normal text-body-secondary">Contract</dt>
                  <dd className="fw-semibold mb-0">{contract.number}</dd>
                </div>
                <div className="col-6 col-md-3 mb-2">
                  <dt className="fw-normal text-body-secondary">Status</dt>
                  <dd className="mb-0">
                    <DocumentStatusBadge status={document.status} />
                  </dd>
                </div>
              </dl>

              <h3 className="h6">{document.description}</h3>
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
                    {document.lines.map((line) => (
                      <tr key={line.description}>
                        <td>{line.description}</td>
                        <td className="text-end small text-body-secondary">{line.taxRate ? `${line.taxRate}%` : "Exempt"}</td>
                        <td className="text-end app-tabular">{formatEuro(line.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="small">
                    <tr>
                      <td colSpan={2} className="text-end text-body-secondary border-0 pt-3">
                        Net
                      </td>
                      <td className="text-end app-tabular border-0 pt-3">{formatEuro(document.net)}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="text-end text-body-secondary border-0">
                        VAT
                      </td>
                      <td className="text-end app-tabular border-0">{formatEuro(document.tax)}</td>
                    </tr>
                    <tr className="fs-6">
                      <td colSpan={2} className="text-end fw-semibold border-0">
                        Total
                      </td>
                      <td className="text-end fw-bold app-tabular border-0">{formatEuro(document.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {document.status !== "paid" && (
                <p className="small text-body-secondary mt-3 mb-0">
                  <i className="bi bi-info-circle me-1" aria-hidden="true" />
                  {document.status === "overdue"
                    ? "This document is overdue. Late payment interest may apply until it is paid."
                    : `To be collected on ${formatDate(document.dueDate)} (${contract.paymentMethod}).`}
                </p>
              )}
              {pdf.error && (
                <div className="alert alert-danger py-2 mt-3 mb-0" role="alert">
                  {pdf.error}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <span className="me-auto small text-body-secondary">{DOCUMENT_STATUS_LABELS[document.status]}</span>
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={() => pdf.download(contract, document)} disabled={loading}>
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                ) : (
                  <i className="bi bi-file-earmark-pdf me-2" aria-hidden="true" />
                )}
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

export default DocumentModal;
