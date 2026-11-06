import { newId } from "@platform/utils/newId";
import type { CreditOperationStep, IntervEntityKind, QuotationSummaryDto } from "@platform/api/generated/MontraPOSApi";
import type {
  CodeAbbreviation,
  CredOperAssetDto,
  CredOperDto,
  CredOperIntervDto,
} from "@platform/api/legacy/legacyApi";

// The operation as the app edits it: the API's CredOperDto plus insurances,
// which the backend doesn't have yet (spec §5, backend follow-up §8).

export type CarDriver = {
  /** yyyy-MM-dd */
  licenseExpiryDate: string;
  mainDriverIsCustomer: boolean;
  /** Required when mainDriverIsCustomer is false */
  name?: string;
  /** Required when mainDriverIsCustomer is false */
  licenseNumber?: string;
};

export type CreditProtectionInsurance = {
  /** Client id until the server assigns one */
  id: string;
  kind: "creditProtection";
  insuranceTypeId: number;
  /** correlationID of the insured intervention */
  interventionRef: string;
};

export type CarInsurance = {
  id: string;
  kind: "car";
  insuranceTypeId: number;
  /** correlationID of the insured asset (vehicle) */
  assetRef: string;
  driver: CarDriver;
  protectionIds: number[];
};

export type Insurance = CreditProtectionInsurance | CarInsurance;

/**
 * The operation's identity for saving, as the API gave it (never made up, changed or cleared by
 * the app): correlationId from new-credoper (a repeated save of a new operation returns the one
 * already saved), rowVersion of the version read (a save over someone else's changes is refused).
 */
export type SaveIdentity = { correlationId?: string | null; rowVersion?: string | null };

/**
 * A proposal made from a quotation (GET …/credoper/{id}/quotation-to-proposal): the quotation it
 * came from (`sourceCredOperId`, the API's; never changed by the app) and, app-only, its summary as
 * the conversion answered it (reopened: read again from GET credoper/{sourceCredOperId}).
 * `conversionRef`, app-only: the quotation's id as the conversion was asked for with it.
 */
export type QuotationLink = { sourceCredOperId?: string | null; sourceQuotation?: QuotationSummaryDto | null; conversionRef?: string | null };

export type CredOperDraft = CredOperDto & SaveIdentity & QuotationLink & {
  insurances: Insurance[];
  /**
   * What the operation finances (model/business.ts AssetTypeId; app-only, its assets carry it
   * too): null = no asset; undefined = to be chosen
   */
  assetTypeId?: number | null;
};

/** Server payloads may or may not carry insurances. */
export type CredOperInput = CredOperDto & SaveIdentity & QuotationLink & { insurances?: Insurance[]; assetTypeId?: number | null };

export type Stage = "quotation" | "proposal";

export const STEP_OF_STAGE: Record<Stage, number> = { quotation: 1, proposal: 2 };

/** The step as the new API names it (CreditOperationStep) */
export const API_STEP_OF_STAGE: Record<Stage, CreditOperationStep> = { quotation: "Quotation", proposal: "Proposal" };

export const stageOf = (op: CredOperDto): Stage => (op.credOperStep === 2 ? "proposal" : "quotation");

/** The wizard screen an operation of this step (the new API's name) is edited on; null for the steps it doesn't edit (contract…) */
export const editableStage = (step: CreditOperationStep | null | undefined): Stage | null =>
  (Object.keys(API_STEP_OF_STAGE) as Stage[]).find((stage) => API_STEP_OF_STAGE[stage] === step) ?? null;

const withRef = <T extends { correlationID?: string }>(item: T): T =>
  item.correlationID ? item : { ...item, correlationID: newId() };

/**
 * Normalizes an operation for editing: insurances default to [], and every
 * intervention / asset gets a correlationID so insurances can link to it even
 * before the first save (or when the server sends an empty one).
 */
export function ensureRefs(op: CredOperInput): CredOperDraft {
  return {
    ...op,
    interventions: op.interventions?.map(withRef) ?? op.interventions,
    assets: op.assets?.map(withRef) ?? op.assets,
    insurances: op.insurances ?? [],
  };
}

type Referenced = { id?: string | null; correlationID?: string };

