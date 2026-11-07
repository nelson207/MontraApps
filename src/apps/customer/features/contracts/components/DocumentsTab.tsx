import { useState } from "react";
import Pagination from "@platform/components/ui/Pagination";
import { useGetDocumentsQuery } from "../api/contractsApi";
import { formatDate, formatMoney, joined, type ContractCard, type InvoiceDocument } from "../model/contracts";
import DocumentModal from "./DocumentModal";
import DocumentStatusBadge from "./DocumentStatusBadge";
import { usePdfDownload } from "./usePdfDownload";

const PAGE_SIZE = 10;

// The contract's invoiced documents, a page at a time: open one in detail, or download its PDF.
function DocumentsTab({ contract }: { contract: ContractCard }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useGetDocumentsQuery({ contractId: contract.id, page, pageSize: PAGE_SIZE });
  const [open, setOpen] = useState<InvoiceDocument | null>(null);
  const pdf = usePdfDownload();

  if (isError)
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2 mb-0" role="alert">
        <span className="flex-grow-1">The documents couldn't be loaded.</span>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );

  if (isLoading || !data)
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );

  if (data.totalCount === 0) return <p className="text-body-secondary text-center py-5 mb-0">No documents yet.</p>;

  const pageCount = Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE));

  return (
    <>
      {pdf.error && (
        <div className="alert alert-danger py-2" role="alert">
          {pdf.error}
        </div>
      )}
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr className="small text-body-secondary">
              <th scope="col">Document</th>
              <th scope="col" className="d-none d-md-table-cell">Issued</th>
              <th scope="col" className="d-none d-sm-table-cell">Due</th>
              <th scope="col" className="text-end">Total</th>
              <th scope="col">Status</th>
              <th scope="col" className="text-end">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <button type="button" className="btn btn-link p-0 fw-semibold text-start text-decoration-none" onClick={() => setOpen(doc)}>
                    {doc.number}
                  </button>
                  <div className="small text-body-secondary">{joined(doc.typeName, doc.description)}</div>
                </td>
                <td className="d-none d-md-table-cell small text-nowrap">{doc.issueDate ? formatDate(doc.issueDate) : "—"}</td>
                <td className="d-none d-sm-table-cell small text-nowrap">{doc.dueDate ? formatDate(doc.dueDate) : "—"}</td>
                <td className="text-end app-tabular text-nowrap">{formatMoney(doc.total, doc.currency)}</td>
                <td>
                  <DocumentStatusBadge status={doc.status} />
                </td>
                <td className="text-end text-nowrap">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    aria-label={`View ${doc.number}`}
                    title="View"
                    onClick={() => setOpen(doc)}
                  >
                    <i className="bi bi-eye" aria-hidden="true" />
                  </button>
                  {doc.hasPdf && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary ms-1"
                      aria-label={`Download ${doc.number} as PDF`}
                      title="Download PDF"
                      disabled={pdf.loadingId === doc.id}
                      onClick={() => pdf.download(doc)}
                    >
                      {pdf.loadingId === doc.id ? (
                        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                      ) : (
                        <i className="bi bi-file-earmark-pdf" aria-hidden="true" />
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
        <span className="small text-body-secondary">
          {data.totalCount} {data.totalCount === 1 ? "document" : "documents"}
        </span>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} ariaLabel="Documents pages" />
      </div>

      {open && <DocumentModal document={open} contractNumber={contract.number} onClose={() => setOpen(null)} />}
    </>
  );
}

export default DocumentsTab;
