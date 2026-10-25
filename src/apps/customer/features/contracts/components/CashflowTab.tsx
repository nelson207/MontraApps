import { useState } from "react";
import Pagination from "@platform/components/ui/Pagination";
import { useGetCashflowQuery } from "../api/contractsApi";
import { cashflowSummary, formatDate, formatEuro, type CashflowRow, type Contract } from "../model/contracts";
import { PaymentStatusBadge } from "./DocumentStatusBadge";

const PAGE_SIZE = 12;

type Filter = "all" | "upcoming" | "paid" | "overdue";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "To pay" },
  { id: "paid", label: "Paid" },
  { id: "overdue", label: "Overdue" },
];

const matches = (row: CashflowRow, filter: Filter) =>
  filter === "all" ||
  (filter === "upcoming" && row.status !== "paid") ||
  (filter === "paid" && row.status === "paid") ||
  (filter === "overdue" && row.status === "overdue");

// The contract's payment schedule: what is paid, overdue and still to pay, then every installment
// (principal, interest, fees, total, balance after it), a year per page, opening on the next one.
function CashflowTab({ contract }: { contract: Contract }) {
  const { data: rows, isLoading, isError, refetch } = useGetCashflowQuery(contract.id);
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState<number | null>(null);

  if (isError)
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2 mb-0" role="alert">
        <span className="flex-grow-1">The cashflow couldn't be loaded.</span>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );

  if (isLoading || !rows)
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );

  const summary = cashflowSummary(rows);
  const shown = rows.filter((r) => matches(r, filter));
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  // Until a page is chosen: the page with the next payment (or the first one)
  const nextIndex = shown.findIndex((r) => r.status === "due" || r.status === "overdue");
  const current = Math.min(page ?? (nextIndex >= 0 ? Math.floor(nextIndex / PAGE_SIZE) + 1 : 1), pageCount);
  const pageRows = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="d-flex flex-column gap-3">
      <div className="row g-3">
        <div className="col-6 col-lg-3">
          <div className="app-figure">
            <span className="app-figure-label">Next payment</span>
            <span className="app-figure-value">{summary.next ? formatEuro(summary.next.total) : "—"}</span>
            <span className="app-figure-note">{summary.next ? formatDate(summary.next.dueDate) : "Nothing left to pay"}</span>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`app-figure ${summary.overdue.count ? "is-danger" : ""}`}>
            <span className="app-figure-label">Overdue</span>
            <span className="app-figure-value">{formatEuro(summary.overdue.amount)}</span>
            <span className="app-figure-note">
              {summary.overdue.count ? `${summary.overdue.count} ${summary.overdue.count === 1 ? "installment" : "installments"}` : "Nothing overdue"}
            </span>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="app-figure">
            <span className="app-figure-label">Paid</span>
            <span className="app-figure-value">{formatEuro(summary.paid.amount)}</span>
            <span className="app-figure-note">
              {summary.paid.count} of {rows.length} installments
            </span>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="app-figure">
            <span className="app-figure-label">Still to pay</span>
            <span className="app-figure-value">{formatEuro(summary.remaining.amount)}</span>
            <span className="app-figure-note">{summary.remaining.count} installments</span>
          </div>
        </div>
      </div>

      <div>
        <div className="d-flex justify-content-between small mb-1">
          <span className="text-body-secondary">Repaid</span>
          <span className="fw-semibold">{summary.paidShare}%</span>
        </div>
        <div
          className="progress app-repaid-progress"
          role="progressbar"
          aria-label="Share of the contract repaid"
          aria-valuenow={summary.paidShare}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="progress-bar" style={{ width: `${summary.paidShare}%` }} />
        </div>
      </div>

      <div className="btn-group btn-group-sm align-self-start" role="group" aria-label="Show installments">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`btn ${filter === f.id ? "btn-primary" : "btn-outline-primary"}`}
            aria-pressed={filter === f.id}
            onClick={() => {
              setFilter(f.id);
              setPage(null);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle mb-0 app-cashflow-table">
          <thead>
            <tr className="small text-body-secondary">
              <th scope="col">#</th>
              <th scope="col">Due date</th>
              <th scope="col" className="text-end d-none d-md-table-cell">Principal</th>
              <th scope="col" className="text-end d-none d-md-table-cell">Interest</th>
              <th scope="col" className="text-end d-none d-lg-table-cell">Fees</th>
              <th scope="col" className="text-end">Payment</th>
              <th scope="col" className="text-end d-none d-sm-table-cell">Balance</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.number} className={row.status === "due" ? "is-next" : row.status === "overdue" ? "is-overdue" : ""}>
                <td className="text-body-secondary">{row.number}</td>
                <td className="text-nowrap">{formatDate(row.dueDate)}</td>
                <td className="text-end app-tabular d-none d-md-table-cell">{formatEuro(row.principal)}</td>
                <td className="text-end app-tabular d-none d-md-table-cell">{formatEuro(row.interest)}</td>
                <td className="text-end app-tabular d-none d-lg-table-cell">{formatEuro(row.fees)}</td>
                <td className="text-end app-tabular fw-semibold">{formatEuro(row.total)}</td>
                <td className="text-end app-tabular d-none d-sm-table-cell text-body-secondary">{formatEuro(row.balance)}</td>
                <td>
                  <PaymentStatusBadge status={row.status} />
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-body-secondary py-4">
                  No installments here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="d-flex justify-content-end">
        <Pagination page={current} pageCount={pageCount} onPageChange={setPage} ariaLabel="Cashflow pages" />
      </div>
    </div>
  );
}

export default CashflowTab;