function carryList<T extends Referenced>(previous: Referenced[] | null | undefined, next: T[] | null | undefined) {
  if (!next || !previous?.length) return next;
  return next.map((item, index) => {
    if (item.correlationID) return item;
    const match = item.id != null ? previous.find((p) => p.id === item.id) : previous[index];
    return match?.correlationID ? { ...item, correlationID: match.correlationID } : item;
  });
}

/**
 * A server response may not echo the refs the client sent: carry them over
 * (by id, or by position for unsaved items) so insurance links keep working.
 */
export function carryRefs(previous: CredOperInput | null | undefined, next: CredOperInput): CredOperInput {
  if (!previous) return next;
  return {
    ...next,
    interventions: carryList(previous.interventions, next.interventions),
    assets: carryList(previous.assets, next.assets),
  };
}

export type InterventionRole = "customer" | "secondHolder" | "guarantor";

export const ROLE_LABELS: Record<InterventionRole, string> = {
  customer: "Customer",
  secondHolder: "Second holder",
  guarantor: "Guarantor",
};

export function interventionRole(intervention: CredOperIntervDto): InterventionRole {
  switch (intervention.credOperIntervType) {
    case 2:
      return "secondHolder";
    case 4:
      return "guarantor";
    default:
      return "customer";
  }
}

/** A person's name until they have one */
export const UNNAMED = "Unnamed";

export function interventionName(intervention: CredOperIntervDto): string {
  const fullName = intervention.entity?.fullName?.trim();
  if (fullName) return fullName;
  const personName = [intervention.person?.firstName, intervention.person?.lastName]
    .filter((part) => part?.trim())
    .join(" ");
  return personName || UNNAMED;
}

/** The API's role says who someone is too: without it (the draft's own people), their type decides */
const isCustomer = (intervention: CredOperIntervDto): boolean =>
  interventionRole(intervention) === "customer" && ((intervention as { role?: string | null }).role ?? "Customer") === "Customer";

export const customerOf = (op: Pick<CredOperDto, "interventions">): CredOperIntervDto | undefined =>
  op.interventions?.find(isCustomer);

/** Whether the operation has its customer: a proposal without one gets one to fill in (new-intervention) */
export const hasCustomer = (op: Pick<CredOperDto, "interventions">): boolean => !!customerOf(op);

/** entity.entityTypeId of a company (collective entity). Confirm against the backend's entity types. */
export const COMPANY_ENTITY_TYPE_ID = 2;

export const isCompany = (intervention: CredOperIntervDto | undefined): boolean =>
  intervention?.entity?.entityTypeId === COMPANY_ENTITY_TYPE_ID;

/** Already an entity of the database (found by its NIF, or saved): only what's new about it is typed */
export const isExistingEntity = (intervention: CredOperIntervDto | null | undefined): boolean => !!intervention?.entity?.id;

/** The postal address is the fiscal one: said so, or by nothing else being there */
export const postalIsFiscal = (intervention: CredOperIntervDto | null | undefined): boolean => {
  if (intervention?.samePostalAddress != null) return intervention.samePostalAddress;
  const postal = intervention?.entityAddress;
  return !postal || (!postal.id && !postal.street?.trim()) || (!!postal.id && postal.id === intervention?.fiscalEntityAddress?.id);
};

/** Who the person is, as the API names it. It comes from the API (new-intervention) and the user can't change it */
export const entityKindOf = (intervention: CredOperIntervDto | undefined): IntervEntityKind =>
  isCompany(intervention) ? "Company" : "Person";

/**
 * A contract classification of the wizard's list. entitySuperType says what its customer must be;
 * null: neither a person nor a company, so no customer can be created for it (the generated type
 * leaves null out, the API sends it).
 */
export type ClassificationOption = CodeAbbreviation & { entitySuperType: IntervEntityKind | null };

export const UNUSABLE_CLASSIFICATION = "This classification can't be used to create a customer";
export const NO_CLASSIFICATION = "Choose a contract classification first.";
export const CUSTOMER_NEEDED = "The customer is missing: choose a contract classification that can be used to create one.";

