import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useGetApiCompaniesCountriesQuery } from "@platform/api/generated/MontraPOSApi";
import { PROBLEM, problemMessage } from "@platform/api/problemCode";
import ContactsEditor from "@platform/features/account/components/ContactsEditor";
import { validateContacts, type ContactsDraft } from "@platform/features/account/contactDetails";
import { listUrl } from "@platform/hooks/listUrl";
import { validateUserForm, type UserFormValues } from "../managedUser";

type Props = {
  mode: "create" | "edit";
  initial: UserFormValues;
  /** Edit only: the user's e-mails and phones */
  initialContacts?: ContactsDraft;
  submitLabel: string;
  isSaving: boolean;
  error: unknown;
  /** Edit: false while nothing changed (Save disabled) */
  isDirty?: (values: UserFormValues, contacts: ContactsDraft) => boolean;
  onSubmit: (values: UserFormValues, contacts: ContactsDraft) => void;
};

const NO_CONTACTS: ContactsDraft = { emails: [], phones: [], addresses: [] };

const SERVER_MESSAGES = {
  [PROBLEM.validationFailed]: "The server didn't accept these values. Check the form and try again.",
  [PROBLEM.userManagementForbidden]: "You can't manage this user",
};

// Create / edit user (user administration). Validated before sending; what the server rejects
// (validation_failed, user_management_forbidden…) shows at the form level.
function UserForm({ mode, initial, initialContacts = NO_CONTACTS, submitLabel, isSaving, error, isDirty, onSubmit }: Props) {
  const [values, setValues] = useState<UserFormValues>(initial);
  const [contacts, setContacts] = useState<ContactsDraft>(initialContacts);
  const [submitted, setSubmitted] = useState(false);
  const countries = useGetApiCompaniesCountriesQuery(undefined, { refetchOnMountOrArgChange: false, skip: mode === "create" });

  const errors = validateUserForm(values, mode);
  const contactErrors = mode === "edit" ? validateContacts(contacts) : {};
  const isValid = Object.keys(errors).length === 0 && Object.keys(contactErrors).length === 0;
  const canSave = !isSaving && (isDirty?.(values, contacts) ?? true);
  /** Fields validated as soon as they're left (the e-mail); the others on submit */
  const [left, setLeft] = useState<(keyof UserFormValues)[]>([]);
  const show = (key: keyof UserFormValues) => (submitted || left.includes(key) ? (errors[key] ?? null) : null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (isValid) onSubmit(values, contacts);
  };

  const field = (key: keyof UserFormValues, label: string, options: { type?: string; placeholder?: string; hint?: string; optional?: boolean; readOnly?: boolean; inputMode?: "numeric" } = {}) => {
    const message = show(key);
    const id = `user-${key}`;
    return (
      <div className="col-12 col-md-6">
        <label htmlFor={id} className="form-label">
          {label}
          {options.optional && <span className="text-body-secondary small ms-1">(optional)</span>}
        </label>
        <input
          id={id}
          type={options.type ?? "text"}
          inputMode={options.inputMode}
          className={`form-control ${message ? "is-invalid" : ""} ${options.readOnly ? "bg-body-tertiary" : ""}`}
          value={values[key]}
          placeholder={options.placeholder}
          readOnly={options.readOnly}
          autoComplete="off"
          aria-describedby={options.hint ? `${id}-hint` : undefined}
          onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
          onBlur={key === "email" && !left.includes(key) ? () => setLeft([...left, key]) : undefined}
        />
        {message && <div className="invalid-feedback">{message}</div>}
        {options.hint && (
          <div id={`${id}-hint`} className="form-text">
            {options.hint}
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="d-flex flex-column gap-4">
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-body py-3">
          <h2 className="h6 mb-0">
            <i className="bi bi-person me-2 text-primary" aria-hidden="true" />
            User
          </h2>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {field("userName", "User name", mode === "edit" ? { readOnly: true, hint: "Can't be changed." } : { placeholder: "e.g. asilva" })}
            {field("fullName", "Full name")}
            {field("abbreviation", "Abbreviation", { optional: true })}
            {mode === "create" &&
              field("email", "E-mail", {
                type: "email",
                optional: true,
                hint: "The user's password is e-mailed to this address.",
              })}
            {mode === "edit" &&
              field("invalidDate", "Can't sign in from", { type: "date", optional: true, hint: "Leave empty while the user may sign in." })}
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-body py-3">
          <h2 className="h6 mb-0">
            <i className="bi bi-shield-check me-2 text-primary" aria-hidden="true" />
            Access and language
          </h2>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {field("aplUserTypeId", "User type", { optional: true, inputMode: "numeric" })}
            {field("authorizationLevel", "Authorization level", {
              optional: true,
              inputMode: "numeric",
              hint: "You can't grant a level above your own.",
            })}
            {field("culture", "Culture", { optional: true, placeholder: "pt-PT" })}
            {field("uiCulture", "Interface language", { optional: true, placeholder: "pt-PT" })}
          </div>
        </div>
      </div>

      {mode === "edit" && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-body py-3">
            <h2 className="h6 mb-0">
              <i className="bi bi-person-lines-fill me-2 text-primary" aria-hidden="true" />
              Contacts
            </h2>
          </div>
          <div className="card-body">
            <ContactsEditor
              value={contacts}
              onChange={setContacts}
              errors={contactErrors}
              showErrors={submitted}
              countries={countries.currentData}
              loadingCountries={countries.isFetching}
              lists={["emails", "phones"]}
              idPrefix="user"
            />
          </div>
        </div>
      )}

      {submitted && !isValid && (
        <div className="alert alert-danger d-flex gap-2 mb-0" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span>Some fields need fixing before the user can be saved.</span>
        </div>
      )}
      {!!error && (
        <div className="alert alert-danger d-flex gap-2 mb-0" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span>{problemMessage(error, SERVER_MESSAGES) ?? "Couldn't save the user. Please try again."}</span>
        </div>
      )}

      <div className="d-flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary" disabled={!canSave}>
          {isSaving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
          {isSaving ? "Saving…" : submitLabel}
        </button>
        <Link to={listUrl("/admin/users")} className="btn btn-outline-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}

export default UserForm;
