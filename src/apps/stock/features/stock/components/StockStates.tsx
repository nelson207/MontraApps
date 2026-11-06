import type { CalculationMessageDto } from "@platform/api/generated/MontraPOSApi";
import { stockProblemMessage } from "../model/problems";
import { stateBadgeClass, stateLabel } from "../model/stockState";
import { useStockText } from "../stockText";

// The small pieces every stock screen shares: loading, a failed load, messages from Accipiens, a state badge.

export function Loading() {
  const tx = useStockText();
  return (
    <div className="d-flex justify-content-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">{tx("common.loading", "Loading…")}</span>
      </div>
    </div>
  );
}

export function LoadProblem({ error, fallback, onRetry }: { error: unknown; fallback: string; onRetry?: () => void }) {
  const tx = useStockText();
  return (
    <div className="alert alert-danger d-flex align-items-center gap-2 mb-0" role="alert">
      <span className="flex-grow-1">{stockProblemMessage(error, fallback)}</span>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>
          {tx("common.retry", "Retry")}
        </button>
      )}
    </div>
  );
}

const alertOf = (severity: string | null | undefined) => {
  const level = severity?.toLowerCase() ?? "";
  if (/err|fatal|crit/.test(level)) return "alert-danger";
  if (level.includes("warn")) return "alert-warning";
  return "alert-info";
};

/** Accipiens' messages, already translated: shown exactly as they come */
export function ApiMessages({ messages }: { messages: CalculationMessageDto[] | null | undefined }) {
  const shown = (messages ?? []).filter((message) => message.text?.trim());
  if (shown.length === 0) return null;
  return (
    <div className="d-flex flex-column gap-2 mb-3">
      {shown.map((message, i) => (
        <div key={i} className={`alert ${alertOf(message.severity)} mb-0`} role="alert">
          {message.text}
        </div>
      ))}
    </div>
  );
}

export function StateBadge({ state }: { state: string | null | undefined }) {
  const tx = useStockText();
  return <span className={`badge rounded-pill border ${stateBadgeClass(state)}`}>{stateLabel(state, tx)}</span>;
}
