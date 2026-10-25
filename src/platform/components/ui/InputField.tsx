import React from "react";
import type { InputFieldProps } from "./fieldProps";
import DateInput from "./DateInput";

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
  disabled = false,
  invalidMessage,
}) => {
  const feedbackId = `${id}-feedback`;
  return (
    <div className={`mb-3 ${visible ? "" : "d-none"}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}

      {type === "date" ? (
        // Typed in the user's date format; the form still gets e.target.value as yyyy-MM-dd
        <DateInput
          id={id}
          value={value === undefined ? "" : String(value)}
          min={min === undefined ? undefined : String(min)}
          max={max === undefined ? undefined : String(max)}
          disabled={disabled}
          required={required}
          invalid={!!invalidMessage}
          aria-describedby={invalidMessage ? feedbackId : undefined}
          onChange={(iso) =>
            onChange({
              target: { value: iso },
            } as React.ChangeEvent<HTMLInputElement>)
          }
        />
      ) : (
        <div className="input-group">
          {inputGroupSpan && (
            <span className="input-group-text">{inputGroupSpan}</span>
          )}

          <input
            type={type}
            className={`form-control ${invalidMessage ? "is-invalid" : ""}`}
            aria-invalid={invalidMessage ? true : undefined}
            aria-describedby={invalidMessage ? feedbackId : undefined}
            disabled={disabled}
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
      )}
      {invalidMessage && (
        <div id={feedbackId} className="invalid-feedback d-block">
          {invalidMessage}
        </div>
      )}
    </div>
  );
};

export default InputField;
