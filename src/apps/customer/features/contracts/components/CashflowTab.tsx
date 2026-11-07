import { useState } from "react";
import Pagination from "@platform/components/ui/Pagination";
import { useGetCashflowQuery } from "../api/contractsApi";
import { formatDate, formatMoney, openingPage, repaidShare, type CashflowFilter, type ContractCard } from "../model/contracts";
import { PaymentStatusBadge } from "./DocumentStatusBadge";

const PAGE_SIZE = 12;

const FILTERS: { id: CashflowFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "To pay" },
  { id: "paid", label: "Paid" },
  { id: "overdue", label: "Overdue" },
];

// The contract's payment schedule: what is paid, overdue and still to pay, then every installment
// (principal, interest, fees, total, balance after it), a year per page, opening on the next one.
function CashflowTab({ contract }: { contract: ContractCard }) {
  const [filter, setFilter] = useState<CashflowFilter>("all");
  const [page, setPage] = useState<number | null>(null);
  const { data, currentData, isLoading, isFetching, isError, refetch } = useGetCashflowQuery({
    contractId: contract.id,
    filter,
    page: page ?? 1,
    pageSize: PAGE_SIZE,
  });

  // Until a page is chosen, the whole schedule opens on the next payment. (A filtered list starts
  // at its first row: the API's position is for the whole schedule.)
  if (page === null && filter === "all" && currentData && !isFetching) setPage(openingPage(currentData.nextPosition, PAGE_SIZE));

  if (isError)
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2 mb-0" role="alert">
        <span className="flex-grow-1">The cashflow couldn't be loaded.</span>
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

  const money = (value: number) => formatMoney(value, data.currency);
  const paidShare = repaidShare(data.paid.count, data.totalInstallments);
  const pageCount = Math.max(1, Math.ceil((currentData ?? data).totalCount / PAGE_SIZE));

  return (
    <div className="d-flex flex-column gap-3">
      <div className="row g-3">
        <div className="col-6 col-lg-3">
          <div className="app-figure">
            <span className="app-figure-label">Next payment</span>
            <span className="app-figure-value">{data.next ? money(data.next.amount) : "—"}</span>
            <span className="app-figure-note">{data.next ? formatDate(data.next.dueDate) : data.remaining.count > 0 ? "None scheduled" : "Nothing left to pay"}</span>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`app-figure ${data.overdue.count ? "is-danger" : ""}`}>
            <span className="app-figure-label">Overdue</span>
            <span className="app-figure-value">{money(data.overdue.amount)}</span>
            <span className="app-figure-note">
              {data.overdue.count ? `${data.overdue.count} ${data.overdue.count === 1 ? "installment" : "installments"}` : "Nothing overdue"}
            </span>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="app-figure">
            <span className="app-figure-label">Paid</span>
            <span className="app-figure-value">{money(data.paid.amount)}</span>
            <span className="app-figure-note">
              {data.paid.count} of {data.totalInstallments} installments
            </span>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="app-figure">
            <span className="app-figure-label">Still to pay</span>
            <span className="app-figure-value">{money(data.remaining.amount)}</span>
            <span className="app-figure-note">
              {data.remaining.count} {data.remaining.count === 1 ? "installment" : "installments"}
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="d-flex justify-content-between small mb-1">
          <span className="text-body-secondary">Repaid</span>
          <span className="fw-semibold">{paidShare}%</span>
        </div>
        <div
          className="progress app-repaid-progress"
          role="progressbar"
          aria-label="Share of the contract repaid"
          aria-valuenow={paidShare}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="progress-bar" style={{ width: `${paidShare}%` }} />
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
            {currentData?.rows.map((row) => (
              <tr key={`${row.number}-${row.isResidualValue}`} className={row.status === "due" ? "is-next" : row.status === "overdue" ? "is-overdue" : ""}>
                <td className="text-body-secondary">{!row.isResidualValue && row.number}</td>
                <td className="text-nowrap">
                  {formatDate(row.dueDate)}
                  {row.isResidualValue && <span className="d-block small text-body-secondary">Residual value</span>}
                </td>
                <td className="text-end app-tabular d-none d-md-table-cell">{money(row.principal)}</td>
                <td className="text-end app-tabular d-none d-md-table-cell">{money(row.interest)}</td>
                <td className="text-end app-tabular d-none d-lg-table-cell">{money(row.fees)}</td>
                <td className="text-end app-tabular fw-semibold">{money(row.total)}</td>
                <td className="text-end app-tabular d-none d-sm-table-cell text-body-secondary">{money(row.balance)}</td>
                <td>
                  <PaymentStatusBadge status={row.status} />
                </td>
              </tr>
            ))}
            {!currentData && (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  <span className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading…</span>
                  </span>
                </td>
              </tr>
            )}
            {currentData?.rows.length === 0 && (
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
        <Pagination page={page ?? 1} pageCount={pageCount} onPageChange={setPage} ariaLabel="Cashflow pages" />
      </div>
    </div>
  );
}

export default CashflowTab;
