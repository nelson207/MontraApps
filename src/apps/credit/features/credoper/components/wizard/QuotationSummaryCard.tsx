import { skipToken } from "@reduxjs/toolkit/query";
import { Link } from "react-router-dom";
import { useGetApiCreditOperationsCredoperByIdQuery } from "@platform/api/generated/MontraPOSApi";
import { problemStatus } from "@platform/api/problemCode";
import { quotationSummaryOf } from "../../api/credOperApi";
import type { AvailableBusiness } from "../../model/business";
import type { CredOperDraft } from "../../model/credOperDraft";
import { quotationSummaryFields } from "../../model/quotationSummary";
import { openOperationPath } from "../../session/useCredOperSession";

/**
 * The quotation a proposal was made from, read-only, linking to it. Converted just now: the
 * conversion's summary; reopened: read from GET credoper/{sourceCredOperId}. A quotation the user
 * can no longer see (404) has no summary: only a note (the proposal still keeps its company,
 * business and type). Shown on the proposal's Quotation step.
 */
function QuotationSummaryCard({ operation, businesses }: { operation: CredOperDraft; businesses: AvailableBusiness[] | undefined }) {
  const sourceId = operation.sourceCredOperId;
  const fetchIt = !operation.sourceQuotation && !!sourceId;
  const read = useGetApiCreditOperationsCredoperByIdQuery(fetchIt ? { id: encodeURIComponent(sourceId) } : skipToken);
  const summary = operation.sourceQuotation ?? (fetchIt && read.currentData?.id ? quotationSummaryOf(read.currentData) : null);

  if (!sourceId) return null;
  if (!summary) {
    if (problemStatus(read.error) === 404) {
      return (
        <p className="text-body-secondary mb-0" role="note">
          You can no longer see the quotation this proposal came from. Its company, business and operation type still
          can't be changed.
        </p>
      );
    }
    if (!fetchIt || (!read.error && !read.isFetching)) return null;
    return (
      <div className="small text-body-secondary d-flex align-items-center gap-2" role="status">
        {read.error ? (
          <>
            <i className="bi bi-exclamation-triangle text-warning" aria-hidden="true" />
            Couldn't load the quotation this proposal came from.
            <button type="button" className="btn btn-link btn-sm p-0" onClick={() => void read.refetch()}>
              Retry
            </button>
          </>
        ) : (
          <>
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            Loading the quotation this proposal came from…
          </>
        )}
      </div>
    );
  }

  const title = `Quotation${summary.number != null ? ` #${summary.number}` : ""}`;
  return (
    <section className="app-readiness is-origin" aria-labelledby="source-quotation-title">
      <i className="bi bi-file-earmark-text app-readiness-icon" aria-hidden="true" />
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <h4 id="source-quotation-title" className="h6 fw-semibold mb-2">
          From{" "}
          {summary.id ? <Link to={openOperationPath("quotation", summary.id)}>{title}</Link> : title}
          <span className="fw-normal text-body-secondary small ms-2">
            Its company, business and operation type can't be changed.
          </span>
        </h4>
        <dl className="row row-cols-2 row-cols-md-4 g-2 small mb-0">
          {quotationSummaryFields(summary, businesses).map(({ label, value }) => (
            <div key={label} className="col">
              <dt className="fw-normal text-body-secondary">{label}</dt>
              <dd className="mb-0 text-truncate">{value ?? "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export default QuotationSummaryCard;
