import type { CredOperIntervDto, EntityAddressDto } from "@platform/api/legacy/legacyApi";
import { nameParts } from "../api/entityMapping";
import { vatOf } from "../entityLookup/entityLookup";
import { isCompany, isExistingEntity, postalIsFiscal } from "./credOperDraft";

// What a person of a proposal still needs before saving: the validation's errors and the side
// summary of the Interventions step come from here. New entities only: the data of one that
// already exists may be missing fields, and isn't asked for.

/** The tab of the person's form: 1 Details, 2 Address, 3 Legal document, 4 Person / Company details */
export type PersonTab = 1 | 2 | 3 | 4;

export type MissingField = {
  /** The validation error's key */
  key: string;
  label: string;
  tab: PersonTab;
  /** The field's id, after `intervention-{index}-` */
  fieldId: string;
};

const empty = (value: unknown) => value == null || (typeof value === "string" && !value.trim());

const missingAddress = (prefix: string, field: string, address: EntityAddressDto | null | undefined, what: string, id: string): MissingField[] =>
  (
    [
      ["street", "street", "street"],
      ["postalCode", "postal code", "postal-code"],
      ["countryId", "country", "country"],
    ] as const
  ).flatMap(([name, label, suffix]) =>
    empty(address?.[name]) ? [{ key: `${prefix}${field}.${name}`, label: `${what}: ${label}`, tab: 2 as const, fieldId: `${id}-${suffix}` }] : [],
  );

export function missingRequired(intervention: CredOperIntervDto): MissingField[] {
  const prefix = `interventions.${intervention.correlationID}.`;
  // Added here: its type is always asked for
  const documents = (intervention.entity?.documents ?? []).flatMap((document, index): MissingField[] =>
    !document.id && document.legalDocTypeId == null
      ? [{ key: `${prefix}entity.documents.${index}.legalDocTypeId`, label: "Legal document: type", tab: 3, fieldId: `document-${index}-type` }]
      : [],
  );
  const details: MissingField[] = [];
  const add = (key: string, label: string, fieldId: string) => details.push({ key: `${prefix}${key}`, label, tab: 1, fieldId });
  const noPhone = empty(intervention.entityMobilePhone?.phoneNumber) && empty(intervention.entityLandlinePhone?.phoneNumber);

  if (isExistingEntity(intervention)) {
    // Asked to use a new phone: the only thing asked of an entity that exists
    if (noPhone && intervention.entityMobilePhone && !intervention.entityMobilePhone.id) add("entity.phone", "Mobile or landline phone", "mobile-phone");
    return [...details, ...documents];
  }

  if (!vatOf(intervention)) add("entity.vatNumber", "NIF", "nif");
  if (isCompany(intervention)) {
    if (empty(intervention.entity?.fullName)) add("entity.fullName", "Company name", "name");
    if (intervention.entity?.juridicalTypeId == null) add("entity.juridicalTypeId", "Legal form", "juridical-type");
    if (intervention.entity?.juridicalType?.hasActivity && intervention.company?.leafActivityTypeId == null) {
      add("company.leafActivityTypeId", "Activity (CAE)", "activity-type");
    }
  } else {
    const { firstName, lastName } = nameParts(intervention.entity?.fullName, intervention.person);
    if (empty(firstName)) add("person.firstName", "First name", "first-name");
    if (empty(lastName)) add("person.lastName", "Last name", "last-name");
  }
  if (noPhone) add("entity.phone", "Mobile or landline phone", "mobile-phone");

  return [
    ...details,
    ...missingAddress(prefix, "fiscalAddress", intervention.fiscalEntityAddress, "Fiscal address", "fiscal"),
    ...(postalIsFiscal(intervention) ? [] : missingAddress(prefix, "postalAddress", intervention.entityAddress, "Postal address", "postal")),
    ...documents,
  ];
}
