import { useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "@platform/components/ui/Pagination";
import { useWorkContext } from "@platform/features/workContext/hooks/useWorkContext";
import { STATUS_LABELS, useGetStockUnitsQuery, type StockUnitStatus } from "../api/stockApi";
import { formatEuro } from "../model/stockUnit";

const PAGE_SIZE = 10;

const STATUS_BADGES: Record<StockUnitStatus, string> = {
  submitted: "bg-secondary-subtle text-secondary-emphasis border-secondary-subtle",
  approved: "bg-info-subtle text-info-emphasis border-info-subtle",
  funded: "bg-primary-subtle text-primary-emphasis border-primary-subtle",
  overdue: "bg-danger-subtle text-danger-emphasis border-danger-subtle",
  settled: "bg-success-subtle text-success-emphasis border-success-subtle",
};

const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const formatDate = (iso: string | null) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// The credit intermediary's stock units (working context), searchable by reference, vehicle, VIN,
// plate, supplier or invoice, and filtered by status.
function StockUnitsPage() {
  const { selection } = useWorkContext();
  const intermediaryId = selection?.organization?.id;
  const { data, isLoading, isFetching, isError } = useGetStockUnitsQuery(intermediaryId ?? "", { skip: !intermediaryId });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StockUnitStatus | "">("");
  const [page, setPage] = useState(1);

  const words = normalize(search).split(/\s+/).filter(Boolean);
  const units = (data ?? []).filter((u) => {
    if (status && u.status !== status) return false;
    const text = normalize([u.reference, u.vehicle, u.vin, u.licencePlate ?? "", u.supplier.name, u.invoiceNumber].join(" "));
    return words.every((w) => text.includes(w));
  });
  const pageCount = Math.max(1, Math.ceil(units.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = units.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const total = units.reduce((sum, u) => sum + (u.status === "settled" ? 0 : u.amount), 0);

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-3 p-lg-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div>
            <h2 className="h5 mb-0">Stock units</h2>
            <span className="small text-body-secondary">{selection?.organization?.name}</span>
          </div>
          <Link to="/stock/new" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            New stock unit
          </Link>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-12 col-md-8">
            <label htmlFor="stock-search" className="visually-hidden">
              Search
            </label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search" aria-hidden="true" />
              </span>
              <input
                id="stock-search"
                type="search"
                className="form-control"
                placeholder="Reference, vehicle, VIN, plate, supplier or invoice"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="col-12 col-md-4">
            <label htmlFor="stock-status" className="visually-hidden">
              Status
            </label>
            <select
              id="stock-status"
              className="form-select"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as StockUnitStatus | "");
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {(Object.keys(STATUS_LABELS) as StockUnitStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isError ? (
          <div className="alert alert-danger mb-0" role="alert">
            The stock units couldn't be loaded. Try again in a moment.
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
                    <th scope="col">Reference</th>
                    <th scope="col">Vehicle</th>
                    <th scope="col" className="d-none d-lg-table-cell">Supplier</th>
                    <th scope="col" className="d-none d-md-table-cell">Agreement</th>
                    <th scope="col" className="text-end">Amount</th>
                    <th scope="col" className="d-none d-sm-table-cell">Due</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.id}>
                      <td className="fw-semibold text-nowrap">{u.reference}</td>
                      <td>
                        <div>{u.vehicle}</div>
                        <div className="small text-body-secondary text-nowrap">
                          {u.licencePlate ? `${u.licencePlate} · ` : ""}
                          {u.vin}
                        </div>
                      </td>
                      <td className="d-none d-lg-table-cell small">
                        {u.supplier.name}
                        <div className="text-body-secondary">{u.invoiceNumber}</div>
                      </td>
                      <td className="d-none d-md-table-cell small">
                        {u.financialCompany}
                        <div className="text-body-secondary">{u.agreementNumber}</div>
                      </td>
                      <td className="text-end text-nowrap">{formatEuro(u.amount)}</td>
                      <td className="d-none d-sm-table-cell small text-nowrap">{formatDate(u.dueOn)}</td>
                      <td>
                        <span className={`badge rounded-pill border ${STATUS_BADGES[u.status]}`}>{STATUS_LABELS[u.status]}</span>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-body-secondary py-5">
                        No stock units match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3">
              <span className="small text-body-secondary">
                {units.length} {units.length === 1 ? "unit" : "units"} · {formatEuro(total)} financed
              </span>
              <Pagination page={current} pageCount={pageCount} onPageChange={setPage} ariaLabel="Stock units pages" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StockUnitsPage;
