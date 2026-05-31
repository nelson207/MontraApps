import React from "react";
import type { InputFieldProps } from "../../types/fieldsProps";

const InputField: React.FC<InputFieldProps> = ({
  label,
  id,
  type = "text",
  placeholder,
  min,
  max,
  step,
  value,
  required = false,
  visible = true,
  onChange,
  inputGroupSpan,
  actionButtonShow = false,
  actionButtonLabel,
  actionButtonOnClick,
}) => {
  return (
    <div style={{ display: visible ? "block" : "none" }} className="mb-3">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}

      <div className="input-group">
        {inputGroupSpan && (
          <span className="input-group-text">{inputGroupSpan}</span>
        )}

        <input
          type={type}
          className={`form-control ${
            required ? (!value ? "is-invalid" : "is-valid") : ""
          }`}
          id={id}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          value={value}
          required={required}
          onChange={onChange}
        />

        {actionButtonShow && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={actionButtonOnClick}
          >
            {actionButtonLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default InputField;
