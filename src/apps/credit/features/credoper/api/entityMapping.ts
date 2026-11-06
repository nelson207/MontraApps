import type {
  AddressDetailsDto,
  AddressDto,
  CredOperIntervEntityDto,
  EmailDto,
  EntityPreloadDto,
  IntervEntityKind,
  LegalDocDto,
  PersonDto as ApiPersonDto,
  PhoneDto,
} from "@platform/api/generated/MontraPOSApi";
import type {
  CompanyDto,
  CredOperIntervDto,
  DraftLegalDoc,
  EntityAddressDto,
  EntityEmailDto,
  EntityPhoneDto,
  PersonDto,
} from "@platform/api/legacy/legacyApi";
import { newId } from "@platform/utils/newId";
import { vatOf, withVat } from "../entityLookup/entityLookup";
import { COMPANY_ENTITY_TYPE_ID, entityKindOf, isCompany, postalIsFiscal } from "../model/credOperDraft";

// A person of the operation as the draft keeps it (the previous API's parts: entity, person or
// company, e-mail, mobile and landline phones, fiscal and postal addresses) ⇄ the new API's
// intervention entity (CredOperIntervEntityDto), and the entity the NIF lookup hands over once its
// code is confirmed (EntityPreloadDto).
// A person's name is their first and last names; a company's is entity.name (also sent as its
// registryDescription, as before). What the API sets is never sent: the pointers (entityId,
// entityPhoneId…: credOperMapping) and an address's isFiscal / isPostal flags.

/** The parts of a person that are theirs (not this operation's link to them) */
export type EntityData = Pick<
  CredOperIntervDto,
  | "entity"
  | "person"
  | "company"
  | "entityEmail"
  | "entityMobilePhone"
  | "entityLandlinePhone"
  | "entityAddress"
  | "fiscalEntityAddress"
  | "samePostalAddress"
  | "availablePhones"
  | "availableEmails"
  | "availableAddresses"
>;

/** The app's own keys, never sent */
const APP_KEYS = ["id", "correlationID", "status", "metadataResponse"];

function withoutAppKeys<T extends object>(item: T | null | undefined): Record<string, unknown> | undefined {
  if (!item) return undefined;
  const out: Record<string, unknown> = { ...(item as Record<string, unknown>) };
  for (const key of APP_KEYS) delete out[key];
  return out;
}

/** `item` without its undefined values (spread over another, they'd erase its values) */
function defined<T extends object>(item: T): T {
  return Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined)) as T;
}

const blank = (value: unknown) => value == null || (typeof value === "string" && !value.trim());

/** Chosen from the entity's: with its id. Typed: without one (the API adds it, or reuses its match) */
const idOf = (item: { id?: string | null } | null | undefined) => (item?.id ? { id: item.id } : {});

/** First and last names as one name */
export const joinName = (first: string | null | undefined, last: string | null | undefined): string =>
  [first, last]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

/**
 * The name typed (one field) as first and last names: the person's own when they still make it
 * up (e.g. filled from the database); otherwise the first word and the rest.
 */
export function nameParts(fullName: string | null | undefined, person: PersonDto | null | undefined) {
  const name = fullName?.trim().replace(/\s+/g, " ") ?? "";
  if (!name || joinName(person?.firstName, person?.lastName) === name) {
    return { firstName: person?.firstName ?? null, lastName: person?.lastName ?? null };
  }
  const [first, ...rest] = name.split(" ");
  return { firstName: first, lastName: rest.join(" ") || null };
}

const phoneOut = (phone: EntityPhoneDto | null | undefined, isMain: boolean): PhoneDto | undefined =>
  blank(phone?.phoneNumber)
    ? undefined
    : {
        ...idOf(phone),
        phoneNumber: phone!.phoneNumber!.trim(),
        ...(phone!.countryId ? { countryId: phone!.countryId } : {}),
        phoneTypeId: phone!.phoneTypeId ?? null,
        isMain,
      };

export const phoneIn = (phone: PhoneDto | null | undefined, base: EntityPhoneDto | undefined): EntityPhoneDto | undefined =>
  phone
    ? {
        ...base,
        id: phone.id ?? base?.id ?? null,
        phoneNumber: phone.phoneNumber ?? null,
        countryId: phone.countryId ?? base?.countryId ?? null,
        phoneTypeId: phone.phoneTypeId ?? base?.phoneTypeId ?? null,
      }
    : base;

const emailOut = (email: EntityEmailDto | null | undefined): EmailDto | undefined =>
  blank(email?.email) ? undefined : { ...idOf(email), emailAddress: email!.email!.trim(), isMain: true };

export const emailIn = (email: EmailDto | null | undefined, base: EntityEmailDto | undefined): EntityEmailDto | undefined =>
  email ? { ...base, id: email.id ?? base?.id ?? null, email: email.emailAddress ?? null } : base;

