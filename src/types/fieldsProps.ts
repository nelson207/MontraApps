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
};

export type SelectFieldProps = {
  label?: string;
  id: string;
  value: string | number | undefined;
  isLoading?: boolean;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options?: SelectFieldOptions[] | null | undefined;
  placeholder?: string;
  inputGroupSpan?: React.ReactNode;
  disabled?: boolean | undefined;
  visible?: boolean;
};

export type SelectFieldOptions = {
  value?: string | number | null;
  label?: string | null;
  title?: string | null;
};
