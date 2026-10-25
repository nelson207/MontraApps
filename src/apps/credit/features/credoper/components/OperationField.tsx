import type { ReactNode } from "react";
import type { FieldRule } from "../validation/fieldRules";

export type OperationFieldProps = {
  required: boolean;
  disabled: boolean;
  invalidMessage: string | null;
};

type Props = {
  rule: FieldRule;
  /** Validation message for this field (only passed once errors should show) */
  error?: string | null;
  children: (props: OperationFieldProps) => ReactNode;
};

// Applies a server field rule to the field it wraps: hidden fields render nothing,
// read-only ones are disabled, required ones get the "*" and the error message.
function OperationField({ rule, error = null, children }: Props) {
  if (!rule.visible) return null;
  return <>{children({ required: rule.required, disabled: rule.readOnly, invalidMessage: error })}</>;
}

export default OperationField;
