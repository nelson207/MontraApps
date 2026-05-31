import type { AppDispatch } from "../../../app/store";
import type {
  CodeAbbreviation,
  CredOperIntervDto,
  FinancialProductDto,
} from "../../../services/api/generated/MontraPOSApi";

export type QuotationDataProps = {
  options?: OptionsState;
  fetchingOptions: any;
  termTicks?: number[];
  dispatchCredOper: AppDispatch;
  financialProduct: FinancialProductDto | undefined;
};

export type QuotationProps = {
  credOperStep?: number;
};

export type OptionsState = {
  financialProducts: CodeAbbreviation[];
  equipmentTypes: CodeAbbreviation[];
  equipmentStates: CodeAbbreviation[];
  equipmentCategories: CodeAbbreviation[];
  credOperClassifications: CodeAbbreviation[];
};

export type UseQuotationOptionsParams = {
  equipmentTypeId?: number;
};

export type InterventionFormProps = {
  index?: number;
  intervention: CredOperIntervDto | null | undefined;
};

export type InterventionRole = "CUSTOMER" | "SECOND_HOLDER" | "GUARANTOR";

export type WizardHeaderStep = {
  label: string;
  icon?: string | null | undefined;
  id?: number | null | undefined;
};

export type WizardHeaderProps = {
  steps?: WizardHeaderStep[];
  currentStep?: number;
  onStepClick?: (step: number) => void;
};
