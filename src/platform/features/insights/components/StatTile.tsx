import { changeOf, formatValue, type Kpi } from "../insightsModel";

const ARROWS = { up: "bi-arrow-up-right", down: "bi-arrow-down-right", flat: "bi-dash" } as const;

/** 12-ish point trend in the de-emphasis grey, the current period as an accent dot */
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const width = 96;
  const height = 28;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const x = (i: number) => (i / (values.length - 1)) * (width - 6) + 3;
  const y = (v: number) => height - 4 - ((v - min) / (max - min || 1)) * (height - 8);
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const last = values.length - 1;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="flex-shrink-0">
      <polyline points={points} fill="none" stroke="var(--viz-spark)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last)} cy={y(values[last])} r={4} fill="var(--viz-series-1)" stroke="var(--viz-surface)" strokeWidth={2} />
    </svg>
  );
}

// KPI: label · value · change vs the previous period (colour = direction × whether up is good) · trend.
function StatTile({ kpi }: { kpi: Kpi }) {
  const change = changeOf(kpi.value, kpi.previous, kpi.upIsGood, kpi.format);
  const tone = !change || change.good === null ? "is-flat" : change.good ? "is-good" : "is-bad";

  return (
    <div className="app-viz-card p-3 d-flex flex-column gap-1">
      <div className="small text-body-secondary">{kpi.label}</div>
      <div className="d-flex align-items-end justify-content-between gap-2">
        <div className="app-stat-value">{formatValue(kpi.value, kpi.format)}</div>
        <Sparkline values={kpi.trend} />
      </div>
      <div className={`app-stat-delta ${tone}`}>
        {change ? (
          <>
            <i className={`bi ${ARROWS[change.direction]} me-1`} aria-hidden="true" />
            {change.text}
            <span className="fw-normal text-body-secondary"> vs previous period</span>
          </>
        ) : (
          <span className="fw-normal text-body-secondary">No previous period</span>
        )}
      </div>
    </div>
  );
}

export default StatTile;
