import { useFactoringText } from "../factoringText";
import { useFactoringFormat } from "../model/format";
import { kindClass, kindLabel, type Agreement } from "../model/factoring";
import { LoadProblem } from "./FactoringStates";

type Props = {
  agreements: Agreement[] | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  value: string | null;
  onChange: (agreement: Agreement) => void;
  /** Also when it is the one already chosen: choosing moves the wizard on */
  /** Why this card can't be chosen on this screen; null when it can */
  disabledReason: (agreement: Agreement) => string | null;
  /** The line under a card: what choosing this kind of agreement means here */
  hint: (agreement: Agreement) => string;
  invalidMessage?: string;
};

const share = (part: number, whole: number) => Math.max(0, Math.min(100, Math.round((part / whole) * 100)));

/** "X available of Y", with a bar only when both are known. A missing amount is never drawn as 0. */
function Plafond({ label, available, total, currencyId }: { label?: string; available?: number | null; total?: number | null; currencyId?: string | null }) {
  const tx = useFactoringText();
  const { money } = useFactoringFormat();
  const left = available === null || available === undefined ? null : share(available, total || 1);
  const showBar = left !== null && !!total;
  return (
    <>
      <span className="d-flex justify-content-between gap-2 small mt-3 mb-1">
        <span>
          {label && <span className="text-body-secondary">{label}: </span>}
          {available === null || available === undefined ? (
            <span className="text-body-secondary">{tx("agreement.availableUnknown", "Available amount unavailable")}</span>
          ) : (
            <>
              <span className="fw-semibold">{money(available, currencyId)}</span> {tx("agreement.available", "available")}
            </>
          )}
        </span>
        {total !== null && total !== undefined && (
          <span className="text-body-secondary text-nowrap">{tx("agreement.ofTotal", "of {{total}}", { total: money(total, currencyId) ?? "" })}</span>
        )}
      </span>
      {showBar && (
        <span
          className="progress app-agreement-usage"
          role="progressbar"
          aria-label={tx("agreement.availableShare", "{{share}}% of the agreement available", { share: left })}
          aria-valuenow={left}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span className={`progress-bar ${left <= 10 ? "bg-danger" : left <= 25 ? "bg-warning" : ""}`} style={{ width: `${left}%` }} />
        </span>
      )}
    </>
  );
}

// The dealer's active agreements as cards, the same on New request and Advance: the kind, the
// financial institution, what is available and whatever terms the agreement has. The screen says
// which can't be chosen, and why.
function AgreementPicker({ agreements, isLoading, error, onRetry, value, onChange, disabledReason, hint, invalidMessage }: Props) {
  const tx = useFactoringText();
  const { percent } = useFactoringFormat();


  if (isLoading)
    return (
      <div className="row g-3" aria-busy="true">
        {[0, 1].map((i) => (
          <div className="col-12 col-lg-6" key={i}>
            <div className="app-agreement-card placeholder-glow">
              <span className="placeholder col-7 mb-2" />
              <span className="placeholder col-4 mb-3" />
              <span className="placeholder col-12" />
            </div>
          </div>
        ))}
      </div>
    );

  if (error)
    return <LoadProblem error={error} fallback={tx("agreement.loadError", "The agreements couldn't be loaded. Try again in a moment.")} onRetry={onRetry} />;

  if (!agreements?.length)
    return (
      <div className="alert alert-warning mb-0" role="status">
        {tx("agreement.empty", "You have no active factoring or confirming agreements. Contact the financial institution to set one up.")}
      </div>
    );

  return (
    <>
      <div className="row g-3" role="radiogroup" aria-label={tx("agreement.title", "Agreement")}>
        {agreements.map((agreement) => {
          const reason = disabledReason(agreement);
          const id = `agreement-${agreement.id}`;
          const { kind, currencyId, advancePercentage, maxTermDays, rate } = agreement;
          const showSubPlafond = kind === "Factoring" && agreement.withoutRecourseTotalAmount !== null && agreement.withoutRecourseTotalAmount !== undefined;
          return (
            <div className="col-12 col-lg-6 col-xxl-4 app-agreement-col" key={agreement.id}>
              <button
                type="button"
                role="radio"
                id={id}
                aria-checked={value === agreement.id}
                disabled={!!reason}
                className={`app-agreement-card ${value === agreement.id ? "is-selected" : ""} ${invalidMessage ? "is-invalid" : ""}`}
                onClick={() => onChange(agreement)}
                aria-describedby={reason ? `${id}-reason` : invalidMessage ? "agreement-feedback" : undefined}
              >
                <span className="d-flex align-items-start justify-content-between gap-2">
                  <span className="d-flex flex-wrap gap-1">
                    <span className={`badge rounded-pill ${kindClass(kind)}`}>
                      <i className={`bi ${kind === "Confirming" ? "bi-shop" : "bi-people"} me-1`} aria-hidden="true" />
                      {kindLabel(kind, tx)}
                    </span>
                    {agreement.withoutRecourse && <span className="badge rounded-pill bg-body-tertiary text-body border">{tx("agreement.withoutRecourse", "Without recourse")}</span>}
                  </span>
                  <i className="bi bi-check-circle-fill app-agreement-check" aria-hidden="true" />
                </span>
                <span className="d-block fw-semibold text-truncate mt-2">{agreement.financialInstitution ?? tx("common.unavailable", "Unavailable")}</span>
                {agreement.number !== null && agreement.number !== undefined && <span className="d-block small text-body-secondary">{agreement.number}</span>}

                <Plafond available={agreement.availableAmount} total={agreement.totalAmount} currencyId={currencyId} />
                {showSubPlafond && (
                  <Plafond
                    label={tx("agreement.withoutRecourse", "Without recourse")}
                    available={agreement.withoutRecourseAvailableAmount}
                    total={agreement.withoutRecourseTotalAmount}
                    currencyId={currencyId}
                  />
                )}

                {(advancePercentage != null || maxTermDays != null || rate != null) && (
                  <span className="d-flex flex-wrap gap-1 mt-3">
                    {advancePercentage != null && (
                      <span className="badge rounded-pill bg-body-tertiary text-body border">{tx("agreement.advanceChip", "{{percent}} advance", { percent: percent(advancePercentage) ?? "" })}</span>
                    )}
                    {maxTermDays != null && <span className="badge rounded-pill bg-body-tertiary text-body border">{tx("agreement.termChip", "Up to {{days}} days", { days: maxTermDays })}</span>}
                    {rate != null && <span className="badge rounded-pill bg-body-tertiary text-body border">{percent(rate)}</span>}
                  </span>
                )}
                {!reason && <span className="d-block small text-body-secondary mt-2">{hint(agreement)}</span>}
              </button>
              {/* Outside the card, which is dimmed while disabled: the reason is what has to be read */}
              {reason && (
                <div id={`${id}-reason`} className="small text-danger-emphasis mt-2">
                  <i className="bi bi-info-circle me-1" aria-hidden="true" />
                  {reason}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {invalidMessage && (
        <div id="agreement-feedback" className="invalid-feedback d-block">
          {invalidMessage}
        </div>
      )}
    </>
  );
}

export default AgreementPicker;
