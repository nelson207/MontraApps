import { formatValue, type Ranking } from "../insightsModel";
import ChartCard from "./ChartCard";

// Nominal categories by one measure: one series, so every bar is slot 1 (no value ramp);
// biggest first, value at the bar end.
function RankingChart({ ranking }: { ranking: Ranking }) {
  const rows = [...ranking.rows].sort((a, b) => b.value - a.value);
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <ChartCard
      title={ranking.title}
      subtitle={ranking.subtitle}
      table={{ headers: ["Name", "Value"], rows: rows.map((r) => [r.label, formatValue(r.value, ranking.format)]) }}
    >
      <ol className="list-unstyled mb-0 d-flex flex-column gap-2">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="small text-truncate mb-1">{row.label}</div>
            <div className="app-hbar-track">
              <div
                className="app-hbar"
                style={{ width: `calc(${(row.value / max) * 100}% - 4.5rem)`, backgroundColor: "var(--viz-series-1)" }}
                aria-hidden="true"
              />
              <span className="app-hbar-value">{formatValue(row.value, ranking.format)}</span>
            </div>
          </li>
        ))}
      </ol>
    </ChartCard>
  );
}

export default RankingChart;
