export type InputFieldProps = {
  label?: string;
  id: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
  step?: number;
  value: string | number | undefined;
  required?: boolean;
  visible?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputGroupSpan?: React.ReactNode;
  actionButtonShow?: boolean;
  actionButtonLabel?: string;
  actionButtonOnClick?: () => void;
  disabled?: boolean;
  /** Validation message; marks the field invalid when set */
  invalidMessage?: string | null;
};

/** Change payload of SelectField: same shape consumers already read (`e.target.value`). */
export type SelectFieldChange = { target: { value: string } };

export type SelectFieldProps = {
  label?: string;
  id: string;
  value: string | number | null | undefined;
  isLoading?: boolean;
  onChange: (e: SelectFieldChange) => void;
  options?: SelectFieldOptions[] | null | undefined;
  placeholder?: string;
  inputGroupSpan?: React.ReactNode;
  disabled?: boolean | undefined;
  visible?: boolean;
  /** Lazy loading / server search, passed through to SearchableSelect */
  selectedLabel?: string;
  onSearchChange?: (search: string) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  /** Validation message; marks the field invalid when set */
  invalidMessage?: string | null;
};

export type SelectFieldOptions = {
  value?: string | number | null;
  label?: string | null;
  title?: string | null;
};
