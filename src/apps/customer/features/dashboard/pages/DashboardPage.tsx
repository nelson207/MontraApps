import { Link } from "react-router-dom";
import NewsGallery from "@platform/features/news/components/NewsGallery";
import BreakdownChart from "@platform/features/insights/components/BreakdownChart";
import TrendChart from "@platform/features/insights/components/TrendChart";
import UpcomingList from "@platform/features/insights/components/UpcomingList";
import { useGetContractsQuery } from "../../contracts/api/contractsApi";
import RoleBadge from "../../contracts/components/RoleBadge";
import {
  formatDate,
  formatEuro,
  isHolder,
  paymentsAhead,
  portfolioSummary,
  todayLocal,
  type Contract,
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

// Montra Customer home: news, then what a credit customer needs at a glance. News sits outside
// the contracts overview so it still shows while the contracts load, fail or don't exist.
function DashboardPage() {
  return (
    <div className="d-flex flex-column gap-4">
      <NewsGallery />
      <ContractsOverview />
    </div>
  );
}

// The next payment, anything overdue, what is still owed and paid each month, the contracts
// guaranteed for others, the payments ahead and how far each contract is repaid.
function ContractsOverview() {
  const { data: contracts, isLoading, isError, refetch } = useGetContractsQuery();
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

  if (isLoading || !contracts)
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );

  if (contracts.length === 0)
    return (
      <div className="card shadow-sm border-0">
        <div className="card-body text-center p-5 text-body-secondary">You have no active contracts.</div>
      </div>
    );

  const summary = portfolioSummary(contracts);
  const held = contracts.filter(isHolder);
  const overdueContracts = held.filter((c) => c.overdueAmount > 0);
  const ahead = paymentsAhead(contracts, today, 12);
  const byId = (id: number) => contracts.find((c) => c.id === id) as Contract;

  return (
    // app-viz: the chart colours (platform/styles/insights.scss)
    <div className="d-flex flex-column gap-4 app-viz">
      {overdueContracts.length > 0 && (
        <div className="alert alert-danger d-flex flex-wrap align-items-center gap-2 mb-0" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span className="flex-grow-1">
            <strong>{formatEuro(summary.overdue.amount)} overdue</strong> on{" "}
            {overdueContracts.map((c) => c.number).join(", ")}. Pay it as soon as you can to stop late payment interest.
          </span>
          <Link to={`/contracts/${overdueContracts[0].id}`} className="btn btn-sm btn-danger">
            See the contract
          </Link>
        </div>
      )}

      <div className="row g-3">
        <div className="col-12 col-md-6 col-xl">
          <div className="app-kpi is-primary">
            <span className="app-kpi-label">
              <i className="bi bi-calendar-event me-2" aria-hidden="true" />
              Next payment
            </span>
            {summary.next ? (
              <>
                <span className="app-kpi-value">{formatEuro(summary.next.amount)}</span>
                <span className="app-kpi-note">
                  {formatDate(summary.next.date)} · {inDays(daysUntil(summary.next.date, today))}
                </span>
                <Link to={`/contracts/${summary.next.contractId}`} className="app-kpi-link">
                  {summary.next.contractNumber}
                </Link>
              </>
            ) : (
              <span className="app-kpi-value">—</span>
            )}
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl">
          <div className={`app-kpi ${summary.overdue.amount > 0 ? "is-danger" : "is-success"}`}>
            <span className="app-kpi-label">
              <i className={`bi ${summary.overdue.amount > 0 ? "bi-exclamation-circle" : "bi-check-circle"} me-2`} aria-hidden="true" />
              Overdue
            </span>
            <span className="app-kpi-value">{formatEuro(summary.overdue.amount)}</span>
            <span className="app-kpi-note">
              {summary.overdue.contracts > 0
                ? `On ${summary.overdue.contracts} ${summary.overdue.contracts === 1 ? "contract" : "contracts"}`
                : "You're up to date"}
            </span>
          </div>
        </div>
        <div className="col-6 col-xl">
          <div className="app-kpi">
            <span className="app-kpi-label">Still owed</span>
            <span className="app-kpi-value">{formatEuro(summary.outstanding)}</span>
            <span className="app-kpi-note">
              On {summary.holding} {summary.holding === 1 ? "contract" : "contracts"}
            </span>
          </div>
        </div>
        <div className="col-6 col-xl">
          <div className="app-kpi">
            <span className="app-kpi-label">Paid each month</span>
            <span className="app-kpi-value">{formatEuro(summary.monthly)}</span>
            <span className="app-kpi-note">All your contracts</span>
          </div>
        </div>
        {summary.guarantees.contracts > 0 && (
          <div className="col-12 col-xl">
            <div className={`app-kpi ${summary.guarantees.overdueAmount > 0 ? "is-warning" : ""}`}>
              <span className="app-kpi-label">
                <i className="bi bi-shield-check me-2" aria-hidden="true" />
                As guarantor
              </span>
              <span className="app-kpi-value">{formatEuro(summary.guarantees.outstanding)}</span>
              <span className="app-kpi-note">
                {summary.guarantees.contracts} {summary.guarantees.contracts === 1 ? "contract" : "contracts"}
                {summary.guarantees.overdueAmount > 0 && ` · ${formatEuro(summary.guarantees.overdueAmount)} overdue`}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <TrendChart
            trend={{
              title: "My payments, next 12 months",
              subtitle: "Every contract until it ends",
              format: "currency",
              labels: ahead.map((m, i) => monthLabel(m.month, i)),
              series: [{ label: "Payments", values: ahead.map((m) => m.amount) }],
            }}
          />
        </div>
        <div className="col-12 col-xl-4">
          <UpcomingList
            upcoming={{
              title: "Coming up",
              rows: contracts
                .filter((c) => c.nextDueDate && c.nextAmount != null)
                .sort((a, b) => a.nextDueDate!.localeCompare(b.nextDueDate!))
                .map((c) => ({
                  id: String(c.id),
                  title: `${formatEuro(c.nextAmount!)} · ${c.business}`,
                  detail: isHolder(c) ? c.number : `${c.number} (as guarantor)`,
                  date: c.nextDueDate!,
                })),
            }}
          />
        </div>
        <div className="col-12 col-xl-6">
          <BreakdownChart
            breakdown={{
              id: "owed",
              title: "Still owed, by contract",
              subtitle: `${formatEuro(summary.outstanding)} in total`,
              format: "currency",
              segments: held.map((c) => ({ label: `${c.business} · ${c.number}`, value: c.outstanding })),
            }}
          />
        </div>
        <div className="col-12 col-xl-6">
          <section className="app-viz-card p-3 h-100" aria-label="How far each contract is repaid">
            <h3 className="app-viz-title mb-3">Repaid so far</h3>
            <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
              {contracts.map((c) => {
                const repaid = Math.round((c.paidInstallments / c.term) * 100);
                return (
                  <li key={c.id}>
                    <Link to={`/contracts/${c.id}`} className="app-progress-link">
                      <span className="d-flex flex-wrap align-items-center gap-2 small mb-1">
                        <span className="fw-semibold">{byId(c.id).number}</span>
                        <RoleBadge role={c.role} />
                        <span className="ms-auto text-body-secondary">
                          {c.paidInstallments}/{c.term} · {repaid}%
                        </span>
                      </span>
                      <span
                        className="progress app-repaid-progress"
                        role="progressbar"
                        aria-label={`${c.number}: ${repaid}% repaid`}
                        aria-valuenow={repaid}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <span className={`progress-bar ${c.overdueAmount > 0 ? "bg-danger" : ""}`} style={{ width: `${repaid}%` }} />
                      </span>
                      <span className="d-block small text-body-secondary mt-1">
                        Ends {formatDate(c.endDate)} · {formatEuro(c.outstanding)} left
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

export default DashboardPage;
