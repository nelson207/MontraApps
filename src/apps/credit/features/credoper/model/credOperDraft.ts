import { newId } from "@platform/utils/newId";
import type {
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

export type CredOperDraft = CredOperDto & { insurances: Insurance[] };

/** Server payloads may or may not carry insurances. */
export type CredOperInput = CredOperDto & { insurances?: Insurance[] };

export type Stage = "quotation" | "proposal";

export const STEP_OF_STAGE: Record<Stage, number> = { quotation: 1, proposal: 2 };

export const stageOf = (op: CredOperDto): Stage => (op.credOperStep === 2 ? "proposal" : "quotation");

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

export function interventionName(intervention: CredOperIntervDto): string {
  const fullName = intervention.entity?.fullName?.trim();
  if (fullName) return fullName;
  const personName = [intervention.person?.firstName, intervention.person?.lastName]
    .filter((part) => part?.trim())
    .join(" ");
  return personName || "Unnamed";
}

export const customerOf = (op: CredOperDto): CredOperIntervDto | undefined =>
  op.interventions?.find((i) => interventionRole(i) === "customer");

/** entity.entityTypeId of a company (collective entity). Confirm against the backend's entity types. */
export const COMPANY_ENTITY_TYPE_ID = 2;

export const isCompany = (intervention: CredOperIntervDto | undefined): boolean =>
  intervention?.entity?.entityTypeId === COMPANY_ENTITY_TYPE_ID;

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
 * Backend follow-up: `quotationId` (the source quotation) on CredOperDto. Read through this
 * helper so nothing else depends on it until MontraPOSApi.ts is regenerated with it.
 */
export const quotationIdOf = (op: CredOperDto): string | null =>
  (op as CredOperDto & { quotationId?: string | null }).quotationId ?? null;

/** A proposal converted from a quotation: step 1 shows that quotation, read-only. */
export const convertedFromQuotation = (op: CredOperDto): boolean =>
  stageOf(op) === "proposal" && quotationIdOf(op) != null;