/** The address fields both shapes have, under the same names */
const ADDRESS_FIELDS = [
  "street",
  "streetNumber",
  "houseNumber",
  "building",
  "apartment",
  "place",
  "poBox",
  "postalCode",
  "locality",
  "parish",
  "council",
  "district",
  "region",
  "countryId",
] as const;

function addressOut(address: EntityAddressDto | null | undefined): AddressDto | undefined {
  // Chosen from the entity's: its id says which, even if its text didn't come along
  if (!address || (!address.id && ADDRESS_FIELDS.every((key) => blank(address[key])))) return undefined;
  const details: AddressDetailsDto = {
    isHeadquarters: !!address.isHeadquarters,
    isPoBox: !!address.isPoBox,
    isResidential: !!address.isResidentialAddress,
  };
  for (const key of ADDRESS_FIELDS) details[key] = address[key] ?? null;
  return { ...idOf(address), addressTypeId: address.addressTypeId ?? null, details };
}

export function addressIn(address: AddressDto | null | undefined, base: EntityAddressDto | undefined): EntityAddressDto | undefined {
  if (!address) return base;
  // Only the lines when the API has no details for it
  const details: AddressDetailsDto = address.details ?? {
    street: address.lines?.street,
    postalCode: address.lines?.postalCode,
    locality: address.lines?.locality,
  };
  const out: EntityAddressDto = { ...base, id: address.id ?? base?.id ?? null, addressTypeId: address.addressTypeId ?? base?.addressTypeId };
  for (const key of ADDRESS_FIELDS) out[key] = details[key] ?? null;
  if (address.details) {
    out.isFiscal = details.isFiscal;
    out.isPostal = details.isPostal;
    out.isHeadquarters = details.isHeadquarters;
    out.isPoBox = details.isPoBox;
    out.isResidentialAddress = details.isResidential;
  }
  return out;
}

/** An address of the entity's, in one line */
export const addressText = (address: AddressDto): string => {
  if (address.singleLine?.trim()) return address.singleLine.trim();
  const { details, lines } = address;
  return [details?.street ?? lines?.street, details?.streetNumber, details?.postalCode ?? lines?.postalCode, details?.locality ?? lines?.locality]
    .filter((part) => part?.trim())
    .join(", ");
};

/** A company's part; a new one's name is also its registryDescription */
function companyOut(intervention: CredOperIntervDto): Record<string, unknown> {
  const name = intervention.entity?.id ? null : intervention.entity?.fullName?.trim();
  return { ...withoutAppKeys(intervention.company), ...(name ? { registryDescription: name } : {}) };
}

/** Documents added here (those of the entity already have an id, and aren't added again) */
function newDocumentsOut(intervention: CredOperIntervDto): LegalDocDto[] | undefined {
  const added = (intervention.entity?.documents ?? [])
    .filter((document) => !document.id)
    .map(({ correlationID: _ref, typeLabel: _label, ...document }) => document);
  return added.length ? added : undefined;
}

/** A person of the draft as the API's intervention entity */
export function toApiEntity(intervention: CredOperIntervDto): CredOperIntervEntityDto {
  const company = isCompany(intervention);
  const existing = !!intervention.entity?.id;
  const mobile = phoneOut(intervention.entityMobilePhone, true);
  const landline = phoneOut(intervention.entityLandlinePhone, !mobile);
  const fiscal = addressOut(intervention.fiscalEntityAddress);
  return defined({
    vatNumber: vatOf(intervention) || null,
    kind: entityKindOf(intervention),
    // Ignored for an entity that already exists
    name: company && !existing ? intervention.entity?.fullName?.trim() || null : undefined,
    juridicalTypeId: intervention.entity?.juridicalTypeId ?? undefined,
    person: company
      ? undefined
      : ({
          ...withoutAppKeys(intervention.person),
          ...(existing ? {} : nameParts(intervention.entity?.fullName, intervention.person)),
        } as ApiPersonDto),
    company: company ? companyOut(intervention) : undefined,
    // The one on the intervention: the mobile, or else the landline. With both, the entity gets both
    phone: mobile ?? landline,
    availablePhones: mobile && landline ? [mobile, landline] : undefined,
    email: emailOut(intervention.entityEmail),
    fiscalAddress: fiscal,
    postalAddress: postalIsFiscal(intervention) ? fiscal : addressOut(intervention.entityAddress),
    legalDocs: newDocumentsOut(intervention),
  } satisfies CredOperIntervEntityDto);
}

const documentsIn = (documents: LegalDocDto[]): DraftLegalDoc[] => documents.map((document) => ({ ...document, correlationID: newId() }));

/**
 * The person of an API intervention (its entity and entity id) as the draft's parts, over `base`
 * (what only the app keeps of them: the landline when the API's phone is the mobile…). Without an
 * entity, `base`'s parts as they are.
 */
