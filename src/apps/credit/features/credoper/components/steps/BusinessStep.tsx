import { problemMessage } from "@platform/api/problemCode";
import { selectCredoper, useAppDispatch, useAppSelector } from "@credit/store";
import { useBusinessChoices } from "../../business/useBusinessChoices";
import { patchCredoper, setInsurances } from "../../credoperSlice";
import { businessOf, changeBusiness, type Business } from "../../model/business";
import type { StepProps } from "../../wizard/stepTypes";

const FEATURES = (b: Business) =>
  [
    b.equipment === "multiple" ? "Several vehicles" : b.equipment === "single" ? "One vehicle" : "No equipment",
    b.financing ? "Financed" : "Not financed",
  ].join(" · ");

// Step 0 of every quotation / proposal: the business (cards, from
// GET /api/credit-operations/businesses: the configured companies' businesses), which decides the
// other steps. Its financial products are chosen later, on Financial data, from the same answer.
// Changing it later asks first when that removes data (vehicles, insurances).
function BusinessStep({ stage, errors, advance }: StepProps) {
  const dispatch = useAppDispatch();
  const op = useAppSelector(selectCredoper);
  const { data: businesses, isLoading, isError, error, refetch } = useBusinessChoices(stage, op);
  if (!op) return null;
  const current = businessOf(op);

  const choose = (business: Business) => {
    // Picking a business moves on to the next step (the same one again too)
    if (business.id === current?.id) return advance();
    const { next, removed } = changeBusiness(op, business.id);
    if (removed.length > 0 && !window.confirm(`Change to ${business.label}? This removes ${removed.join(" and ")}.`)) {
      return;
    }
    dispatch(
      patchCredoper({
        aplBusinessId: next.aplBusinessId,
        financialProduct: next.financialProduct,
        assets: next.assets,
        // The companies depend on the business: chosen (or decided) again
        aplCompanyId: undefined,
      }),
    );
    if (next.insurances !== op.insurances) dispatch(setInsurances(next.insurances));
    advance();
  };

  if (isError) {
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
        <span className="flex-grow-1">{problemMessage(error) ?? "Couldn't load the businesses."}</span>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <fieldset>
      <legend className="text-body-secondary fs-6 mb-3">What is this operation for?</legend>
      {isLoading || !businesses ? (
        <div className="d-flex align-items-center gap-2 small text-body-secondary">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          Loading…
        </div>
      ) : businesses.length === 0 ? (
        <div className="alert alert-warning mb-0" role="status">
          No business available
        </div>
      ) : (
        <div className="row g-3" role="radiogroup" aria-label="Business">
          {businesses.map((business) => {
            const selected = business.id === current?.id;
            return (
              <div key={business.id} className="col-12 col-sm-6 col-xl-4">
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`app-business-card w-100 h-100 text-start ${selected ? "is-selected" : ""}`}
                  onClick={() => choose(business)}
                >
                  <span className="app-business-icon">
                    <i className={`bi ${business.icon}`} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-grow-1">
                    <span className="d-block fw-semibold">{business.label}</span>
                    {business.description && <span className="d-block small text-body-secondary">{business.description}</span>}
                    <span className="d-block small text-body-tertiary mt-1">{FEATURES(business)}</span>
                  </span>
                  {selected && <i className="bi bi-check-circle-fill app-business-check" aria-hidden="true" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {errors.aplBusinessId && <div className="invalid-feedback d-block mt-2">{errors.aplBusinessId}</div>}
    </fieldset>
  );
}

export default BusinessStep;
