import type { CalculationMessageDto } from "@platform/api/generated/MontraPOSApi";
import { useFactoringText } from "../factoringText";
import type { SubmissionFailure } from "../hooks/useSubmission";
import { factoringProblemMessage } from "../model/problems";

// The small pieces every factoring screen shares: loading, a failed load, messages from Accipiens.

export function Loading({ hint }: { hint?: string }) {
  const tx = useFactoringText();
  return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">{tx("common.loading", "Loading…")}</span>
      </div>
      {hint && <p className="small text-body-secondary mt-3 mb-0">{hint}</p>}
    </div>
  );
}

export function LoadProblem({ error, fallback, onRetry }: { error: unknown; fallback: string; onRetry?: () => void }) {
  const tx = useFactoringText();
  return (
    <div className="alert alert-danger d-flex align-items-center gap-2 mb-0" role="alert">
      <span className="flex-grow-1">{factoringProblemMessage(error, fallback)}</span>
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

/** Accipiens' and the API's messages: shown exactly as they come */
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

type FailureProps = {
  failure: SubmissionFailure;
  /** What a refusal means ("Nothing was saved.") */
  refused: string;
  /** Without a message of its own */
  fallback: string;
  notFound: string;
};

/** A definite failure: the form stays as it was, and the next try is a new attempt */
export function SubmitFailure({ failure, refused, fallback, notFound }: FailureProps) {
  return (
    <div className="mt-3">
      {failure.kind === "rejected" ? (
        <div className="alert alert-danger mb-0" role="alert">
          {factoringProblemMessage(failure.error, fallback, notFound)}
        </div>
      ) : (
        <>
          <p className="fw-semibold text-danger-emphasis mb-2" role="alert">
            {refused}
          </p>
          <ApiMessages messages={failure.messages} />
        </>
      )}
    </div>
  );
}
