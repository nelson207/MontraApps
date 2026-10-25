import { useState } from "react";
import { formatValue, sharesOf, type Breakdown } from "../insightsModel";
import ChartCard from "./ChartCard";
import { seriesColor } from "./vizColors";

// Part-to-whole: one thin stacked bar (2px surface gaps) + a legend with the values.
// Each segment is focusable and shows its value in a tooltip; the table view has them all.
function BreakdownChart({ breakdown }: { breakdown: Breakdown }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const values = breakdown.segments.map((s) => s.value);
  const total = values.reduce((sum, v) => sum + v, 0);
  const shares = sharesOf(values);

  return (
    <ChartCard
      title={breakdown.title}
      subtitle={breakdown.subtitle ?? `${formatValue(total, breakdown.format ?? "number")} in total`}
      table={{
        headers: ["State", "Count", "Share"],
        rows: breakdown.segments.map((s, i) => [s.label, formatValue(s.value, breakdown.format ?? "number"), `${shares[i]}%`]),
      }}
    >
      <div className="position-relative">
        <div className="app-stack" role="list" aria-label={`${breakdown.title} by state`}>
          {breakdown.segments.map((segment, i) =>
            segment.value === 0 ? null : (
              <button
                key={segment.label}
                type="button"
                role="listitem"
                className="app-stack-segment"
                style={{ flexGrow: segment.value, backgroundColor: seriesColor(i) }}
                aria-label={`${segment.label}: ${formatValue(segment.value, breakdown.format ?? "number")} (${shares[i]}%)`}
                onPointerEnter={() => setHovered(i)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
              />
            ),
          )}
        </div>
        {hovered !== null && (
          <div className="app-viz-tooltip" style={{ top: 28, left: 0 }} role="status">
            <div className="d-flex align-items-center gap-2">
              <span className="app-viz-linekey" style={{ backgroundColor: seriesColor(hovered) }} />
              <strong>{formatValue(breakdown.segments[hovered].value, breakdown.format ?? "number")}</strong>
              <span className="text-body-secondary">{shares[hovered]}%</span>
            </div>
            <div className="text-body-secondary">{breakdown.segments[hovered].label}</div>
          </div>
        )}
      </div>

      <ul className="list-unstyled mb-0 d-flex flex-column gap-1 small">
        {breakdown.segments.map((segment, i) => (
          <li key={segment.label} className="d-flex align-items-center gap-2">
            <span className="app-viz-swatch" style={{ backgroundColor: seriesColor(i) }} aria-hidden="true" />
            <span className="flex-grow-1 text-truncate">{segment.label}</span>
            <span className="fw-semibold app-tabular">{formatValue(segment.value, breakdown.format ?? "number")}</span>
            <span className="text-body-secondary app-tabular" style={{ minWidth: "2.75rem", textAlign: "right" }}>
              {shares[i]}%
            </span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

export default BreakdownChart;
