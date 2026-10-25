import { availableOf, formatEuro, NATURE_LABELS, type FactoringAgreement } from "../model/factoring";

type Props = {
  agreements: FactoringAgreement[] | undefined;
  isLoading: boolean;
  isError: boolean;
  value: number | null;
  onChange: (agreementId: number) => void;
  invalidMessage?: string;
};

const NATURE_HINTS = {
  0: "Your customers' invoices: choose the debtor of each one.",
  1: "One supplier's invoices: choose the supplier once.",
} as const;

// The credit intermediary's agreements as radio cards: factoring or confirming, the financial
// company, what is still available and the terms. One with nothing available can't be chosen.
function AgreementPicker({ agreements, isLoading, isError, value, onChange, invalidMessage }: Props) {
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

  if (isError)
    return (
      <div className="alert alert-danger mb-0" role="alert">
        The agreements couldn't be loaded. Try again in a moment.
      </div>
    );

  if (!agreements?.length)
    return (
      <div className="alert alert-warning mb-0" role="status">
        This credit intermediary has no factoring or confirming agreements. Contact the financial company to set one up.
      </div>
    );

  return (
    <fieldset>
      <legend className="visually-hidden">Agreement</legend>
      <div className="row g-3">
        {agreements.map((agreement) => {
          const available = availableOf(agreement);
          const usedShare = Math.min(100, Math.round((agreement.used / agreement.creditLimit) * 100));
          const id = `agreement-${agreement.id}`;
          return (
            <div className="col-12 col-lg-6 col-xxl-3" key={agreement.id}>
              <input
                type="radio"
                className="btn-check"
                name="agreement"
                id={id}
                checked={value === agreement.id}
                disabled={available <= 0}
                onChange={() => onChange(agreement.id)}
                aria-describedby={invalidMessage ? "agreement-feedback" : undefined}
              />
              <label className={`app-agreement-card ${invalidMessage ? "is-invalid" : ""}`} htmlFor={id}>
                <span className="d-flex align-items-start justify-content-between gap-2">
                  <span className={`badge rounded-pill app-nature-badge is-nature-${agreement.nature}`}>
                    <i className={`bi ${agreement.nature === 1 ? "bi-shop" : "bi-people"} me-1`} aria-hidden="true" />
                    {NATURE_LABELS[agreement.nature]}
                  </span>
                  <i className="bi bi-check-circle-fill app-agreement-check" aria-hidden="true" />
                </span>
                <span className="d-block fw-semibold text-truncate mt-2">{agreement.financialCompany}</span>
                <span className="d-block small text-body-secondary">{agreement.number}</span>

                <span className="d-flex justify-content-between small mt-3 mb-1">
                  <span>
                    <span className="fw-semibold">{formatEuro(available)}</span> available
                  </span>
                  <span className="text-body-secondary">of {formatEuro(agreement.creditLimit)}</span>
                </span>
                <span
                  className="progress app-agreement-usage"
                  role="progressbar"
                  aria-label={`${usedShare}% of the agreement used`}
                  aria-valuenow={usedShare}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span className={`progress-bar ${usedShare >= 90 ? "bg-danger" : usedShare >= 75 ? "bg-warning" : ""}`} style={{ width: `${usedShare}%` }} />
                </span>

                <span className="d-flex flex-wrap gap-1 mt-3">
                  <span className="badge rounded-pill bg-body-tertiary text-body border">{agreement.advancePercent}% advance</span>
                  <span className="badge rounded-pill bg-body-tertiary text-body border">Up to {agreement.maxTermDays} days</span>
                  <span className="badge rounded-pill bg-body-tertiary text-body border">{agreement.rate.toFixed(2)}%</span>
                </span>
                <span className="d-block small text-body-secondary mt-2">{NATURE_HINTS[agreement.nature]}</span>
                {available <= 0 && <span className="d-block small text-danger mt-1">Nothing available</span>}
              </label>
            </div>
          );
        })}
      </div>
      {invalidMessage && (
        <div id="agreement-feedback" className="invalid-feedback d-block">
          {invalidMessage}
        </div>
      )}
    </fieldset>
  );
}

export default AgreementPicker;
