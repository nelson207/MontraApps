import type { QuotationDataProps } from "../../types/credoperTypes";
import type { FieldErrors } from "../../validation/fieldRules";
import FinancingFields from "./FinancingFields";

// Financial data: the financing (vehicles are in the Equipment step). Same for every business
// that is financed, quotation and proposal.
function FinancialData({ errors = {}, ...formProps }: QuotationDataProps & { errors?: FieldErrors }) {
  return (
    <>
      <h4 className="app-form-section">
        <i className="bi bi-cash-coin me-2" aria-hidden="true" />
        Financing
      </h4>
      <FinancingFields {...formProps} errors={errors} />
    </>
  );
}

export default FinancialData;
