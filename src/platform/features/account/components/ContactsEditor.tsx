import { useState, type ReactNode } from "react";
import type { CountryDto } from "@platform/api/generated/MontraPOSApi";
import SelectField from "@platform/components/ui/SelectField";
import {
  countryOptions,
  isRemovable,
  newAddress,
  newEmail,
  newPhone,
  phonePrefixOf,
  withMain,
  type ContactErrors,
  type ContactList,
  type ContactsDraft,
} from "../contactDetails";

type Props = {
  value: ContactsDraft;
  onChange: (next: ContactsDraft) => void;
  /** The current errors (validateContacts) */
  errors: ContactErrors;
  /** Every error shows (after a submit); before that, an e-mail's shows once the field is left */
  showErrors: boolean;
  countries: CountryDto[] | undefined;
  loadingCountries?: boolean;
  /** The lists edited here (user administration has no addresses) */
  lists?: ContactList[];
  /** Element ids: `${idPrefix}-…` */
  idPrefix: string;
};

const DEFAULT_COUNTRY = "PRT";

function ListSection({ title, icon, onAdd, addLabel, empty, children }: {
  title: string;
  icon: string;
  onAdd: () => void;
  addLabel: string;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <section className="d-flex flex-column gap-2">
      <div className="d-flex align-items-center gap-2">
        <h3 className="h6 text-body-secondary mb-0 flex-grow-1">
          <i className={`bi ${icon} me-2`} aria-hidden="true" />
          {title}
        </h3>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={onAdd}>
          <i className="bi bi-plus-lg me-1" aria-hidden="true" />
          {addLabel}
        </button>
      </div>
      {empty ? <p className="small text-body-secondary mb-0">None yet.</p> : children}
    </section>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="btn btn-sm btn-link text-danger" aria-label={label} title={label} onClick={onClick}>
      <i className="bi bi-x-lg" aria-hidden="true" />
    </button>
  );
}

function MainRadio({ id, name, checked, onChange }: { id: string; name: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="form-check mb-0 text-nowrap">
      <input className="form-check-input" type="radio" id={id} name={name} checked={checked} onChange={onChange} />
      <label className="form-check-label small" htmlFor={id}>
        Main
      </label>
    </div>
  );
}

