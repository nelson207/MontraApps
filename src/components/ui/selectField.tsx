import React from "react";
import type { SelectFieldProps } from "../../types/fieldsProps";

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  id,
  value,
  isLoading = false,
  onChange,
  options = [],
  visible = true,
  placeholder,
  inputGroupSpan,
  disabled = false,
}) => {
  return (
    <div style={{ display: visible ? "block" : "none" }} className="mb-3">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}

      <div className="input-group position-relative">
        {inputGroupSpan && (
          <span className="input-group-text">{inputGroupSpan}</span>
        )}

        <select
          id={id}
          className="form-select pe-5"
          value={value}
          onChange={onChange}
          disabled={disabled}
        >
          {(placeholder || isLoading) && (
            <option value="" disabled>
              {isLoading ? "Loading..." : placeholder}
            </option>
          )}

          <option value="" disabled>
            Select an option
          </option>

          {options?.map((opt) => (
            <option
              key={opt.value}
              value={opt.value ?? "Not Defined"}
              title={(opt.title || opt.label) ?? "Not Defined"}
            >
              {opt.label}
            </option>
          ))}
        </select>

        {isLoading && (
          <div
            className="position-absolute top-50 end-0 translate-middle-y me-5"
            style={{ pointerEvents: "none", zIndex: 5 }}
          >
            <div
              className="spinner-border spinner-border-sm text-primary"
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectField;
