import type { StepProps } from "../../wizard/stepTypes";
import CustomerDetail from "./CustomerDetail";
import OperationHierarchyFields from "../../components/OperationHierarchyFields";

// Customer step: Commercial network + Customer (same fields as before).
function CustomerStep({ errors, formProps }: StepProps) {
  return (
    <>
      <h4 className="app-form-section">
        <i className="bi bi-diagram-3 me-2" aria-hidden="true" />
        Commercial network
      </h4>
      <OperationHierarchyFields errors={errors} />

      <h4 className="app-form-section">
        <i className="bi bi-person me-2" aria-hidden="true" />
        Customer
      </h4>
      <CustomerDetail {...formProps} errors={errors} />
    </>
  );
}

export default CustomerStep;
