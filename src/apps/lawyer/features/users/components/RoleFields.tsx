import { Fragment } from "react";
import type { AccessErrors } from "@platform/features/users/usersAccess";
import { LAWYER_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, type LawyerAccess } from "../roles";

type Props = { value: LawyerAccess; onChange: (next: LawyerAccess) => void; errors: AccessErrors };

// Lawyer's "Access" section of the shared user form: the role, as a radio button group.
function RoleFields({ value, onChange, errors }: Props) {
  return (
    <fieldset>
      <legend className="form-label fw-semibold fs-6 mb-2">Role</legend>
      <div className="btn-group w-100 app-role-picker" role="radiogroup" aria-label="Role">
        {LAWYER_ROLES.map((role) => (
          <Fragment key={role}>
            <input
              type="radio"
              className="btn-check"
              name="user-role"
              id={`user-role-${role}`}
              checked={value.role === role}
              onChange={() => onChange({ role })}
            />
            <label className="btn btn-outline-primary flex-fill fw-semibold" htmlFor={`user-role-${role}`}>
              {ROLE_LABELS[role]}
            </label>
          </Fragment>
        ))}
      </div>
      {errors.role ? (
        <div className="invalid-feedback d-block">{errors.role}</div>
      ) : (
        <div className="form-text">
          <i className="bi bi-info-circle me-1" />
          {ROLE_DESCRIPTIONS[value.role]}.
        </div>
      )}
    </fieldset>
  );
}

export default RoleFields;
