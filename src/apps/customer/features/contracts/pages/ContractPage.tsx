import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useGetContractsQuery } from "../api/contractsApi";
import CashflowTab from "../components/CashflowTab";
import DocumentsTab from "../components/DocumentsTab";
import RoleBadge from "../components/RoleBadge";
import { formatDate, formatEuro, ROLE_LABELS, type Contract } from "../model/contracts";

type Tab = "cashflow" | "documents" | "details";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "cashflow", label: "Cashflow", icon: "bi-graph-up" },
  { id: "documents", label: "Documents", icon: "bi-receipt" },
  { id: "details", label: "Details", icon: "bi-info-circle" },
];

// One contract: switch to another from the header; its cashflow, its invoiced documents (detail
// and PDF) and its conditions.
function ContractPage() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { data: contracts, isLoading, isError, refetch } = useGetContractsQuery();
  const [tab, setTab] = useState<Tab>("cashflow");

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

  const contract = contracts.find((c) => String(c.id) === contractId);
  if (!contract)
    return (
      <div className="alert alert-warning" role="alert">
        This contract isn't one of yours. <Link to="/contracts">See your contracts</Link>.
      </div>
    );

  return (
    <div className="d-flex flex-column gap-3">
      <div className="card shadow-sm border-0">
        <div className="card-body p-3 p-lg-4">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <Link to="/contracts" className="btn btn-sm btn-outline-secondary">
              <i className="bi bi-arrow-left me-1" aria-hidden="true" />
              My contracts
            </Link>
            <label htmlFor="contract-select" className="visually-hidden">
              Contract
            </label>
            <select
              id="contract-select"
              className="form-select form-select-sm w-auto mw-100 ms-auto"
              value={contract.id}
              onChange={(e) => navigate(`/contracts/${e.target.value}`)}
            >
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.number} · {c.business} ({ROLE_LABELS[c.role]})
                </option>
              ))}
            </select>
          </div>

          <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
            <div className="min-w-0">
              <div className="small text-body-secondary">
                {contract.business} · {contract.product} · {contract.lender}
              </div>
              <h2 className="h4 mb-1">{contract.number}</h2>
              <div className="text-body-secondary">{contract.asset ?? "No financed asset"}</div>
            </div>
            <RoleBadge role={contract.role} />
          </div>

          {contract.role === "guarantor" && (
            <div className="alert alert-info d-flex gap-2 small mt-3 mb-0" role="note">
              <i className="bi bi-shield-check" aria-hidden="true" />
              <span>
                You guarantee this contract of {contract.holders.find((h) => h.role === "customer")?.name}. You'd be asked to pay
                only if they don't.
                {contract.overdueAmount > 0 && ` It has ${formatEuro(contract.overdueAmount)} overdue.`}
              </span>
            </div>
          )}
          {contract.role !== "guarantor" && contract.overdueAmount > 0 && (
            <div className="alert alert-danger d-flex gap-2 small mt-3 mb-0" role="alert">
              <i className="bi bi-exclamation-triangle" aria-hidden="true" />
              <span>
                {formatEuro(contract.overdueAmount)} overdue ({contract.overdueCount}{" "}
                {contract.overdueCount === 1 ? "installment" : "installments"}). Pay it as soon as you can to stop late payment
                interest; contact {contract.lender} if you need help.
              </span>
            </div>
          )}

          <ul className="nav nav-underline mt-4" role="tablist">
            {TABS.map((t) => (
              <li className="nav-item" key={t.id} role="presentation">
                <button
                  type="button"
                  role="tab"
                  id={`contract-tab-${t.id}`}
                  aria-controls={`contract-panel-${t.id}`}
                  aria-selected={tab === t.id}
                  className={`nav-link ${tab === t.id ? "active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  <i className={`bi ${t.icon} me-2`} aria-hidden="true" />
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-3 p-lg-4" role="tabpanel" id={`contract-panel-${tab}`} aria-labelledby={`contract-tab-${tab}`}>
          {/* keyed by contract: each one starts on its own data */}
          {tab === "cashflow" && <CashflowTab key={contract.id} contract={contract} />}
          {tab === "documents" && <DocumentsTab key={contract.id} contract={contract} />}
          {tab === "details" && <ContractDetails contract={contract} />}
        </div>
      </div>
    </div>
  );
}

function ContractDetails({ contract }: { contract: Contract }) {
  const rows: [string, string][] = [
    ["Business", contract.business],
    ["Product", contract.product],
    ["Financial company", contract.lender],
    ["Financed amount", formatEuro(contract.financedAmount)],
    ["Monthly payment", formatEuro(contract.installment)],
    ["Term", `${contract.term} months`],
    ["TAN", `${contract.tan.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} %`],
    ["TAEG", `${contract.taeg.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} %`],
    ["Start", formatDate(contract.startDate)],
    ["End", formatDate(contract.endDate)],
    ["Payment method", contract.paymentMethod],
    ["Financed asset", contract.asset ?? "—"],
  ];
  return (
    <div className="row g-4">
      <div className="col-12 col-lg-8">
        <h3 className="h6 mb-3">Conditions</h3>
        <dl className="row small mb-0">
          {rows.map(([label, value]) => (
            <div className="col-6 col-md-4 mb-3" key={label}>
              <dt className="fw-normal text-body-secondary">{label}</dt>
              <dd className="fw-semibold mb-0 text-break">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="col-12 col-lg-4">
        <h3 className="h6 mb-3">People on this contract</h3>
        <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
          {contract.holders.map((h) => (
            <li key={h.name} className="d-flex align-items-center justify-content-between gap-2">
              <span className="fw-semibold">{h.name}</span>
              <RoleBadge role={h.role} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ContractPage;
