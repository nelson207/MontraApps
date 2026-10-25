import type {
  AddressDto,
  CountryDto,
  EmailDto,
  PhoneDto,
  UpdateMyContactsRequest,
  UserContactsDto,
} from "@platform/api/generated/MontraPOSApi";

// Contact details (e-mails, phones, addresses) as edited in My profile and in user
// administration. The API's rules for saving them:
//   - only the lists that changed are sent (an omitted list is left untouched);
//   - a new item has no id, an edited one keeps its id (an opaque token, sent back as received);
//   - nothing is deleted: saved items can be edited, not removed.
// Every item gets a local `key` so React can track new ones; it never goes to the API.

export type Keyed<T> = T & { key: string };

export type ContactsDraft = {
  emails: Keyed<EmailDto>[];
  phones: Keyed<PhoneDto>[];
  addresses: Keyed<AddressDto>[];
};

export type ContactList = keyof ContactsDraft;

let nextKey = 0;
const keyed = <T extends { id?: string | null }>(item: T): Keyed<T> => ({ ...item, key: item.id ?? `new-${++nextKey}` });

export function toContactsDraft(contacts: UserContactsDto | null | undefined): ContactsDraft {
  return {
    emails: (contacts?.emails ?? []).map(keyed),
    phones: (contacts?.phones ?? []).map(keyed),
    addresses: (contacts?.addresses ?? []).map(keyed),
  };
}

export const newEmail = (isMain: boolean): Keyed<EmailDto> => keyed<EmailDto>({ emailAddress: "", isMain });
export const newPhone = (isMain: boolean, countryId: string | null): Keyed<PhoneDto> =>
  keyed<PhoneDto>({ countryId, phoneNumber: "", isMain });
export const newAddress = (countryId: string | null): Keyed<AddressDto> =>
  keyed<AddressDto>({ details: { street: "", postalCode: "", locality: "", countryId, isPostal: false, isFiscal: false, isHeadquarters: false, isPoBox: false, isResidential: false } });

/** Saved items can't be removed; a new one (no id yet) can */
export const isRemovable = (item: { id?: string | null }) => !item.id;

const trimmed = (value: string | null | undefined) => value?.trim() ?? "";

/** The item as sent: without the local key */
function toApi<T extends { key: string }>(item: T): Omit<T, "key"> {
  const rest: Partial<T> = { ...item };
  delete rest.key;
  return rest as Omit<T, "key">;
}

const cleanEmail = (e: Keyed<EmailDto>): EmailDto => ({ ...toApi(e), emailAddress: trimmed(e.emailAddress) });
const cleanPhone = (p: Keyed<PhoneDto>): PhoneDto => ({ ...toApi(p), phoneNumber: trimmed(p.phoneNumber).replace(/\s+/g, "") });
const cleanAddress = (a: Keyed<AddressDto>): AddressDto => {
  const item = toApi(a);
  if (!item.details) return item;
  const d = item.details;
  return {
    ...item,
    details: { ...d, street: trimmed(d.street), postalCode: trimmed(d.postalCode), locality: trimmed(d.locality) },
  };
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** The request body: only the lists that differ from the saved ones; null when nothing changed */
export function changedContacts(saved: ContactsDraft, edited: ContactsDraft): UpdateMyContactsRequest | null {
  const request: UpdateMyContactsRequest = {};
  const emails = edited.emails.map(cleanEmail);
  const phones = edited.phones.map(cleanPhone);
  const addresses = edited.addresses.map(cleanAddress);
  if (!same(emails, saved.emails.map(cleanEmail))) request.emails = emails;
  if (!same(phones, saved.phones.map(cleanPhone))) request.phones = phones;
  if (!same(addresses, saved.addresses.map(cleanAddress))) request.addresses = addresses;
  return Object.keys(request).length ? request : null;
}

/** E-mail addresses that are new or changed: each one gets a confirmation link */
export function emailsToConfirm(saved: ContactsDraft, edited: ContactsDraft): string[] {
  const before = new Map(saved.emails.map((e) => [e.key, trimmed(e.emailAddress).toLowerCase()]));
  return edited.emails
    .filter((e) => before.get(e.key) !== trimmed(e.emailAddress).toLowerCase())
    .map((e) => trimmed(e.emailAddress))
    .filter(Boolean);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactErrors = Record<string, string>;

/** Field errors by "list.key.field", e.g. "emails.new-3.emailAddress" */
export function validateContacts(draft: ContactsDraft): ContactErrors {
  const errors: ContactErrors = {};
  for (const e of draft.emails) {
    if (!EMAIL_PATTERN.test(trimmed(e.emailAddress))) errors[`emails.${e.key}.emailAddress`] = "Enter a valid e-mail address.";
  }
  for (const p of draft.phones) {
    if (!p.countryId) errors[`phones.${p.key}.countryId`] = "Choose the country.";
    if (!/^\d{6,15}$/.test(trimmed(p.phoneNumber).replace(/\s+/g, ""))) errors[`phones.${p.key}.phoneNumber`] = "Enter 6 to 15 digits.";
  }
  for (const a of draft.addresses) {
    const d = a.details;
    if (!d) continue;
    if (!trimmed(d.street)) errors[`addresses.${a.key}.street`] = "Enter the street.";
    if (!trimmed(d.postalCode)) errors[`addresses.${a.key}.postalCode`] = "Enter the postal code.";
    if (!trimmed(d.locality)) errors[`addresses.${a.key}.locality`] = "Enter the locality.";
    if (!d.countryId) errors[`addresses.${a.key}.countryId`] = "Choose the country.";
  }
  return errors;
}

/** Makes one item the main one of its list (the others stop being main) */
export const withMain = <T extends { key: string; isMain?: boolean | null }>(list: T[], key: string): T[] =>
  list.map((item) => ({ ...item, isMain: item.key === key }));

/** Country options: the id is sent (e.g. "PRT"), the abbreviation shown */
export const countryOptions = (countries: CountryDto[] | undefined, withPrefix = false) =>
  (countries ?? [])
    .filter((c): c is CountryDto & { id: string } => !!c.id)
    .map((c) => ({
      value: c.id,
      label: `${c.abbreviation ?? c.id}${withPrefix && c.phonePrefix != null ? ` (+${c.phonePrefix})` : ""}`,
      title: c.description ?? undefined,
    }));

/** "+351" for a country id, or null */
export const phonePrefixOf = (countries: CountryDto[] | undefined, countryId: string | null | undefined) => {
  const prefix = countries?.find((c) => c.id === countryId)?.phonePrefix;
  return prefix == null ? null : `+${prefix}`;
};
