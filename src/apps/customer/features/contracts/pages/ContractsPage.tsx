import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetContractsQuery } from "../api/contractsApi";
import RoleBadge from "../components/RoleBadge";
import { formatDate, formatEuro, ROLE_LABELS, type ContractRole } from "../model/contracts";

const ROLES: ContractRole[] = ["customer", "secondHolder", "guarantor"];

// Every contract I'm on — as customer, second holder or guarantor — to choose the one to open.
function ContractsPage() {
  const { data: contracts, isLoading, isError, refetch } = useGetContractsQuery();
  const [role, setRole] = useState<ContractRole | null>(null);

  if (isError)
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
        <span className="flex-grow-1">Your contracts couldn't be loaded.</span>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );

  if (isLoading || !contracts)
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );

  const shown = contracts.filter((c) => !role || c.role === role);
  const count = (r: ContractRole) => contracts.filter((c) => c.role === r).length;

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex flex-wrap align-items-center gap-2" role="group" aria-label="Filter by my role">
        <button
          type="button"
          className={`btn btn-sm ${role === null ? "btn-primary" : "btn-outline-primary"}`}
          aria-pressed={role === null}
          onClick={() => setRole(null)}
        >
          All <span className="opacity-75 ms-1">{contracts.length}</span>
        </button>
        {ROLES.filter((r) => count(r) > 0).map((r) => (
          <button
            key={r}
            type="button"
            className={`btn btn-sm ${role === r ? "btn-primary" : "btn-outline-primary"}`}
            aria-pressed={role === r}
            onClick={() => setRole(r)}
          >
            {r === "guarantor" ? "As guarantor" : `As ${ROLE_LABELS[r].toLowerCase()}`}
            <span className="opacity-75 ms-1">{count(r)}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 && <p className="text-body-secondary">No contracts here.</p>}

      <div className="row g-3">
        {shown.map((c) => {
          const repaid = Math.round((c.paidInstallments / c.term) * 100);
          return (
            <div className="col-12 col-lg-6" key={c.id}>
              <Link to={`/contracts/${c.id}`} className="app-contract-card">
                <span className="d-flex align-items-start justify-content-between gap-2 mb-2">
                  <span className="min-w-0">
                    <span className="d-block small text-body-secondary">
                      {c.business} · {c.lender}
                    </span>
                    <span className="d-block fw-semibold fs-6">{c.number}</span>
                  </span>
                  <RoleBadge role={c.role} />
                </span>
                <span className="d-block small text-truncate mb-3">
                  {c.asset ?? c.product}
                  {c.role !== "customer" && (
                    <span className="text-body-secondary"> · {c.holders.find((h) => h.role === "customer")?.name}</span>
                  )}
                </span>

                <span className="row g-2 small mb-3">
                  <span className="col-4">
                    <span className="d-block text-body-secondary">Next payment</span>
                    <span className="d-block fw-semibold">{c.nextAmount != null ? formatEuro(c.nextAmount) : "—"}</span>
                    <span className="d-block text-body-secondary">{c.nextDueDate ? formatDate(c.nextDueDate) : ""}</span>
                  </span>
                  <span className="col-4">
                    <span className="d-block text-body-secondary">Still owed</span>
                    <span className="d-block fw-semibold">{formatEuro(c.outstanding)}</span>
                  </span>
                  <span className="col-4">
                    <span className="d-block text-body-secondary">Overdue</span>
                    <span className={`d-block fw-semibold ${c.overdueAmount ? "text-danger" : ""}`}>{formatEuro(c.overdueAmount)}</span>
                  </span>
                </span>

                <span className="d-flex justify-content-between small text-body-secondary mb-1">
                  <span>
                    {c.paidInstallments} of {c.term} installments paid
                  </span>
                  <span>{repaid}%</span>
                </span>
                <span
                  className="progress app-repaid-progress"
                  role="progressbar"
                  aria-label={`${repaid}% repaid`}
                  aria-valuenow={repaid}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span className="progress-bar" style={{ width: `${repaid}%` }} />
                </span>
                {c.overdueAmount > 0 && (
                  <span className="d-block small text-danger mt-2">
                    <i className="bi bi-exclamation-triangle me-1" aria-hidden="true" />
                    {c.overdueCount} {c.overdueCount === 1 ? "installment" : "installments"} overdue
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ContractsPage;
