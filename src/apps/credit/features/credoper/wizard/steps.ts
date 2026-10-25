import { businessOf, equipmentModeOf, hasEquipment, hasFinancing, isAutoInsurance } from "../model/business";
import { convertedFromQuotation, type CredOperDraft, type Stage } from "../model/credOperDraft";
import type { FieldErrors } from "../validation/fieldRules";
import { validateCustomer } from "../customer/customerRules";
import type { LocalDate } from "../validation/localDate";
import {
  validateBusiness,
  validateCompany,
  validateEquipment,
  validateFinancial,
  validateInsurancesStep,
  validateInterventions,
} from "../validation/stepValidation";

// Wizard configuration (spec §2): the steps of a quotation / proposal depend on its business
// (model/business.ts): with or without equipment, financed or not (Auto insurance).

export type StepId =
  | "business"
  | "company"
  | "quotation"
  | "customer"
  | "equipment"
  | "financial"
  | "interventions"
  | "insurances"
  | "summary";

export type StepDef = {
  id: StepId;
  label: string;
  /** Bootstrap Icons class */
  icon: string;
  validate: (op: CredOperDraft, today: LocalDate) => FieldErrors;
};

const business: StepDef = { id: "business", label: "Business", icon: "bi-grid", validate: validateBusiness };
/** Only when the business can be done with several companies */
const company: StepDef = { id: "company", label: "Company", icon: "bi-building", validate: validateCompany };
const customer: StepDef = { id: "customer", label: "Customer", icon: "bi-person", validate: validateCustomer };
/** Converted proposal, step 1: the source quotation, read-only (nothing to fix there). */
const quotation: StepDef = { id: "quotation", label: "Quotation", icon: "bi-file-earmark-text", validate: () => ({}) };
const financial: StepDef = { id: "financial", label: "Financial data", icon: "bi-cash-coin", validate: validateFinancial };
const interventions: StepDef = {
  id: "interventions",
  label: "Interventions",
  icon: "bi-people",
  validate: validateInterventions,
};
const summary: StepDef = { id: "summary", label: "Summary", icon: "bi-clipboard-check", validate: () => ({}) };

const equipmentStep = (op: CredOperDraft): StepDef => ({
  id: "equipment",
  label: equipmentModeOf(op) === "multiple" ? "Vehicles" : isAutoInsurance(op) ? "Vehicle" : "Equipment detail",
  icon: equipmentModeOf(op) === "multiple" ? "bi-collection" : "bi-car-front",
  validate: validateEquipment,
});

const insurancesStep = (op: CredOperDraft): StepDef => ({
  id: "insurances",
  label: isAutoInsurance(op) ? "Insurance" : "Insurances",
  icon: "bi-shield-check",
  validate: validateInsurancesStep,
});

export type StepOptions = {
  /** False when the user has a single business (chosen for them, can't change) */
  chooseBusiness?: boolean;
  /** True when the chosen business can be done with several companies (otherwise it's decided) */
  chooseCompany?: boolean;
};

/**
 * The steps of an operation:
 *   [Business] → [Company] → Customer (or the read-only Quotation of a converted proposal)
 *   → Equipment (businesses with equipment) → Financial data (financed businesses)
 *   → Interventions (proposal) → Insurances (proposal; Auto insurance: also the quotation)
 *   → Summary.
 * Until a business is chosen there's only the Business step. A converted proposal keeps
 * its quotation's business.
 */
export function stepsFor(
  stage: Stage,
  op: CredOperDraft,
  { chooseBusiness = true, chooseCompany = false }: StepOptions = {},
): StepDef[] {
  if (!businessOf(op)) return [business];
  const converted = convertedFromQuotation(op);
  const steps: StepDef[] = [];
  if (chooseBusiness && !converted) steps.push(business);
  if (chooseCompany && !converted) steps.push(company);
  steps.push(converted ? quotation : customer);
  if (hasEquipment(op)) steps.push(equipmentStep(op));
  if (hasFinancing(op)) steps.push(financial);
  if (stage === "proposal") steps.push(interventions);
  if (stage === "proposal" || isAutoInsurance(op)) steps.push(insurancesStep(op));
  steps.push(summary);
  return steps;
}

/** All errors of the given steps (also per step), and the first step that has any. */
export function validateStages(
  steps: StepDef[],
  op: CredOperDraft,
  today: LocalDate,
): { errors: FieldErrors; byStep: Partial<Record<StepId, FieldErrors>>; firstInvalidStep?: StepId; invalidSteps: StepId[] } {
  const errors: FieldErrors = {};
  const byStep: Partial<Record<StepId, FieldErrors>> = {};
  const invalidSteps: StepId[] = [];
  steps.forEach((step) => {
    const stepErrors = step.validate(op, today);
    byStep[step.id] = stepErrors;
    if (Object.keys(stepErrors).length > 0) invalidSteps.push(step.id);
    Object.assign(errors, stepErrors);
  });
  return { errors, byStep, firstInvalidStep: invalidSteps[0], invalidSteps };
}

export type StepIssues = { step: StepDef; issues: { key: string; message: string }[] };

/** Each step's errors (from validateStages().byStep), in step order; steps without any left out. */
export function issuesByStep(steps: StepDef[], byStep: Partial<Record<StepId, FieldErrors>>): StepIssues[] {
  return steps
    .map((step) => ({
      step,
      issues: Object.entries(byStep[step.id] ?? {}).map(([key, message]) => ({ key, message })),
    }))
    .filter((group) => group.issues.length > 0);
}

/**
 * Person sub-tab (InterventionsSection) for an intervention error key:
 * 1 Details (entity name), 2 Address, 3 Legal document, 4 Person details.
 */
export function interventionTabOfErrorKey(key: string): 1 | 2 | 3 | 4 {
  if (key.includes(".entity.legalDocs.")) return 3;
  if (key.includes(".person.")) return 4;
  if (key.includes("Address")) return 2;
  return 1;
}
