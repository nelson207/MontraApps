import React from "react";
import type { SelectFieldProps } from "./fieldProps";
import SearchableSelect, { type SelectOption } from "./SearchableSelect";

// Labelled, searchable select for forms (wraps SearchableSelect).
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
  selectedLabel,
  onSearchChange,
  hasMore,
  isLoadingMore,
  onLoadMore,
  invalidMessage,
}) => {
  const feedbackId = `${id}-feedback`;
  const selectOptions: SelectOption[] = (options ?? [])
    .filter((opt) => opt.value !== null && opt.value !== undefined)
    .map((opt) => ({
      value: opt.value as string | number,
      label: opt.label ?? String(opt.value),
      title: opt.title ?? undefined,
    }));

  const select = (
    <SearchableSelect
      id={id}
      value={value}
      options={selectOptions}
      onChange={(next) => onChange({ target: { value: next } })}
      placeholder={placeholder}
      disabled={disabled}
      isLoading={isLoading}
      selectedLabel={selectedLabel}
      onSearchChange={onSearchChange}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onLoadMore={onLoadMore}
      invalid={!!invalidMessage}
      aria-describedby={invalidMessage ? feedbackId : undefined}
    />
  );

  return (
    <div className={`mb-3 ${visible ? "" : "d-none"}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}

      {inputGroupSpan ? (
        <div className="input-group flex-nowrap">
          <span className="input-group-text">{inputGroupSpan}</span>
          {select}
        </div>
      ) : (
        select
      )}
      {invalidMessage && (
        <div id={feedbackId} className="invalid-feedback d-block">
          {invalidMessage}
        </div>
      )}
    </div>
  );
};

export default SelectField;
