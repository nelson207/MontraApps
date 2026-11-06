import React, { useState } from "react";
import { useSingleOptionDefault } from "@platform/hooks/useSingleOptionDefault";
import type { SelectFieldProps } from "./fieldProps";
import SearchableSelect, { type SelectOption } from "./SearchableSelect";

// Labelled, searchable select for forms (wraps SearchableSelect). With only one option to choose
// from, an empty field selects it by itself (useSingleOptionDefault).
const SelectField: React.FC<SelectFieldProps> = ({
  label,
  required = false,
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
      disabled: opt.disabled,
      hint: opt.hint,
    }));

  // One result of a search isn't "only one option": once searched, the list decides nothing by itself
  const [searched, setSearched] = useState(false);
  const searchChanged = onSearchChange
    ? (search: string) => {
        if (search) setSearched(true);
        onSearchChange(search);
      }
    : undefined;

  const isEmpty = value === null || value === undefined || value === "";
  const choosable = selectOptions.filter((opt) => !opt.disabled && opt.value !== "");
  const complete = !isLoading && !hasMore && !isLoadingMore;
  useSingleOptionDefault(
    isEmpty && visible && !disabled && complete && !searched && choosable.length === 1 ? choosable[0].value : null,
    (only) => onChange({ target: { value: String(only) } }),
  );

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
      onSearchChange={searchChanged}
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
          {required && <span className="text-danger ms-1">*</span>}
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
