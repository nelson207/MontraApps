import type { AppDispatch } from "@credit/store";
import type {
  CodeAbbreviation,
  CredOperIntervDto,
  FinancialProductDto,
} from "@platform/api/legacy/legacyApi";
import type { AvailableBusiness } from "../model/business";

export type QuotationDataProps = {
  options?: OptionsState;
  /** Which option lists are loading */
  fetchingOptions: Partial<Record<keyof OptionsState, boolean>>;
  termTicks?: number[];
  dispatchCredOper: AppDispatch;
  financialProduct: FinancialProductDto | undefined;
};

export type QuotationProps = {
  credOperStep?: number;
};

export type OptionsState = {
  financialProducts: CodeAbbreviation[];
  credOperClassifications: CodeAbbreviation[];
};

export type UseQuotationOptionsParams = {
  /** The operation's business, from the Business step's answer: its financial products are listed */
  business?: AvailableBusiness;
  /** The operation's company: only its products are listed */
  companyId?: number | null;
  /** That answer is still loading */
  loadingBusinesses: boolean;
};

export type InterventionFormProps = {
  index?: number;
  intervention: CredOperIntervDto | null | undefined;
  /** Validation messages to show (field path → message) */
  errors?: Record<string, string>;
};

export type InterventionRole = "CUSTOMER" | "SECOND_HOLDER" | "GUARANTOR";

export type WizardHeaderStep = {
  label: string;
  icon?: string | null | undefined;
  id?: number | null | undefined;
  /** Shows an error mark on the step */
  hasError?: boolean;
};

export type WizardHeaderProps = {
  steps?: WizardHeaderStep[];
  currentStep?: number;
  onStepClick?: (step: number) => void;
};
