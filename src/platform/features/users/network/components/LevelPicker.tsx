import { Fragment } from "react";
import { SCOPE_DESCRIPTIONS, scopeOf, USER_LEVELS, type UserLevel } from "../userLevels";

type Props = {
  value: UserLevel;
  onChange: (level: UserLevel) => void;
};

// A–E as a Bootstrap radio button group, with what the chosen level gives access to.
function LevelPicker({ value, onChange }: Props) {
  return (
    <fieldset>
      <legend className="form-label fw-semibold fs-6 mb-2">Access level</legend>
      <div className="btn-group w-100 app-level-picker" role="radiogroup" aria-label="Access level">
        {/* input + label as direct children, so .btn-group joins the buttons */}
        {USER_LEVELS.map((level) => (
          <Fragment key={level}>
            <input
              type="radio"
              className="btn-check"
              name="user-level"
              id={`user-level-${level}`}
              value={level}
              checked={value === level}
              onChange={() => onChange(level)}
            />
            <label className="btn btn-outline-primary flex-fill fw-semibold" htmlFor={`user-level-${level}`}>
              {level}
            </label>
          </Fragment>
        ))}
      </div>
      <div className="form-text">
        <i className="bi bi-info-circle me-1" />
        Level {value}: {SCOPE_DESCRIPTIONS[scopeOf(value)]}.
      </div>
    </fieldset>
  );
}

export default LevelPicker;
