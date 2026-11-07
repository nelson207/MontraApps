import { Link } from "react-router-dom";
import NewsGallery from "@platform/features/news/components/NewsGallery";
import BreakdownChart from "@platform/features/insights/components/BreakdownChart";
import TrendChart from "@platform/features/insights/components/TrendChart";
import UpcomingList from "@platform/features/insights/components/UpcomingList";
import { useGetCustomerDashboardQuery } from "../../contracts/api/contractsApi";
import RoleBadge from "../../contracts/components/RoleBadge";
import {
  formatDate,
  formatMoney,
  joined,
  repaidShare,
  todayLocal,
  type CurrencyOverview,
} from "../../contracts/model/contracts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const daysUntil = (iso: string, today: string) =>
  Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);

const inDays = (days: number) => (days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`);

/** "Oct", then "Jan 27" when the year changes */
const monthLabel = (month: string, i: number) => {
  const [y, m] = month.split("-").map(Number);
  return i === 0 || m === 1 ? `${MONTHS[m - 1]} ${String(y).slice(2)}` : MONTHS[m - 1];
};

const contractPath = (id: string) => `/contracts/${encodeURIComponent(id)}`;

/** The charts only know euros: another currency shows plain numbers, with its code in the title */
const chartMoney = (currency: string | null, title: string) =>
  currency === "EUR" ? { title, format: "currency" as const } : { title: currency ? `${title} (${currency})` : title, format: "number" as const };

// Montra Customer home: news, then what a credit customer needs at a glance. News sits outside
// the contracts overview so it still shows while the contracts load, fail or don't exist.
function DashboardPage() {
  return (
    <div className="app-page">
      <NewsGallery />
      <ContractsOverview />
    </div>
  );
}

// The next payment, anything overdue, what is still owed and paid each month, the contracts
// guaranteed for others, the payments ahead and how far each contract is repaid. The API's totals
// come per currency; with one currency (the usual) there is simply one of each.
function ContractsOverview() {
  const { data: dashboard, isLoading, isError, refetch } = useGetCustomerDashboardQuery();
  const today = todayLocal();

  if (isError)
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
        <span className="flex-grow-1">Your contracts couldn't be loaded.</span>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );

  if (isLoading || !dashboard)
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );

  const { overviews, comingUp, repaid } = dashboard;

  if (overviews.length === 0 && repaid.length === 0)
    return (
      <div className="card shadow-sm border-0">
        <div className="card-body text-center p-5 text-body-secondary">You have no active contracts.</div>
      </div>
    );

  const trends = overviews.filter((o) => o.monthlyPayments.length > 0);
  const owed = overviews.filter((o) => o.owedByContract.length > 0);

  return (
    // app-viz: the chart colours (platform/styles/insights.scss)
    <div className="d-flex flex-column gap-4 app-viz">
      {overviews
        .filter((o) => o.overdue.amount > 0)
        .map((o) => (
          <div key={o.currency} className="alert alert-danger d-flex flex-wrap align-items-center gap-2 mb-0" role="alert">
            <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
            <span className="flex-grow-1">
              <strong>{formatMoney(o.overdue.amount, o.currency)} overdue</strong>
              {o.overdue.contracts.length > 0 && ` on ${o.overdue.contracts.map((c) => c.number).join(", ")}`}. Pay it as soon as you can to
              stop late payment interest.
            </span>
            {o.overdue.contracts.length > 0 && (
              <Link to={contractPath(o.overdue.contracts[0].id)} className="btn btn-sm btn-danger">
                See the contract
              </Link>
            )}
          </div>
        ))}

      {overviews.map((o) => (
        <section key={o.currency} aria-label={overviews.length > 1 && o.currency ? `Totals in ${o.currency}` : "Totals"}>
          {overviews.length > 1 && <h2 className="h6 mb-2">{o.currency}</h2>}
          <Totals overview={o} today={today} />
        </section>
      ))}

      <div className="row g-3">
        {trends.length > 0 && (
          <div className="col-12 col-xl-8 d-flex flex-column gap-3">
            {trends.map((o) => (
              <TrendChart
                key={o.currency}
                trend={{
                  ...chartMoney(o.currency, "My payments ahead"),
                  subtitle: "Every contract until it ends",
                  labels: o.monthlyPayments.map((m, i) => monthLabel(m.month, i)),
                  series: [{ label: "Payments", values: o.monthlyPayments.map((m) => m.amount) }],
                }}
              />
            ))}
          </div>
        )}
        <div className={`col-12 ${trends.length > 0 ? "col-xl-4" : ""}`}>
          <UpcomingList
            upcoming={{
              title: "Coming up",
              rows: comingUp.map((row) => ({
                id: `${row.contractId}-${row.dueDate}`,
                title: joined(formatMoney(row.amount, row.currency), row.business),
                detail: row.role === "guarantor" ? `${row.contractNumber} (as guarantor)` : String(row.contractNumber),
                date: row.dueDate,
              })),
            }}
          />
        </div>
        {owed.length > 0 && (
          <div className="col-12 col-xl-6 d-flex flex-column gap-3">
            {owed.map((o) => (
              <BreakdownChart
                key={o.currency}
                breakdown={{
                  id: `owed-${o.currency}`,
                  ...chartMoney(o.currency, "Still owed, by contract"),
                  subtitle: `${formatMoney(o.stillOwed.amount, o.currency)} in total`,
                  segments: o.owedByContract.map((c) => ({ label: joined(c.business, c.number), value: c.amount })),
                }}
              />
            ))}
          </div>
        )}
        <div className={`col-12 ${owed.length > 0 ? "col-xl-6" : ""}`}>
          <section className="app-viz-card p-3 h-100" aria-label="How far each contract is repaid">
            <h3 className="app-viz-title mb-3">Repaid so far</h3>
            <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
              {repaid.map((c) => {
                const share = repaidShare(c.paidInstallments, c.totalInstallments);
                return (
                  <li key={c.contractId}>
                    <Link to={contractPath(c.contractId)} className="app-progress-link">
                      <span className="d-flex flex-wrap align-items-center gap-2 small mb-1">
                        <span className="fw-semibold">{c.contractNumber}</span>
                        <RoleBadge role={c.role} />
                        <span className="ms-auto text-body-secondary">
                          {c.paidInstallments}/{c.totalInstallments} · {share}%
                        </span>
                      </span>
                      <span
                        className="progress app-repaid-progress"
                        role="progressbar"
                        aria-label={`${c.contractNumber}: ${share}% repaid`}
                        aria-valuenow={share}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <span className={`progress-bar ${c.hasOverdue ? "bg-danger" : ""}`} style={{ width: `${share}%` }} />
                      </span>
                      <span className="d-block small text-body-secondary mt-1">
                        {c.endDate && `Ends ${formatDate(c.endDate)} · `}
                        {formatMoney(c.stillOwed, c.currency)} left
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function Totals({ overview, today }: { overview: CurrencyOverview; today: string }) {
  const { currency, next, overdue, stillOwed, paidEachMonth, guarantor } = overview;
  const money = (value: number) => formatMoney(value, currency);
  const overdueContracts = overdue.contracts.length;

  return (
    <div className="row g-3">
      <div className="col-12 col-md-6 col-xl">
        <div className="app-kpi is-primary">
          <span className="app-kpi-label">
            <i className="bi bi-calendar-event me-2" aria-hidden="true" />
            Next payment
          </span>
          {next ? (
            <>
              <span className="app-kpi-value">{money(next.amount)}</span>
              <span className="app-kpi-note">
                {formatDate(next.dueDate)} · {inDays(daysUntil(next.dueDate, today))}
              </span>
              <Link to={contractPath(next.contractId)} className="app-kpi-link">
                {next.contractNumber}
              </Link>
            </>
          ) : (
            <span className="app-kpi-value">—</span>
          )}
        </div>
      </div>
      <div className="col-12 col-md-6 col-xl">
        <div className={`app-kpi ${overdue.amount > 0 ? "is-danger" : "is-success"}`}>
          <span className="app-kpi-label">
            <i className={`bi ${overdue.amount > 0 ? "bi-exclamation-circle" : "bi-check-circle"} me-2`} aria-hidden="true" />
            Overdue
          </span>
          <span className="app-kpi-value">{money(overdue.amount)}</span>
          <span className="app-kpi-note">
            {overdue.amount > 0
              ? overdueContracts > 0 && `On ${overdueContracts} ${overdueContracts === 1 ? "contract" : "contracts"}`
              : "You're up to date"}
          </span>
        </div>
      </div>
      <div className="col-6 col-xl">
        <div className="app-kpi">
          <span className="app-kpi-label">Still owed</span>
          <span className="app-kpi-value">{money(stillOwed.amount)}</span>
          <span className="app-kpi-note">
            On {stillOwed.contracts} {stillOwed.contracts === 1 ? "contract" : "contracts"}
          </span>
        </div>
      </div>
      <div className="col-6 col-xl">
        <div className="app-kpi">
          <span className="app-kpi-label">Paid each month</span>
          <span className="app-kpi-value">{money(paidEachMonth)}</span>
          <span className="app-kpi-note">All your contracts</span>
        </div>
      </div>
      {guarantor.contracts > 0 && (
        <div className="col-12 col-xl">
          <div className={`app-kpi ${guarantor.overdueAmount > 0 ? "is-warning" : ""}`}>
            <span className="app-kpi-label">
              <i className="bi bi-shield-check me-2" aria-hidden="true" />
              As guarantor
            </span>
            <span className="app-kpi-value">{money(guarantor.stillOwed)}</span>
            <span className="app-kpi-note">
              {guarantor.contracts} {guarantor.contracts === 1 ? "contract" : "contracts"}
              {guarantor.overdueAmount > 0 && ` · ${money(guarantor.overdueAmount)} overdue`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
