import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import type { CredOperDraft } from "../../model/credOperDraft";
import { money, percent, useCalculation } from "../../hooks/useCalculation";

// Sticky side panel on the editing steps: financed amount, monthly payment, rates, term ± and Calculate.
function SummaryPanel({ operation }: { operation: CredOperDraft }) {
  const calc = useCalculation(operation);

  return (
    <aside className="card border-0 shadow-sm app-summary-panel" aria-label="Calculation">
      <div className="card-body">
        <div className="text-center mb-3">
          <small className="text-body-secondary">Financed amount</small>
          <div className="h3 fw-bold mb-0">{operation.amount != null ? money.format(operation.amount) : "—"}</div>
        </div>

        <div className={`rounded-3 p-3 mb-3 text-center app-summary-monthly ${calc.isStale ? "is-stale" : ""}`}>
          <small className="text-body-secondary">Monthly payment</small>
          <div className="display-6 fw-bold">
            {calc.monthly != null ? money.format(calc.monthly) : "—"}
            <span className="fs-6 fw-normal text-body-secondary"> / month</span>
          </div>
          {calc.isStale && (
            <small className="text-warning-emphasis d-block mt-1">
              <i className="bi bi-arrow-repeat me-1" aria-hidden="true" />
              Values changed — recalculate
            </small>
          )}
        </div>

        <div className="row g-2 text-center mb-3">
          <div className="col-6">
            <div className="border rounded-3 py-2">
              <small className="text-body-secondary d-block">TAN</small>
              <strong>{percent(calc.condition?.implicitRate)}</strong>
            </div>
          </div>
          <div className="col-6">
            <div className="border rounded-3 py-2">
              <small className="text-body-secondary d-block">TAEG</small>
              <strong>{percent(calc.condition?.annualRate)}</strong>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <span className="form-label fw-semibold d-block">Term</span>
          <TermStepper calc={calc} />
        </div>

        {!!calc.error && (
          <div className="alert alert-danger small py-2" role="alert">
            {getApiErrorMessage(calc.error) ?? "Couldn't calculate. Please try again."}
          </div>
        )}

        <CalculateButton calc={calc} className="w-100" />
        <p className="text-body-secondary small text-center mt-2 mb-0">
          Indicative values, subject to approval.
        </p>
      </div>
    </aside>
  );
}

type Calc = ReturnType<typeof useCalculation>;

export function TermStepper({ calc }: { calc: Calc }) {
  return (
    <div className="d-flex align-items-center justify-content-between border rounded-3 p-2 gap-3">
      <button
        type="button"
        className="btn btn-outline-primary btn-sm rounded-circle"
        aria-label={`Decrease term by ${calc.termStep} months`}
        disabled={!calc.canDecrease}
        onClick={calc.decrease}
      >
        <i className="bi bi-dash" />
      </button>
      <div className="text-center" aria-live="polite">
        <strong className="fs-5">{calc.term ?? "—"}</strong>
        <small className="d-block text-body-secondary">months</small>
      </div>
      <button
        type="button"
        className="btn btn-outline-primary btn-sm rounded-circle"
        aria-label={`Increase term by ${calc.termStep} months`}
        disabled={!calc.canIncrease}
        onClick={calc.increase}
      >
        <i className="bi bi-plus" />
      </button>
    </div>
  );
}

export function CalculateButton({ calc, className = "" }: { calc: Calc; className?: string }) {
  return (
    <button type="button" className={`btn btn-primary ${className}`} onClick={calc.run} disabled={calc.isLoading}>
      {calc.isLoading ? (
        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
      ) : (
        <i className="bi bi-calculator me-2" aria-hidden="true" />
      )}
      {calc.isLoading ? "Calculating…" : "Calculate"}
    </button>
  );
}

export default SummaryPanel;
