import type { Stage } from "../model/credOperDraft";
import type { QuotationDataProps } from "../types/credoperTypes";
import type { FieldErrors } from "../validation/fieldRules";
import type { StepDef, StepId } from "./steps";

export type StepProps = {
  stage: Stage;
  /** All current validation errors (field path → message) */
  errors: FieldErrors;
  /** Errors are only shown after Next / Save / Convert */
  showErrors: boolean;
  goTo: (step: StepId) => void;
  /** Moves on to the next step once the change just made is applied (the Business step after a pick) */
  advance: () => void;
  /** The operation's steps (as the wizard shows them) */
  steps: StepDef[];
  /** Each step's current errors */
  errorsByStep: Partial<Record<StepId, FieldErrors>>;
  /** Options and helpers the existing field forms need */
  formProps: QuotationDataProps;
};
