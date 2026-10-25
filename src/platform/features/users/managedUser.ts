import type { CreateUserRequest, ManagedUserDto, UpdateUserRequest } from "@platform/api/generated/MontraPOSApi";
import { changedContacts, type ContactsDraft } from "@platform/features/account/contactDetails";

// The user form of user administration, against MontraAPI:
//   create  POST /api/users      { userName, fullName, abbreviation?, email?, aplUserTypeId?,
//                                  authorizationLevel?, entityId?, culture?, uiCulture? }
//   edit    PUT  /api/users/{id} only the changed fields (null / left out = unchanged);
//                                 emails / phones follow My profile's rules (contactDetails.ts)
// Values are kept as typed (strings) and converted when sent.

export type UserFormValues = {
  userName: string;
  fullName: string;
  abbreviation: string;
  /** Create only: where the password is e-mailed (an existing user's e-mails are its contacts) */
  email: string;
  aplUserTypeId: string;
  authorizationLevel: string;
  culture: string;
  uiCulture: string;
  /** Edit only: yyyy-MM-dd from which the user can't sign in ("" = valid) */
  invalidDate: string;
};

export type UserFormErrors = Partial<Record<keyof UserFormValues, string>>;

export const EMPTY_USER_FORM: UserFormValues = {
  userName: "",
  fullName: "",
  abbreviation: "",
  email: "",
  aplUserTypeId: "",
  authorizationLevel: "",
  culture: "",
  uiCulture: "",
  invalidDate: "",
};

const text = (value: string | null | undefined) => value ?? "";
const numberText = (value: number | null | undefined) => (value == null ? "" : String(value));

export function fromManagedUser(user: ManagedUserDto): UserFormValues {
  return {
    userName: text(user.userName),
    fullName: text(user.fullName),
    abbreviation: text(user.abbreviation),
    email: "",
    aplUserTypeId: numberText(user.aplUserTypeId),
    authorizationLevel: numberText(user.authorizationLevel),
    culture: text(user.culture),
    uiCulture: text(user.uiCulture),
    invalidDate: user.invalidDate?.slice(0, 10) ?? "",
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CULTURE_PATTERN = /^[a-z]{2,3}(-[A-Z]{2})?$/;
const WHOLE = /^\d+$/;

export function validateUserForm(values: UserFormValues, mode: "create" | "edit"): UserFormErrors {
  const errors: UserFormErrors = {};
  const v = (key: keyof UserFormValues) => values[key].trim();
  if (mode === "create") {
    if (!v("userName")) errors.userName = "Enter the user name.";
    else if (/\s/.test(v("userName"))) errors.userName = "The user name has no spaces.";
    if (v("email") && !EMAIL_PATTERN.test(v("email"))) errors.email = "Enter a valid e-mail address.";
  }
  if (!v("fullName")) errors.fullName = "Enter the full name.";
  if (v("aplUserTypeId") && !WHOLE.test(v("aplUserTypeId"))) errors.aplUserTypeId = "Enter a whole number.";
  if (v("authorizationLevel") && !WHOLE.test(v("authorizationLevel"))) errors.authorizationLevel = "Enter a whole number.";
  for (const key of ["culture", "uiCulture"] as const) {
    if (v(key) && !CULTURE_PATTERN.test(v(key))) errors[key] = "Use a culture like pt-PT.";
  }
  return errors;
}

const optionalText = (value: string) => value.trim() || undefined;
const optionalNumber = (value: string) => (value.trim() ? Number(value.trim()) : undefined);

export function toCreateRequest(values: UserFormValues): CreateUserRequest {
  return {
    userName: values.userName.trim(),
    fullName: values.fullName.trim(),
    abbreviation: optionalText(values.abbreviation),
    email: optionalText(values.email),
    aplUserTypeId: optionalNumber(values.aplUserTypeId),
    authorizationLevel: optionalNumber(values.authorizationLevel),
    culture: optionalText(values.culture),
    uiCulture: optionalText(values.uiCulture),
  };
}

/**
 * The PUT body: only what changed (a cleared number or date can't be sent: null means
 * unchanged); null when nothing changed.
 */
export function toUpdateRequest(
  saved: { values: UserFormValues; contacts: ContactsDraft },
  edited: { values: UserFormValues; contacts: ContactsDraft },
): UpdateUserRequest | null {
  const request: UpdateUserRequest = {};
  const changed = (key: keyof UserFormValues) => saved.values[key].trim() !== edited.values[key].trim();
  for (const key of ["fullName", "abbreviation", "culture", "uiCulture"] as const) {
    if (changed(key)) request[key] = edited.values[key].trim();
  }
  for (const key of ["aplUserTypeId", "authorizationLevel"] as const) {
    if (changed(key) && edited.values[key].trim()) request[key] = Number(edited.values[key].trim());
  }
  if (changed("invalidDate") && edited.values.invalidDate) request.invalidDate = `${edited.values.invalidDate}T00:00:00`;
  const contacts = changedContacts(saved.contacts, edited.contacts);
  if (contacts?.emails) request.emails = contacts.emails;
  if (contacts?.phones) request.phones = contacts.phones;
  return Object.keys(request).length ? request : null;
}