// The contact lists of a user: e-mails, phones and addresses. Saved items can be edited but not
// removed (the API deletes nothing); a new one can be removed until it's saved. Countries are
// the API's ids (e.g. PRT), shown by abbreviation; a phone's prefix is its country's.
function ContactsEditor({ value, onChange, errors, showErrors, countries, loadingCountries, lists = ["emails", "phones", "addresses"], idPrefix }: Props) {
  const set = <L extends ContactList>(list: L, items: ContactsDraft[L]) => onChange({ ...value, [list]: items });
  const update = <L extends ContactList>(list: L, key: string, changes: Partial<ContactsDraft[L][number]>) =>
    set(list, value[list].map((item) => (item.key === key ? { ...item, ...changes } : item)) as ContactsDraft[L]);
  const remove = <L extends ContactList>(list: L, key: string) =>
    set(list, value[list].filter((item) => item.key !== key) as ContactsDraft[L]);
  /** E-mail fields already left: they're validated right away */
  const [leftEmails, setLeftEmails] = useState<string[]>([]);
  const error = (list: ContactList, key: string, field: string) => {
    const path = `${list}.${key}.${field}`;
    return showErrors || leftEmails.includes(path) ? (errors[path] ?? null) : null;
  };
  const id = (...parts: string[]) => [idPrefix, ...parts].join("-");
  const phoneCountries = countryOptions(countries, true);
  const addressCountries = countryOptions(countries);
  const defaultCountry = countries?.some((c) => c.id === DEFAULT_COUNTRY) ? DEFAULT_COUNTRY : (countries?.[0]?.id ?? null);

  return (
    <div className="d-flex flex-column gap-4">
      {lists.includes("emails") && (
        <ListSection
          title="E-mails"
          icon="bi-envelope"
          addLabel="Add e-mail"
          empty={value.emails.length === 0}
          onAdd={() => set("emails", [...value.emails, newEmail(value.emails.length === 0)])}
        >
          {value.emails.map((email) => {
            const message = error("emails", email.key, "emailAddress");
            return (
              <div key={email.key} className="d-flex flex-wrap align-items-start gap-2">
                <div className="flex-grow-1" style={{ minWidth: "14rem" }}>
                  <label htmlFor={id("email", email.key)} className="visually-hidden">
                    E-mail address
                  </label>
                  <input
                    id={id("email", email.key)}
                    type="email"
                    className={`form-control ${message ? "is-invalid" : ""}`}
                    placeholder="name@example.com"
                    value={email.emailAddress ?? ""}
                    autoComplete="email"
                    aria-describedby={message ? id("email", email.key, "feedback") : undefined}
                    onChange={(e) => update("emails", email.key, { emailAddress: e.target.value })}
                    onBlur={() => {
                      const path = `emails.${email.key}.emailAddress`;
                      if (!leftEmails.includes(path)) setLeftEmails([...leftEmails, path]);
                    }}
                  />
                  {message && (
                    <div id={id("email", email.key, "feedback")} className="invalid-feedback">
                      {message}
                    </div>
                  )}
                </div>
                <div className="d-flex align-items-center gap-2 pt-2">
                  {email.id &&
                    (email.isValidated ? (
                      <span className="badge rounded-pill bg-success-subtle text-success-emphasis">Confirmed</span>
                    ) : (
                      <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis">Not confirmed</span>
                    ))}
                  <MainRadio
                    id={id("email", email.key, "main")}
                    name={id("email-main")}
                    checked={!!email.isMain}
                    onChange={() => set("emails", withMain(value.emails, email.key))}
                  />
                  {isRemovable(email) && <RemoveButton label="Remove this e-mail" onClick={() => remove("emails", email.key)} />}
                </div>
              </div>
            );
          })}
        </ListSection>
      )}

      {lists.includes("phones") && (
        <ListSection
          title="Phones"
          icon="bi-telephone"
          addLabel="Add phone"
          empty={value.phones.length === 0}
          onAdd={() => set("phones", [...value.phones, newPhone(value.phones.length === 0, defaultCountry)])}
        >
          {value.phones.map((phone) => {
            const numberMessage = error("phones", phone.key, "phoneNumber");
            const prefix = phonePrefixOf(countries, phone.countryId);
            return (
              <div key={phone.key} className="row gx-2 align-items-start">
                <div className="col-12 col-sm-5 col-lg-4">
                  <SelectField
                    id={id("phone", phone.key, "country")}
                    placeholder="Country"
                    isLoading={loadingCountries}
                    value={phone.countryId ?? undefined}
                    options={phoneCountries}
                    onChange={(e) => update("phones", phone.key, { countryId: e.target.value })}
                    invalidMessage={error("phones", phone.key, "countryId")}
                  />
                </div>
                <div className="col">
                  <label htmlFor={id("phone", phone.key)} className="visually-hidden">
                    Phone number
                  </label>
                  <div className={`input-group ${numberMessage ? "has-validation" : ""}`}>
                    {prefix && <span className="input-group-text">{prefix}</span>}
                    <input
                      id={id("phone", phone.key)}
                      type="tel"
                      inputMode="tel"
                      className={`form-control ${numberMessage ? "is-invalid" : ""}`}
                      placeholder="Number"
                      value={phone.phoneNumber ?? ""}
                      autoComplete="tel-national"
                      aria-describedby={numberMessage ? id("phone", phone.key, "feedback") : undefined}
                      onChange={(e) => update("phones", phone.key, { phoneNumber: e.target.value })}
                    />
                    {numberMessage && (
                      <div id={id("phone", phone.key, "feedback")} className="invalid-feedback">
                        {numberMessage}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-auto d-flex align-items-center gap-2 pt-2">
                  <MainRadio
                    id={id("phone", phone.key, "main")}
                    name={id("phone-main")}
                    checked={!!phone.isMain}
                    onChange={() => set("phones", withMain(value.phones, phone.key))}
                  />
                  {isRemovable(phone) && <RemoveButton label="Remove this phone" onClick={() => remove("phones", phone.key)} />}
                </div>
              </div>
            );
          })}
        </ListSection>
      )}

      {lists.includes("addresses") && (
        <ListSection
          title="Addresses"
          icon="bi-geo-alt"
          addLabel="Add address"
          empty={value.addresses.length === 0}
          onAdd={() => set("addresses", [...value.addresses, newAddress(defaultCountry)])}
        >
          {value.addresses.map((address, index) => {
            const details = address.details ?? {};
            const setDetails = (changes: Partial<typeof details>) =>
              update("addresses", address.key, { details: { ...details, ...changes } as typeof address.details });
            const text = (field: "street" | "postalCode" | "locality", label: string, col: string) => {
              const message = error("addresses", address.key, field);
              return (
                <div className={col}>
                  <label htmlFor={id("address", address.key, field)} className="form-label small">
                    {label}
                  </label>
                  <input
                    id={id("address", address.key, field)}
                    className={`form-control ${message ? "is-invalid" : ""}`}
                    value={details[field] ?? ""}
                    onChange={(e) => setDetails({ [field]: e.target.value })}
                  />
                  {message && <div className="invalid-feedback">{message}</div>}
                </div>
              );
            };
            return (
              <div key={address.key} className="border rounded-3 p-3">
                <div className="d-flex align-items-center mb-2">
                  <span className="small fw-semibold flex-grow-1">
                    {address.id ? (address.singleLine?.trim() || `Address ${index + 1}`) : "New address"}
                  </span>
                  {isRemovable(address) && <RemoveButton label="Remove this address" onClick={() => remove("addresses", address.key)} />}
                </div>
                <div className="row g-2">
                  {text("street", "Street", "col-12")}
                  {text("postalCode", "Postal code", "col-12 col-sm-4")}
                  {text("locality", "Locality", "col-12 col-sm-8")}
                  <div className="col-12 col-sm-6">
                    <SelectField
                      label="Country"
                      id={id("address", address.key, "country")}
                      placeholder="Country"
                      isLoading={loadingCountries}
                      value={details.countryId ?? undefined}
                      options={addressCountries}
                      onChange={(e) => setDetails({ countryId: e.target.value })}
                      invalidMessage={error("addresses", address.key, "countryId")}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </ListSection>
      )}
    </div>
  );
}

export default ContactsEditor;
