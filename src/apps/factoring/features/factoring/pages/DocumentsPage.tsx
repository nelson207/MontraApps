import { useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "@platform/components/ui/Pagination";
import { useWorkContext } from "@platform/features/workContext/hooks/useWorkContext";
import { STATUS_LABELS, useGetFactoringDocumentsQuery, type DocumentStatus } from "../api/factoringApi";
import { formatEuro, NATURE_LABELS, type AgreementNature } from "../model/factoring";

const PAGE_SIZE = 10;

const STATUS_BADGES: Record<DocumentStatus, string> = {
  submitted: "bg-secondary-subtle text-secondary-emphasis border-secondary-subtle",
  approved: "bg-info-subtle text-info-emphasis border-info-subtle",
  financed: "bg-primary-subtle text-primary-emphasis border-primary-subtle",
  paid: "bg-success-subtle text-success-emphasis border-success-subtle",
  overdue: "bg-danger-subtle text-danger-emphasis border-danger-subtle",
};

const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// The credit intermediary's financed invoices (working context), searchable by invoice, request,
// debtor / supplier or tax number, and filtered by agreement type and status.
function DocumentsPage() {
  const { selection } = useWorkContext();
  const intermediaryId = selection?.organization?.id;
  const { data, isLoading, isFetching, isError } = useGetFactoringDocumentsQuery(intermediaryId ?? "", { skip: !intermediaryId });
  const [search, setSearch] = useState("");
  const [nature, setNature] = useState<"" | `${AgreementNature}`>("");
  const [status, setStatus] = useState<DocumentStatus | "">("");
  const [page, setPage] = useState(1);

  const words = normalize(search).split(/\s+/).filter(Boolean);
  const documents = (data ?? []).filter((d) => {
    if (status && d.status !== status) return false;
    if (nature && String(d.nature) !== nature) return false;
    const text = normalize([d.invoiceNumber, d.reference, d.entity.name, d.entity.taxNumber, d.agreementNumber].join(" "));
    return words.every((w) => text.includes(w));
  });
  const pageCount = Math.max(1, Math.ceil(documents.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = documents.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const outstanding = documents.reduce((sum, d) => sum + (d.status === "paid" ? 0 : d.amount), 0);

  const filter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-3 p-lg-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div>
            <h2 className="h5 mb-0">Documents</h2>
            <span className="small text-body-secondary">{selection?.organization?.name}</span>
          </div>
          <Link to="/factoring/new" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            New request
          </Link>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-12 col-lg-6">
            <label htmlFor="documents-search" className="visually-hidden">
              Search
            </label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search" aria-hidden="true" />
              </span>
              <input
                id="documents-search"
                type="search"
                className="form-control"
                placeholder="Invoice, request, debtor / supplier or tax number"
                value={search}
                onChange={(e) => filter(setSearch)(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <label htmlFor="documents-nature" className="visually-hidden">
              Agreement type
            </label>
            <select
              id="documents-nature"
              className="form-select"
              value={nature}
              onChange={(e) => filter(setNature)(e.target.value as typeof nature)}
            >
              <option value="">Factoring and confirming</option>
              {([0, 1] as AgreementNature[]).map((n) => (
                <option key={n} value={n}>
                  {NATURE_LABELS[n]}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-lg-3">
            <label htmlFor="documents-status" className="visually-hidden">
              Status
            </label>
            <select
              id="documents-status"
              className="form-select"
              value={status}
              onChange={(e) => filter(setStatus)(e.target.value as DocumentStatus | "")}
            >
              <option value="">All statuses</option>
              {(Object.keys(STATUS_LABELS) as DocumentStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isError ? (
          <div className="alert alert-danger mb-0" role="alert">
            The documents couldn't be loaded. Try again in a moment.
          </div>
        ) : isLoading || !intermediaryId ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          </div>
        ) : (
          <>
            <div className="table-responsive" aria-busy={isFetching}>
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr className="small text-body-secondary">
                    <th scope="col">Invoice</th>
                    <th scope="col">Debtor / supplier</th>
                    <th scope="col" className="d-none d-md-table-cell">Agreement</th>
                    <th scope="col" className="d-none d-lg-table-cell">Issued</th>
                    <th scope="col" className="d-none d-sm-table-cell">Due</th>
                    <th scope="col" className="text-end">Amount</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => (
                    <tr key={d.id}>
                      <td className="text-nowrap">
                        <div className="fw-semibold">{d.invoiceNumber}</div>
                        <div className="small text-body-secondary">{d.reference}</div>
                      </td>
                      <td>
                        <div>{d.entity.name}</div>
                        <div className="small text-body-secondary">Tax no. {d.entity.taxNumber}</div>
                      </td>
                      <td className="d-none d-md-table-cell small">
                        <span className={`badge rounded-pill app-nature-badge is-nature-${d.nature} me-1`}>{NATURE_LABELS[d.nature]}</span>
                        <div className="text-body-secondary mt-1">
                          {d.financialCompany} · {d.agreementNumber}
                        </div>
                      </td>
                      <td className="d-none d-lg-table-cell small text-nowrap">{formatDate(d.issueDate)}</td>
                      <td className="d-none d-sm-table-cell small text-nowrap">{formatDate(d.dueDate)}</td>
                      <td className="text-end text-nowrap">{formatEuro(d.amount)}</td>
                      <td>
                        <span className={`badge rounded-pill border ${STATUS_BADGES[d.status]}`}>{STATUS_LABELS[d.status]}</span>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-body-secondary py-5">
                        No documents match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3">
              <span className="small text-body-secondary">
                {documents.length} {documents.length === 1 ? "invoice" : "invoices"} · {formatEuro(outstanding)} outstanding
              </span>
              <Pagination page={current} pageCount={pageCount} onPageChange={setPage} ariaLabel="Documents pages" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DocumentsPage;
