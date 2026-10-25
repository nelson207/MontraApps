import { useState, type FormEvent } from "react";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import { useChangePasswordMutation } from "../api/changePasswordApi";

const MIN_LENGTH = 8;

const REQUIREMENTS: { label: string; test: (password: string) => boolean }[] = [
  { label: `At least ${MIN_LENGTH} characters`, test: (p) => p.length >= MIN_LENGTH },
  { label: "Upper and lower case letters", test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "At least one number", test: (p) => /\d/.test(p) },
];

type Fields = { current: string; next: string; confirm: string };
const EMPTY: Fields = { current: "", next: "", confirm: "" };

function PasswordInput({
  id,
  label,
  value,
  autoComplete,
  invalidMessage,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  autoComplete: string;
  invalidMessage?: string | null;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label fw-semibold">
        {label}
      </label>
      <div className={`input-group ${invalidMessage ? "has-validation" : ""}`}>
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={`form-control ${invalidMessage ? "is-invalid" : ""}`}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          required
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onClick={() => setVisible((v) => !v)}
        >
          <i className={`bi ${visible ? "bi-eye-slash" : "bi-eye"}`} />
        </button>
        {invalidMessage && <div className="invalid-feedback">{invalidMessage}</div>}
      </div>
    </div>
  );
}

// Change password, embedded in Settings → Security.
function ChangePasswordSettings() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [changePassword, { isLoading, isSuccess, error, reset }] =
    useChangePasswordMutation();

  const set = (key: keyof Fields) => (value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (isSuccess || error) reset();
  };

  const meetsRequirements = REQUIREMENTS.every(({ test }) => test(fields.next));
  const errors = {
    current: !fields.current ? "Enter your current password." : null,
    next: !meetsRequirements
      ? "The new password doesn't meet the requirements."
      : fields.next === fields.current
        ? "The new password must be different from the current one."
        : null,
    confirm: fields.confirm !== fields.next ? "Passwords don't match." : null,
  };
  const isValid = !errors.current && !errors.next && !errors.confirm;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid) return;

    try {
      await changePassword({
        currentPassword: fields.current,
        newPassword: fields.next,
      }).unwrap();
      setFields(EMPTY);
      setSubmitted(false);
    } catch {
      // surfaced via `error`
    }
  };

  // Show field errors only after a submit attempt, so the form isn't red while typing
  const show = (message: string | null) => (submitted ? message : null);

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-body py-3">
        <h2 className="h6 mb-0">
          <i className="bi bi-key me-2 text-primary" />
          Change password
        </h2>
      </div>

      <div className="card-body">
        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-4">
            <div className="col-12 col-md-7">
              <PasswordInput
                id="current-password"
                label="Current password"
                value={fields.current}
                autoComplete="current-password"
                invalidMessage={show(errors.current)}
                onChange={set("current")}
              />
              <PasswordInput
                id="new-password"
                label="New password"
                value={fields.next}
                autoComplete="new-password"
                invalidMessage={show(errors.next)}
                onChange={set("next")}
              />
              <PasswordInput
                id="confirm-password"
                label="Confirm new password"
                value={fields.confirm}
                autoComplete="new-password"
                invalidMessage={show(errors.confirm)}
                onChange={set("confirm")}
              />
            </div>

            <div className="col-12 col-md-5">
              <div className="small fw-semibold mb-2">Password requirements</div>
              <ul className="list-unstyled small mb-0">
                {REQUIREMENTS.map(({ label, test }) => {
                  const met = test(fields.next);
                  return (
                    <li
                      key={label}
                      className={`d-flex align-items-center gap-2 mb-1 ${met ? "text-success" : "text-body-secondary"}`}
                    >
                      <i className={`bi ${met ? "bi-check-circle-fill" : "bi-circle"}`} />
                      {label}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <button type="submit" className="btn btn-primary mt-2" disabled={isLoading}>
            {isLoading && (
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
            )}
            {isLoading ? "Updating…" : "Update password"}
          </button>
        </form>

        {isSuccess && (
          <div className="alert alert-success d-flex gap-2 mt-3 mb-0" role="alert">
            <i className="bi bi-check-circle-fill" />
            <span>Your password was updated.</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger d-flex gap-2 mt-3 mb-0" role="alert">
            <i className="bi bi-exclamation-triangle-fill" />
            <span>
              {getApiErrorMessage(error) ?? "Couldn't update your password. Please try again."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChangePasswordSettings;
