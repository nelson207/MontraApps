import { problemMessage } from "@platform/api/problemCode";
import { selectCredoper, useAppDispatch, useAppSelector } from "@credit/store";
import { useCompanyChoices } from "../../business/useCompanyChoices";
import { patchCredoper } from "../../credoperSlice";
import { businessOf } from "../../model/business";
import type { StepProps } from "../../wizard/stepTypes";

// After Business, only when the chosen business can be done with several companies (otherwise the
// company is decided for the user and this step isn't shown).
function CompanyStep({ stage, errors, advance }: StepProps) {
  const dispatch = useAppDispatch();
  const op = useAppSelector(selectCredoper);
  const { data: companies, isError, error, refetch } = useCompanyChoices(stage, op);
  if (!op) return null;

  const choose = (companyId: number) => {
    // The financial products are the company's: a different company chooses the product again
    if (companyId !== op.aplCompanyId) dispatch(patchCredoper({ aplCompanyId: companyId, financialProduct: null }));
    advance();
  };

  if (isError) {
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
        <span className="flex-grow-1">{problemMessage(error) ?? "Couldn't load the companies."}</span>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <fieldset>
      <legend className="text-body-secondary fs-6 mb-3">
        Which company is this {businessOf(op)?.label.toLowerCase() ?? "operation"} with?
      </legend>
      {!companies ? (
        <div className="d-flex align-items-center gap-2 small text-body-secondary">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          Loading…
        </div>
      ) : companies.length === 0 ? (
        <div className="alert alert-warning mb-0" role="status">
          No company available for this business
        </div>
      ) : (
        <div className="row g-3" role="radiogroup" aria-label="Company">
          {companies.map((company) => {
            const selected = company.id === op.aplCompanyId;
            return (
              <div key={company.id} className="col-12 col-sm-6 col-xl-4">
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`app-business-card w-100 h-100 text-start ${selected ? "is-selected" : ""}`}
                  onClick={() => choose(company.id)}
                >
                  <span className="app-business-icon">
                    <i className="bi bi-building" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-grow-1 fw-semibold">{company.label}</span>
                  {selected && <i className="bi bi-check-circle-fill app-business-check" aria-hidden="true" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {errors.aplCompanyId && <div className="invalid-feedback d-block mt-2">{errors.aplCompanyId}</div>}
    </fieldset>
  );
}

export default CompanyStep;
