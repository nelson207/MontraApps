import PhoneInput from "@platform/features/phone/components/PhoneInput";
import type { PhoneType, PhoneValue } from "@platform/features/phone/phoneModel";

type Props = {
  id: string;
  label: string;
  value: PhoneValue | null | undefined;
  type: PhoneType;
  required?: boolean;
  disabled?: boolean;
  invalidMessage?: string | null;
  onChange: (value: PhoneValue) => void;
};

/** Labelled phone field of the wizard: the Customer step's and the people's */
export default function PhoneField({ id, label, value, type, required, disabled, invalidMessage, onChange }: Props) {
  return (
    <div className="mb-3">
      <label className="form-label" htmlFor={id}>
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </label>
      <PhoneInput
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        invalid={!!invalidMessage}
        aria-describedby={invalidMessage ? `${id}-feedback` : undefined}
      />
      {invalidMessage && (
        <div id={`${id}-feedback`} className="invalid-feedback d-block">
          {invalidMessage}
        </div>
      )}
    </div>
  );
}
