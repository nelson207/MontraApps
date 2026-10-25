import type { ReactNode } from "react";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import SkeletonRows from "./SkeletonRows";

export type ResultsStatus = {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  /** Shown when the error has no message of its own */
  errorText?: string;
  onRetry?: () => void;
  isEmpty: boolean;
  empty: { icon: string; text: string; onClear?: () => void };
};

// One card: the toolbar on top, then the rows (or loading / error / empty), then the footer.
function ResultsPanel({
  toolbar,
  footer,
  status,
  skeletonRows,
  className = "",
  children,
}: {
  toolbar: ReactNode;
  footer?: ReactNode;
  status: ResultsStatus;
  skeletonRows?: number;
  className?: string;
  children?: ReactNode;
}) {
  const { isLoading, isError, error, errorText, onRetry, isEmpty, empty } = status;

  let body: ReactNode;
  if (isError) {
    body = (
      <div className="p-3">
        <div className="alert alert-danger d-flex flex-wrap align-items-center gap-2 mb-0" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span className="flex-grow-1">{getApiErrorMessage(error) ?? errorText ?? "Couldn't load the results."}</span>
          {onRetry && (
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  } else if (isLoading) {
    body = <SkeletonRows count={skeletonRows} />;
  } else if (isEmpty) {
    body = (
      <div className="app-results-empty">
        <i className={`bi ${empty.icon}`} aria-hidden="true" />
        <span>{empty.text}</span>
        {empty.onClear && (
          <button type="button" className="btn btn-link btn-sm p-0" onClick={empty.onClear}>
            Clear filters
          </button>
        )}
      </div>
    );
  } else {
    body = children;
  }

  return (
    <section className={`card border-0 shadow-sm app-results ${className}`}>
      {toolbar}
      <div className="app-results-body">{body}</div>
      {footer}
    </section>
  );
}

export default ResultsPanel;
