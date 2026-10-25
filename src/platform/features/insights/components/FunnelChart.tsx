import { conversion, formatValue, type Funnel } from "../insightsModel";
import ChartCard from "./ChartCard";
import { ORDINAL } from "./vizColors";

// Ordered stages (e.g. quotation → proposal → approved → contract): one blue, light → dark,
// value at the bar end and the conversion from the previous stage.
function FunnelChart({ funnel }: { funnel: Funnel }) {
  const max = Math.max(...funnel.stages.map((s) => s.value), 1);
  const rate = (i: number) => (i === 0 ? null : conversion(funnel.stages[i].value, funnel.stages[i - 1].value));
  const overall = funnel.stages.length > 1 ? conversion(funnel.stages.at(-1)!.value, funnel.stages[0].value) : null;

  return (
    <ChartCard
      title={funnel.title}
      subtitle={funnel.subtitle ?? (overall !== null ? `${overall}% end to end` : undefined)}
      table={{
        headers: ["Stage", "Count", "From previous"],
        rows: funnel.stages.map((s, i) => [s.label, formatValue(s.value, "number"), rate(i) === null ? "—" : `${rate(i)}%`]),
      }}
    >
      <ol className="list-unstyled mb-0 d-flex flex-column gap-2">
        {funnel.stages.map((stage, i) => (
          <li key={stage.label}>
            <div className="d-flex justify-content-between small mb-1">
              <span>{stage.label}</span>
              {rate(i) !== null && <span className="text-body-secondary">{rate(i)}% of previous</span>}
            </div>
            <div className="app-hbar-track">
              <div
                className="app-hbar"
                style={{ width: `calc(${(stage.value / max) * 100}% - 4rem)`, backgroundColor: ORDINAL[Math.min(i, ORDINAL.length - 1)] }}
                aria-hidden="true"
              />
              <span className="app-hbar-value">{formatValue(stage.value, "number")}</span>
            </div>
          </li>
        ))}
      </ol>
    </ChartCard>
  );
}

export default FunnelChart;
