import type { IntervEntityKind } from "@platform/api/generated/MontraPOSApi";
import type { CredOperDto, CredOperIntervDto, EntityLegalDocDto } from "@platform/api/legacy/legacyApi";
import { newId } from "@platform/utils/newId";
import { interventionRole } from "../model/credOperDraft";
import type { EntityData } from "../api/entityMapping";
import type { EntityLookup } from "./entityLookupSlice";

// A person of a proposal starts from their VAT number (NIF): found in the database, their data
// comes from there (once a code confirms it); otherwise, or whenever the user prefers, it's typed.
// Their NIF is their VAT legal document.

/** The NIF is kept as a document of this app-only type in entity.legalDocs (the API's documents are entity.documents) */
export const VAT_DOC_TYPE = 3;

/** As typed: without spaces, dots or a "PT" prefix */
export const normalizeNif = (value: string) => value.replace(/[\s.-]/g, "").replace(/^PT/i, "");

/** A Portuguese NIF: 9 digits, the last one its check digit (mod 11) */
export function isValidNif(value: string): boolean {
  if (!/^\d{9}$/.test(value)) return false;
  const digits = [...value].map(Number);
  const sum = digits.slice(0, 8).reduce((total, digit, i) => total + digit * (9 - i), 0);
  const check = 11 - (sum % 11);
  return digits[8] === (check >= 10 ? 0 : check);
}

/** A NIF of an entity that can't be this intervention, by that entity's kind (null when it has none) */
export const kindMismatchMessage = (kind: IntervEntityKind | null | undefined): string =>
  kind === "Company"
    ? "This NIF belongs to a company"
    : kind === "Person"
      ? "This NIF belongs to a person"
      : "This NIF can't be used here";

/** The entity's kind in a 400 entity_kind_mismatch: the API's when it says, otherwise the only other one there is */
export const refusedKind = (error: unknown, asked: IntervEntityKind): IntervEntityKind => {
  const kind = (error as { data?: { kind?: IntervEntityKind | null } | null }).data?.kind;
  return kind ?? (asked === "Person" ? "Company" : "Person");
};

/** The person's NIF: their VAT legal document's number */
export const vatOf = (intervention: CredOperIntervDto | undefined): string =>
  intervention?.entity?.legalDocs?.find((d) => d.legalDocTypeId === VAT_DOC_TYPE)?.legalDocNumber ?? "";

/** `docs` with the VAT document's number set (added when there's none) */
const withVatDoc = (docs: EntityLegalDocDto[] | null | undefined, vat: string): EntityLegalDocDto[] => {
  const list = docs ?? [];
  if (!list.some((d) => d.legalDocTypeId === VAT_DOC_TYPE)) {
    return [...list, { correlationID: newId(), legalDocTypeId: VAT_DOC_TYPE, legalDocNumber: vat, validDate: null }];
  }
  return list.map((d) => (d.legalDocTypeId === VAT_DOC_TYPE ? { ...d, legalDocNumber: vat } : d));
};

/** `intervention` with its NIF */
export const withVat = (intervention: CredOperIntervDto, vat: string): CredOperIntervDto => ({
  ...intervention,
  entity: { ...intervention.entity, legalDocs: withVatDoc(intervention.entity?.legalDocs, vat) },
});

/**
 * A person still to identify: not a database entity, nothing typed for them yet. Their other
 * fields wait for the NIF lookup (or for the user to fill them in by hand).
 */
export const isNewEntity = (intervention: CredOperIntervDto | null | undefined): boolean =>
  !!intervention && intervention.entity?.id == null && !intervention.entity?.fullName?.trim();

/**
 * `intervention` with the database's data for it (the code confirmed): the database's wins; what
 * makes it this operation's person (its link, role, field rules) stays.
 */
export const withEntityData = (intervention: CredOperIntervDto, data: EntityData, vat: string): CredOperIntervDto => {
  const { id, correlationID, credOperIntervType, metadataResponse } = intervention;
  // Same id for the same document: no duplicates when the database's already has it
  const legalDocs = (data.entity?.legalDocs ?? []).map((d) => ({ ...d, correlationID: d.correlationID || newId() }));
  return withVat(
    {
      ...intervention,
      ...data,
      id,
      correlationID,
      credOperIntervType,
      metadataResponse,
      entity: { ...intervention.entity, ...data.entity, legalDocs },
    },
    vat,
  );
};

const blank = (value: string | null | undefined) => !value?.trim();

/**
 * The customer of a proposal with what its quotation had (the operation's customer fields) where
 * nothing is typed yet: a quotation keeps its customer on the operation, the proposal on its card.
 */
export function withQuotationCustomer(intervention: CredOperIntervDto, op: CredOperDto): CredOperIntervDto {
  if (interventionRole(intervention) !== "customer") return intervention;
  const out = { ...intervention };
  if (blank(out.entity?.fullName) && !blank(op.customerName)) out.entity = { ...out.entity, fullName: op.customerName };
  if (blank(out.entityEmail?.email) && !blank(op.customerEmail?.email)) {
    out.entityEmail = { ...out.entityEmail, email: op.customerEmail?.email };
  }
  if (blank(out.entityMobilePhone?.phoneNumber) && !blank(op.customerPhone?.phoneNumber)) {
    out.entityMobilePhone = { ...out.entityMobilePhone, phoneNumber: op.customerPhone?.phoneNumber, countryId: op.customerPhone?.countryId };
  }
  if (blank(out.entityLandlinePhone?.phoneNumber) && !blank(op.customerLandLine?.phoneNumber)) {
    out.entityLandlinePhone = { ...out.entityLandlinePhone, phoneNumber: op.customerLandLine?.phoneNumber, countryId: op.customerLandLine?.countryId };
  }
  return out;
}

/** The NIF the lookup starts with: the person's, or for the customer, the one the quotation had */
export const initialNif = (intervention: CredOperIntervDto, op: CredOperDto | null | undefined): string =>
  vatOf(intervention) ||
  (interventionRole(intervention) === "customer" ? normalizeNif(op?.customerVAT?.legalDocNumber ?? "") : "");

/** The code request can still be answered */
export const isOtpValid = (validUntil: string | undefined, now: number): boolean =>
  !!validUntil && new Date(validUntil).getTime() > now;

/**
 * The person's other fields wait: a new person whose NIF hasn't been looked up yet, one found and
 * the user hasn't chosen between the code and filling in by hand, or one the user went back to
 * search again (what they typed stays, locked meanwhile)
 */
export const isLookupPending = (intervention: CredOperIntervDto | null | undefined, lookup: EntityLookup | undefined) =>
  lookup ? lookup.outcome === "found" || lookup.outcome === "search" : isNewEntity(intervention);

/**
 * The search can be started over: filled in by hand (chosen, or not found), or typed before any
 * lookup; not a person that's already the database's (filled from it, or opened as one)
 */
export const canSearchAgain = (intervention: CredOperIntervDto | null | undefined, lookup: EntityLookup | undefined) =>
  !!intervention && !isLookupPending(intervention, lookup) && intervention.entity?.id == null && lookup?.outcome !== "filled";
