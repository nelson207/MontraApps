import { businessOf, equipmentModeOf, hasBuilding, hasEquipment, hasFinancing, isAutoInsurance } from "../model/business";
import { convertedFromQuotation, type CredOperDraft, type Stage } from "../model/credOperDraft";
import type { FieldErrors } from "../validation/fieldRules";
import { validateCustomer } from "../customer/customerRules";
import type { LocalDate } from "../validation/localDate";
import {
  validateAssetType,
  validateBuilding,
  validateBusiness,
  validateCompany,
  validateEquipment,
  validateFinancial,
  validateInsurancesStep,
  validateInterventions,
} from "../validation/stepValidation";

// Wizard configuration (spec §2): the steps of a quotation / proposal depend on its business and
// asset type (model/business.ts): equipment, a building or no asset; financed or not (Auto insurance).

export type StepId =
  | "business"
  | "company"
  | "assetType"
  | "quotation"
  | "customer"
  | "equipment"
  | "building"
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
/** Only when the business offers several asset types in the company (otherwise it's decided) */
const assetType: StepDef = { id: "assetType", label: "Asset type", icon: "bi-boxes", validate: validateAssetType };
const building: StepDef = { id: "building", label: "Building detail", icon: "bi-house", validate: validateBuilding };
const customer: StepDef = { id: "customer", label: "Customer", icon: "bi-person", validate: validateCustomer };
/** A proposal made from a quotation, first step: the quotation's summary, read-only (nothing to fix there) */
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
  /** True when the business offers several asset types in the company (otherwise it's decided) */
  chooseAssetType?: boolean;
};

/**
 * The steps of an operation:
 *   [Business] → [Company] → [Asset type] → [Quotation: the one a proposal was made from, read-only]
 *   → Customer → Equipment (asset type equipment) or
 *   Building (asset type building; none for no asset) → Financial data (financed businesses)
 *   → Interventions (proposal) → Insurances (proposal; Auto insurance: also the quotation)
 *   → Summary.
 * Until a business is chosen there's only the Business step. A proposal made from a quotation
 * keeps the quotation's company, business (and asset type): none of their steps.
 */
export function stepsFor(
  stage: Stage,
  op: CredOperDraft,
  { chooseBusiness = true, chooseCompany = false, chooseAssetType = false }: StepOptions = {},
): StepDef[] {
  if (!businessOf(op)) return [business];
  const converted = convertedFromQuotation(op);
  const steps: StepDef[] = [];
  if (chooseBusiness && !converted) steps.push(business);
  if (chooseCompany && !converted) steps.push(company);
  if (chooseAssetType && !converted) steps.push(assetType);
  if (converted) steps.push(quotation);
  steps.push(customer);
  if (hasEquipment(op)) steps.push(equipmentStep(op));
  if (hasBuilding(op)) steps.push(building);
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
 * 1 Details (NIF, names, legal form, activity, contacts), 2 Address, 3 Legal document,
 * 4 Person / Company details.
 */
export function interventionTabOfErrorKey(key: string): 1 | 2 | 3 | 4 {
  if (key.includes(".entity.documents.")) return 3;
  if (/\.(firstName|lastName|leafActivityTypeNodeId|leafActivityTypeId)$/.test(key)) return 1;
  if (key.includes(".person.") || key.includes(".company.")) return 4;
  if (key.includes("Address")) return 2;
  return 1;
}
