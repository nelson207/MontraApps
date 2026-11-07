import { useState } from "react";
import { Link } from "react-router-dom";
import type { FactoringDocumentStatus, FactoringKind } from "@platform/api/generated/MontraPOSApi";
import Pagination from "@platform/components/ui/Pagination";
import { useDebouncedValue } from "@platform/hooks/useDebouncedValue";
import { useDocuments } from "../api/factoringApi";
import { LoadProblem, Loading } from "../components/FactoringStates";
import { useFactoringText } from "../factoringText";
import { useFactoringFormat } from "../model/format";
import { DOCUMENT_STATUSES, kindClass, kindLabel, STATUS_BADGES, statusLabel } from "../model/factoring";

const PAGE_SIZE = 10;
export const SEARCH_DEBOUNCE_MS = 500;

// The dealer's invoices, filtered and paged by the API. Each search makes several Accipiens calls
// per contract, so it waits for the typing to stop and says it is working. The footer's totals cover
// every page of the filter, one amount per currency.
function DocumentsPage() {
  const tx = useFactoringText();
  const { money, date } = useFactoringFormat();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<FactoringKind | "">("");
  const [status, setStatus] = useState<FactoringDocumentStatus | "">("");
  const debounced = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);

  // The page belongs to one filter: a new filter starts at page 1 without asking for the old one's
  const filterKey = JSON.stringify([debounced, kind, status]);
  const [paging, setPaging] = useState({ filterKey, page: 1 });
  const page = paging.filterKey === filterKey ? paging.page : 1;

  const documents = useDocuments({ kind: kind || undefined, status: status || undefined, search: debounced || undefined, page, pageSize: PAGE_SIZE });
  const { currentData, isFetching, isError, error, refetch } = documents;

  const rows = currentData?.items ?? [];
  const totalCount = currentData?.totalCount ?? 0;
  const pageCount = Math.ceil(totalCount / PAGE_SIZE);
  const filtered = !!debounced || !!kind || !!status;
  const outstanding = (currentData?.outstandingAmounts ?? []).map(({ currencyId, amount }) => ({ key: currencyId ?? "", text: money(amount, currencyId) }));
  const searching = isFetching || search.trim() !== debounced;

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-3 p-lg-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <h2 className="h5 mb-0">{tx("documents.title", "Documents")}</h2>
          <Link to="/factoring/new" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            {tx("submit.new", "New request")}
          </Link>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-12 col-lg-6">
            <label htmlFor="documents-search" className="visually-hidden">
              {tx("counterparty.search", "Search")}
            </label>
            <div className="input-group">
              <span className="input-group-text">
                {searching ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <i className="bi bi-search" aria-hidden="true" />}
              </span>
              <input
                id="documents-search"
                type="search"
                className="form-control"
                placeholder={tx("documents.searchPlaceholder", "Invoice, request, debtor / supplier or tax number")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <label htmlFor="documents-kind" className="visually-hidden">
              {tx("documents.agreementType", "Agreement type")}
            </label>
            <select id="documents-kind" className="form-select" value={kind} onChange={(e) => setKind(e.target.value as FactoringKind | "")}>
              <option value="">{tx("documents.allKinds", "Factoring and confirming")}</option>
              <option value="Factoring">{kindLabel("Factoring", tx)}</option>
              <option value="Confirming">{kindLabel("Confirming", tx)}</option>
            </select>
          </div>
          <div className="col-6 col-lg-3">
            <label htmlFor="documents-status" className="visually-hidden">
              {tx("documents.status", "Status")}
            </label>
            <select id="documents-status" className="form-select" value={status} onChange={(e) => setStatus(e.target.value as FactoringDocumentStatus | "")}>
              <option value="">{tx("documents.allStatuses", "All statuses")}</option>
              {DOCUMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s, tx)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isError ? (
          <LoadProblem error={error} fallback={tx("documents.loadError", "The documents couldn't be loaded. Try again in a moment.")} onRetry={refetch} />
        ) : !currentData ? (
          <Loading hint={tx("documents.slow", "Reading your agreements' invoices. This can take a moment.")} />
        ) : (
          <>
            <div className="table-responsive" aria-busy={isFetching}>
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr className="small text-body-secondary">
                    <th scope="col">{tx("documents.invoice", "Invoice")}</th>
                    <th scope="col">{tx("documents.counterparty", "Debtor / supplier")}</th>
                    <th scope="col" className="d-none d-md-table-cell">{tx("agreement.title", "Agreement")}</th>
                    <th scope="col" className="d-none d-lg-table-cell">{tx("documents.issued", "Issued")}</th>
                    <th scope="col" className="d-none d-sm-table-cell">{tx("documents.due", "Due")}</th>
                    <th scope="col" className="text-end">{tx("invoices.amount", "Amount")}</th>
                    <th scope="col">{tx("documents.status", "Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => (
                    <tr key={d.id}>
                      <td className="text-nowrap">
                        <div className="fw-semibold">{d.invoiceNumber ?? "—"}</div>
                        {d.cessionNumber !== null && d.cessionNumber !== undefined && (
                          <div className="small text-body-secondary">{tx("documents.requestNumber", "Request {{number}}", { number: d.cessionNumber })}</div>
                        )}
                      </td>
                      <td>
                        <div>{d.counterparty ?? "—"}</div>
                        {d.taxNumber && <div className="small text-body-secondary">{tx("counterparty.taxNumberOf", "Tax no. {{number}}", { number: d.taxNumber })}</div>}
                      </td>
                      <td className="d-none d-md-table-cell small">
                        <span className={`badge rounded-pill me-1 ${kindClass(d.kind)}`}>{kindLabel(d.kind, tx)}</span>
                        <div className="text-body-secondary mt-1">{[d.financialInstitution, d.contractNumber].filter((part) => part !== null && part !== undefined).join(" · ")}</div>
                      </td>
                      <td className="d-none d-lg-table-cell small text-nowrap">{date(d.issueDate) || "—"}</td>
                      <td className="d-none d-sm-table-cell small text-nowrap">{date(d.dueDate) || "—"}</td>
                      <td className="text-end text-nowrap">{money(d.amount, d.currencyId) ?? "—"}</td>
                      <td>
                        {d.status ? <span className={`badge rounded-pill border ${STATUS_BADGES[d.status]}`}>{statusLabel(d.status, tx)}</span> : "—"}
                        {d.stateName && <div className="small text-body-secondary mt-1">{d.stateName}</div>}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-body-secondary py-5">
                        {filtered ? tx("documents.noMatch", "No documents match these filters.") : tx("documents.empty", "No documents yet. Submit a new request to see its invoices here.")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3">
              <span className="small text-body-secondary">
                {totalCount === 1 ? tx("documents.countOne", "1 invoice") : tx("documents.countMany", "{{count}} invoices", { count: totalCount })}
                {outstanding.map(({ key, text }) => (
                  <span key={key} className="d-block d-sm-inline ms-sm-3">
                    {tx("documents.outstanding", "{{amount}} outstanding", { amount: text ?? "" })}
                  </span>
                ))}
              </span>
              <Pagination page={page} pageCount={pageCount} onPageChange={(next) => setPaging({ filterKey, page: next })} ariaLabel={tx("documents.pages", "Documents pages")} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DocumentsPage;
