import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { formatValue, niceScale, type Trend } from "../insightsModel";
import ChartCard from "./ChartCard";
import { seriesColor } from "./vizColors";

const HEIGHT = 220; // includes the x-axis band
const PAD = { top: 12, right: 12, bottom: 26, left: 40 };

/** Width of the container, so text stays at its real size (no viewBox scaling) */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

// Several series over time on ONE axis: 2px lines, end dots with a surface ring, hairline grid.
// The crosshair snaps to the nearest point and the tooltip lists every series (values first);
// ←/→ move it from the keyboard. The table view has every value.
function TrendChart({ trend }: { trend: Trend }) {
  const { ref, width } = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const points = trend.labels.length;
  const { max, ticks } = niceScale(Math.max(...trend.series.flatMap((s) => s.values), 0));

  const plotWidth = width - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points <= 1 ? plotWidth / 2 : (i / (points - 1)) * plotWidth);
  const y = (v: number) => PAD.top + plotHeight - (v / max) * plotHeight;
  // Thin the x labels so they never collide
  const every = Math.max(1, Math.ceil(points / Math.max(2, Math.floor(plotWidth / 56))));

  const nearest = (clientX: number, rect: DOMRect) => {
    const ratio = (clientX - rect.left - PAD.left) / plotWidth;
    return Math.min(points - 1, Math.max(0, Math.round(ratio * (points - 1))));
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => setActive(nearest(e.clientX, e.currentTarget.getBoundingClientRect()));
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setActive((i) => {
      const current = i ?? points - 1;
      return e.key === "ArrowLeft" ? Math.max(0, current - 1) : Math.min(points - 1, current + 1);
    });
  };

  const tooltipLeft = active === null ? 0 : x(active) > width - 170 ? x(active) - 160 : x(active) + 10;

  return (
    <ChartCard
      title={trend.title}
      subtitle={trend.subtitle}
      table={{
        headers: ["Period", ...trend.series.map((s) => s.label)],
        rows: trend.labels.map((label, i) => [label, ...trend.series.map((s) => formatValue(s.values[i] ?? 0, trend.format ?? "number"))]),
      }}
    >
      {trend.series.length > 1 && (
        <ul className="list-unstyled d-flex flex-wrap gap-3 small mb-0">
          {trend.series.map((s, i) => (
            <li key={s.label} className="d-flex align-items-center gap-2">
              <span className="app-viz-linekey" style={{ backgroundColor: seriesColor(i) }} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      )}

      <div
        ref={ref}
        className="app-trend"
        tabIndex={0}
        role="group"
        aria-label={`${trend.title}. Use the left and right arrow keys to read the values.`}
        onKeyDown={onKeyDown}
        onFocus={() => setActive((i) => i ?? points - 1)}
        onBlur={() => setActive(null)}
      >
        <svg width={width} height={HEIGHT} onPointerMove={onPointerMove} onPointerLeave={() => setActive(null)} aria-hidden="true">
          {ticks.map((t) => (
            <g key={t}>
              <line className={t === 0 ? "app-trend-axis" : "app-trend-grid"} x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
              <text className="app-trend-tick" x={PAD.left - 6} y={y(t)} textAnchor="end" dominantBaseline="middle">
                {formatValue(t, trend.format ?? "number")}
              </text>
            </g>
          ))}
          {trend.labels.map((label, i) =>
            i % every === 0 || i === points - 1 ? (
              <text key={label + i} className="app-trend-tick" x={x(i)} y={HEIGHT - 8} textAnchor="middle">
                {label}
              </text>
            ) : null,
          )}

          {active !== null && <line className="app-trend-axis" x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotHeight} />}

          {trend.series.map((s, si) => (
            <g key={s.label}>
              <polyline
                points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
                fill="none"
                stroke={seriesColor(si)}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* end dot, or the active point */}
              <circle
                cx={x(active ?? points - 1)}
                cy={y(s.values[active ?? points - 1] ?? 0)}
                r={4}
                fill={seriesColor(si)}
                stroke="var(--viz-surface)"
                strokeWidth={2}
              />
            </g>
          ))}
        </svg>

        {active !== null && (
          <div className="app-viz-tooltip" style={{ top: PAD.top, left: tooltipLeft }} role="status">
            <div className="text-body-secondary mb-1">{trend.labels[active]}</div>
            {trend.series.map((s, i) => (
              <div key={s.label} className="d-flex align-items-center gap-2">
                <span className="app-viz-linekey" style={{ backgroundColor: seriesColor(i) }} />
                <strong>{formatValue(s.values[active] ?? 0, trend.format ?? "number")}</strong>
                <span className="text-body-secondary">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ChartCard>
  );
}

export default TrendChart;
