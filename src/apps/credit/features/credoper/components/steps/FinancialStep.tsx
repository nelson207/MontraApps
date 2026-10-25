import type { StepProps } from "../../wizard/stepTypes";
import FinancialData from "../forms/FinancialData";

// Financial data step: the financing (vehicles are in the Equipment step).
function FinancialStep({ errors, formProps }: StepProps) {
  return <FinancialData {...formProps} errors={errors} />;
}

export default FinancialStep;