/** The operation's classification in the list; undefined with none, or while it isn't listed */
export const classificationOf = (
  op: Pick<CredOperDto, "credOperClassification">,
  options: ClassificationOption[] | undefined,
): ClassificationOption | undefined =>
  op.credOperClassification == null ? undefined : options?.find((option) => option.code === String(op.credOperClassification));

/** Why people can't be added yet (null when they can): none chosen, or one known to be unusable */
export function classificationBlock(
  op: Pick<CredOperDto, "credOperClassification">,
  options: ClassificationOption[] | undefined,
): string | null {
  if (op.credOperClassification == null) return NO_CLASSIFICATION;
  const classification = classificationOf(op, options);
  return classification && classification.entitySuperType == null ? UNUSABLE_CLASSIFICATION : null;
}

const KIND_WORDS: Record<IntervEntityKind, { one: string; many: string }> = {
  Person: { one: "a person", many: "people" },
  Company: { one: "a company", many: "companies" },
};

/**
 * What to tell the user when a saved customer doesn't match the classification (null when it does).
 * Never replaced for them, and the API doesn't check saved interventions again.
 */
export function savedCustomerConflict(op: CredOperDto, options: ClassificationOption[] | undefined): string | null {
  const customer = customerOf(op);
  const wanted = classificationOf(op, options)?.entitySuperType;
  if (!customer?.id || !wanted || entityKindOf(customer) === wanted) return null;
  return `The saved customer is ${KIND_WORDS[entityKindOf(customer)].one}, but this classification is for ${KIND_WORDS[wanted].many}. The customer must be replaced by hand: use Restart customer in Interventions.`;
}

export const SECOND_HOLDER_LOST = "Customer is a company: if you proceed, the second holder's information will be lost.";

/** The customer is about to become this kind, and a company can't have the second holder this operation has */
export const losesSecondHolder = (op: Pick<CredOperDto, "interventions">, becomes: IntervEntityKind | null | undefined): boolean =>
  becomes === "Company" && !!op.interventions?.some((i) => interventionRole(i) === "secondHolder");

/** Why a second holder can't be added (null when it can): only one, and only for a person first holder. */
export function secondHolderBlock(op: CredOperDto): string | null {
  const customer = customerOf(op);
  if (!customer) return "Add the first holder first.";
  if (isCompany(customer)) return "The first holder is a company.";
  if (op.interventions?.some((i) => interventionRole(i) === "secondHolder")) return "There is already a second holder.";
  return null;
}

export function assetLabel(asset: CredOperAssetDto, index = 0): string {
  return (
    asset.equipment?.description?.trim() ||
    asset.equipment?.licencePlate?.trim() ||
    `Vehicle ${index + 1}`
  );
}

/** "Name · Role" for a credit protection, the vehicle label for a car insurance; null when the link is broken. */
export function insuredLabel(ins: Insurance, op: CredOperDraft): string | null {
  if (ins.kind === "car") {
    const index = op.assets?.findIndex((a) => a.correlationID === ins.assetRef) ?? -1;
    return index === -1 ? null : assetLabel(op.assets![index], index);
  }
  const person = op.interventions?.find((i) => i.correlationID === ins.interventionRef);
  return person ? `${interventionName(person)} · ${ROLE_LABELS[interventionRole(person)]}` : null;
}

// Business rules (equipment, financing) live in ./business.ts

/**
 * A proposal made from a quotation (it has a sourceCredOperId), before and after its first save:
 * it keeps the quotation's company, business and operation type (LOCKED_BY_QUOTATION).
 */
export const convertedFromQuotation = (op: CredOperDto & QuotationLink): boolean =>
  stageOf(op) === "proposal" && !!op.sourceCredOperId;

/**
 * What a proposal made from a quotation can't change (the API refuses a save that does: 400
 * validation_failed): the quotation's company, business and operation type, and the link itself.
 */
export const LOCKED_BY_QUOTATION = ["sourceCredOperId", "aplCompanyId", "aplBusinessId", "credOperTypeId"] as const;

/** A saved operation as the user knows it: its readable number (the id is an opaque token, never shown) */
export function operationTitle(stage: Stage, { credOperNumber }: Pick<CredOperDraft, "credOperNumber">): string {
  const label = stage === "quotation" ? "Quotation" : "Proposal";
  return credOperNumber != null ? `${label} #${credOperNumber}` : label;
}