export function entityFromApi(
  entityId: string | null | undefined,
  entity: CredOperIntervEntityDto | null | undefined,
  base: CredOperIntervDto,
): EntityData {
  const parts: CredOperIntervDto = { ...base, entity: { ...base.entity, id: entityId ?? base.entity?.id ?? null } };
  if (entity) {
    // An answer that doesn't say keeps the kind it had: the app never changes it
    const company = entity.kind ? entity.kind === "Company" : isCompany(base);
    const baseType = base.entity?.entityTypeId;
    parts.entity = {
      ...parts.entity,
      entityTypeId: company ? COMPANY_ENTITY_TYPE_ID : baseType === COMPANY_ENTITY_TYPE_ID ? null : baseType,
      fullName: company
        ? entity.name?.trim() || entity.company?.registryDescription?.trim() || base.entity?.fullName
        : joinName(entity.person?.firstName, entity.person?.lastName) || entity.name?.trim() || base.entity?.fullName,
      juridicalTypeId: entity.juridicalTypeId ?? base.entity?.juridicalTypeId,
      documents: entity.legalDocs ? documentsIn(entity.legalDocs) : base.entity?.documents,
    };
    if (company) parts.company = { ...base.company, ...(entity.company as CompanyDto) };
    else parts.person = { ...base.person, ...(entity.person as PersonDto) };
    parts.entityEmail = emailIn(entity.email, base.entityEmail);
    // Back where it was sent from: the mobile, unless only the landline had a number
    if (blank(base.entityMobilePhone?.phoneNumber) && !blank(base.entityLandlinePhone?.phoneNumber)) {
      parts.entityLandlinePhone = phoneIn(entity.phone, base.entityLandlinePhone);
    } else {
      parts.entityMobilePhone = phoneIn(entity.phone, base.entityMobilePhone);
      // The other one is on the entity now: it's chosen from its list like the rest
      if (entity.availablePhones?.length) parts.entityLandlinePhone = {};
    }
    parts.fiscalEntityAddress = addressIn(entity.fiscalAddress, base.fiscalEntityAddress);
    parts.entityAddress = addressIn(entity.postalAddress, base.entityAddress);
    if (entity.fiscalAddress || entity.postalAddress) {
      parts.samePostalAddress = !entity.postalAddress || (!!entity.postalAddress.id && entity.postalAddress.id === entity.fiscalAddress?.id);
    }
    parts.availablePhones = entity.availablePhones ?? base.availablePhones;
    parts.availableEmails = entity.availableEmails ?? base.availableEmails;
    parts.availableAddresses = entity.availableAddresses ?? base.availableAddresses;
  }
  const withNif = entity?.vatNumber?.trim() ? withVat(parts, entity.vatNumber.trim()) : parts;
  const {
    entity: e,
    person,
    company,
    entityEmail,
    entityMobilePhone,
    entityLandlinePhone,
    entityAddress,
    fiscalEntityAddress,
    samePostalAddress,
    availablePhones,
    availableEmails,
    availableAddresses,
  } = withNif;
  return defined({
    entity: e,
    person,
    company,
    entityEmail,
    entityMobilePhone,
    entityLandlinePhone,
    entityAddress,
    fiscalEntityAddress,
    samePostalAddress,
    availablePhones,
    availableEmails,
    availableAddresses,
  });
}

const mainOf = <T extends { isMain?: boolean | null }>(list: T[] | null | undefined): T | undefined =>
  list?.find((item) => item.isMain) ?? list?.[0];

/**
 * The entity the NIF lookup preloads (a company's lookup, or a confirmed code) as the parts of an
 * intervention of this `kind`: the API only hands over an entity of the kind it was asked for.
 * The flags only say what starts selected: everything it has can be chosen.
 */
export function entityFromPreload(preload: EntityPreloadDto, kind: IntervEntityKind): EntityData {
  const company = kind === "Company";
  const fiscal = preload.addresses?.find((a) => a.details?.isFiscal) ?? preload.addresses?.[0];
  const postal = preload.addresses?.find((a) => a.details?.isPostal) ?? fiscal;
  return defined({
    entity: {
      id: preload.id ?? null,
      entityTypeId: company ? COMPANY_ENTITY_TYPE_ID : preload.entityTypeId === COMPANY_ENTITY_TYPE_ID ? null : (preload.entityTypeId ?? null),
      fullName:
        preload.name?.trim() ||
        (company ? preload.company?.registryDescription?.trim() : joinName(preload.person?.firstName, preload.person?.lastName)) ||
        null,
      legalDocs: [],
    },
    person: company ? undefined : ({ ...preload.person } as PersonDto),
    company: company ? ({ ...preload.company } as CompanyDto) : undefined,
    entityEmail: emailIn(mainOf(preload.emails), undefined),
    entityMobilePhone: phoneIn(mainOf(preload.phones), undefined),
    fiscalEntityAddress: addressIn(fiscal, undefined),
    entityAddress: addressIn(postal, undefined),
    samePostalAddress: !postal || postal.id === fiscal?.id,
    availablePhones: preload.phones ?? [],
    availableEmails: preload.emails ?? [],
    availableAddresses: preload.addresses ?? [],
  });
}
