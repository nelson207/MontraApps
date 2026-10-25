import { selectCredoper, useAppSelector } from "@credit/store";
import { hasFinancing } from "../../model/business";
import type { StepProps } from "../../wizard/stepTypes";
import { BusinessCard, CustomerCard, FinancingCard, VehicleCards } from "../review/ReviewCards";

// Converted proposal, step 1: the quotation it came from, read-only (Summary card style).
// The customer and the business can't be changed on the proposal; vehicles and financing are
// edited in their steps.
function QuotationStep({ formProps }: StepProps) {
  const op = useAppSelector(selectCredoper);
  if (!op) return null;

  return (
    <div className="d-flex flex-column gap-4">
      <div className="app-readiness is-origin" role="note">
        <i className="bi bi-file-earmark-text app-readiness-icon" aria-hidden="true" />
        <div>
          <div className="fw-semibold">Converted from a quotation</div>
          <div className="small text-body-secondary">
            This is the quotation this proposal started from. Its customer details are read-only.
          </div>
        </div>
      </div>

      <div className="row g-3">
        <BusinessCard op={op} />
        <CustomerCard op={op} />
        <VehicleCards op={op} />
        {hasFinancing(op) && <FinancingCard op={op} options={formProps.options} />}
      </div>
    </div>
  );
}

export default QuotationStep;
