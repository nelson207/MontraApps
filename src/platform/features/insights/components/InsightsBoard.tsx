import { useState } from "react";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import HierarchySelects from "@platform/features/workContext/components/HierarchySelects";
import { EMPTY_SELECTION, type ContextSelection, type WorkProfile } from "@platform/features/workContext/hierarchy";
import { useWorkContext } from "@platform/features/workContext/hooks/useWorkContext";
import { useGetInsightsQuery } from "../api/insightsApi";
import { PERIODS, type InsightsFilters, type InsightsPeriod } from "../insightsModel";
import BreakdownChart from "./BreakdownChart";
import FunnelChart from "./FunnelChart";
import RankingChart from "./RankingChart";
import StatTile from "./StatTile";
import TrendChart from "./TrendChart";
import UpcomingList from "./UpcomingList";

/** "All" everywhere; a member (role) only sees their own figures */
const initialSelection = (profile: WorkProfile | undefined): ContextSelection =>
  profile?.role === "member" ? { ...EMPTY_SELECTION, member: profile.self } : EMPTY_SELECTION;

// The app's dashboards (Credit: commercial resume; Lawyer: legal actions), one board for every app:
// a filter row (period + working-context levels) scoping KPIs, status breakdowns, funnel,
// ranking, trend and upcoming items. What's in it comes from the app (apps/<app>/insights.ts).
function InsightsBoard() {
  const { profile } = useWorkContext();
  const [selection, setSelection] = useState<ContextSelection | null>(null);
  const [period, setPeriod] = useState<InsightsPeriod>("90d");

  const current = selection ?? initialSelection(profile);
  const filters: InsightsFilters = {
    organizationId: current.organization?.id ?? null,
    unitId: current.unit?.id ?? null,
    memberId: current.member?.id ?? null,
    period,
  };
  // `data` (not currentData): a refetch keeps the previous figures, dimmed, instead of a flash
  const { data, isFetching, isError, error, refetch } = useGetInsightsQuery(filters);

  return (
    <div className="app-viz d-flex flex-column gap-3">
      <div className="d-flex flex-wrap align-items-end gap-3">
        <div className="flex-grow-1" style={{ minWidth: "min(100%, 36rem)" }}>
          {profile && (
            <HierarchySelects
              value={current}
              profile={profile}
              onChange={setSelection}
              idPrefix="insights-filter"
              columnClassName="col-12 col-md-4"
              allowAll
            />
          )}
        </div>
        <div className="mb-3">
          <span className="form-label d-block" id="insights-period-label">
            Period
          </span>
          <div className="btn-group flex-wrap" role="radiogroup" aria-labelledby="insights-period-label">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={period === p.id}
                className={`btn btn-sm ${period === p.id ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isError && !data && (
        <div className="alert alert-danger d-flex flex-wrap align-items-center gap-2 mb-0" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span className="flex-grow-1">{getApiErrorMessage(error) ?? "Couldn't load the dashboards."}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {!data && !isError && (
        <div className="d-flex align-items-center gap-2 text-body-secondary small py-4">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          Loading dashboards…
        </div>
      )}

      {data && (
        <div className={`d-flex flex-column gap-3 ${isFetching ? "app-viz-refreshing" : ""}`} aria-busy={isFetching}>
          {data.isSample && (
            <div className="text-end">
              <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis border">Sample data</span>
            </div>
          )}

          <div className="row g-3">
            {data.kpis.map((kpi) => (
              <div key={kpi.id} className="col-12 col-sm-6 col-xl">
                <StatTile kpi={kpi} />
              </div>
            ))}
          </div>

          <div className="row g-3">
            {data.breakdowns.map((breakdown) => (
              <div key={breakdown.id} className={`col-12 ${data.breakdowns.length >= 3 ? "col-lg-4" : "col-lg-6"}`}>
                <BreakdownChart breakdown={breakdown} />
              </div>
            ))}
          </div>

          {(data.funnel || data.ranking || data.upcoming) && (
            <div className="row g-3">
              {data.funnel && (
                <div className="col-12 col-lg-6">
                  <FunnelChart funnel={data.funnel} />
                </div>
              )}
              {data.ranking && (
                <div className="col-12 col-lg-6">
                  <RankingChart ranking={data.ranking} />
                </div>
              )}
              {data.upcoming && (
                <div className="col-12 col-lg-6">
                  <UpcomingList upcoming={data.upcoming} />
                </div>
              )}
            </div>
          )}

          <TrendChart trend={data.trend} />
        </div>
      )}
    </div>
  );
}

export default InsightsBoard;
