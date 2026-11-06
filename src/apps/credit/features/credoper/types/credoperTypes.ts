import type { AppDispatch } from "@credit/store";
import type {
  CodeAbbreviation,
  CredOperIntervDto,
} from "@platform/api/legacy/legacyApi";
import type { AvailableBusiness } from "../model/business";
import type { ClassificationOption } from "../model/credOperDraft";

export type QuotationDataProps = {
  options?: OptionsState;
  /** Which option lists are loading */
  fetchingOptions: Partial<Record<keyof OptionsState, boolean>>;
  termTicks?: number[];
  dispatchCredOper: AppDispatch;
};

export type QuotationProps = {
  credOperStep?: number;
};

export type OptionsState = {
  financialProducts: CodeAbbreviation[];
  credOperClassifications: ClassificationOption[];
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
  /** Required fields it still misses */
  missing?: number;
  /** Nothing required is missing, in a tab that has required fields */
  complete?: boolean;
};

export type WizardHeaderProps = {
  steps?: WizardHeaderStep[];
  currentStep?: number;
  onStepClick?: (step: number) => void;
};
