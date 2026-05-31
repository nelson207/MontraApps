import { useMemo, useEffect, useState } from "react";
import WizardHeader from "../components/navigation/credoperWizard";
import CustomerDetail from "../forms/customerDetail";
import FinancialData from "../forms/financialData";
import CreditSummary from "../forms/creditSummary";
import type { SymbolLimit } from "../../../services/api/generated/MontraPOSApi";
import { useGetApiCreditOperationsGetNewCredOperQuery } from "../../../services/api/generated/MontraPOSApi";
import {
  useAppDispatch,
  useAppSelector,
  selectCredoper,
} from "../../../app/store";
import { setCredoper } from "../credoperSlice";
import type { QuotationProps } from "../types/credoperTypes";
import { DEFAULT_TERM_RESTRICTIONS } from "../utils/quotations.constants";
import { buildTermTicks } from "../utils/helpers";
import useQuotationBootstrap from "../hooks/useQuotationBootstrap";
import { useQuotationOptions } from "../hooks/useQuotationOptions";
import useFinancialProductSync from "../hooks/useFinancialProductSync";
import CreditDetail from "../forms/creditDetail";

function Quotation({ credOperStep = 1 }: QuotationProps) {
  const dispatch = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);

  const equipmentTypeId =
    credoper?.assets?.[0]?.equipment?.equipmentTypeId ?? undefined;

  const { options } = useQuotationOptions({ equipmentTypeId });

  const {
    fetchingFinancialProducts,
    fetchingEquipmentTypes,
    fetchingEquipmentStates,
    fetchingEquipmentCategories,
    fetchingCredoperClassifications,
  } = useQuotationBootstrap();

  const [step, setStep] = useState<number>(1);
  const [termRestrictions, setTermRestrictions] = useState<SymbolLimit>(
    DEFAULT_TERM_RESTRICTIONS,
  );

  const financialProduct = useFinancialProductSync(
    credoper,
    credOperStep,
  ).financialProduct;

  const fetchingOptions = {
    financialProducts: fetchingFinancialProducts,
    equipmentTypes: fetchingEquipmentTypes,
    equipmentStates: fetchingEquipmentStates,
    equipmentCategories: fetchingEquipmentCategories,
    credOperClassifications: fetchingCredoperClassifications,
  };

  const { data: newCredoper } = useGetApiCreditOperationsGetNewCredOperQuery(
    { includeCustomer: false },
    {
      skip: !!credoper,
    },
  );

  useEffect(() => {
    if (!credoper && newCredoper) {
      dispatch(setCredoper(newCredoper));
    }
  }, [credoper, newCredoper, dispatch]);

  const termTicks = useMemo(
    () => buildTermTicks(termRestrictions),
    [
      (credoper as any)?.minTerm,
      (credoper as any)?.maxTerm,
      (credoper as any)?.termStep,
    ],
  );

  const steps = [
    { id: 1, label: "Customer Details", component: CustomerDetail },
    { id: 2, label: "Financial Data", component: FinancialData },
    { id: 3, label: "Credit Summary", component: CreditSummary },
  ];

  const currentStep = steps.find((s) => s.id === step);
  const CurrentStepComponent = currentStep?.component;

  return (
    <div className="container-fluid">
      <WizardHeader
        steps={steps.map(({ label }) => ({ label }))}
        currentStep={step}
        onStepClick={setStep}
      />
      <div className="mb-3">
        <span className="text-muted">
          Company ID: {credoper?.aplCompanyId ?? ""}
        </span>
        <span className="text-muted ms-3">
          Business ID: {credoper?.aplBusinessId ?? ""}
        </span>
        <span className="text-muted ms-3">
          Opertype ID: {credoper?.credOperTypeId ?? ""}
        </span>
        <span className="text-muted ms-3">
          Entry Date: {credoper?.entryDate ?? ""}
        </span>
        <span className="text-muted ms-3">
          CredOperNumber: {credoper?.credOperNumber ?? ""}
        </span>
      </div>

      <div className="row mt-3">
        {/* Left side: wizard/form */}
        <div className="col-12 col-lg-9">
          {CurrentStepComponent && (
            <CurrentStepComponent
              options={options}
              fetchingOptions={fetchingOptions}
              termTicks={termTicks}
              dispatchCredOper={dispatch}
              financialProduct={financialProduct}
            />
          )}
        </div>
        {/* Right side: resume/summary */}
        <div className="col-12 col-lg-3 mt-4 mt-lg-0">
          <CreditDetail />
        </div>
      </div>
    </div>
  );
}

export default Quotation;
