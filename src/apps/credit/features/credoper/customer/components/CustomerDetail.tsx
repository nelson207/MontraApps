import InputField from "@platform/components/ui/InputField";
import PhoneInput from "@platform/features/phone/components/PhoneInput";
import type { PhoneType } from "@platform/features/phone/phoneModel";
import {
  setCredOperField,
  setCustomerVATField,
  setEmailField,
  setLandLinePhoneField,
  setMobilePhoneField,
} from "../../utils/fieldSetters";
import { selectCredoper, useAppSelector } from "@credit/store";
import { fieldRule, type FieldErrors } from "../../validation/fieldRules";
import type { QuotationDataProps } from "../../types/credoperTypes";
import OperationField from "../../components/OperationField";

type Props = QuotationDataProps & {
  /** Validation messages to show (field path → message) */
  errors?: FieldErrors;
};

type PhoneProps = {
  id: string;
  label: string;
  value: string | null | undefined;
  type: PhoneType;
  required: boolean;
  disabled: boolean;
  invalidMessage: string | null;
  onChange: (value: string) => void;
};

/** Labelled phone field (OperationField passes required / disabled / invalidMessage) */
function PhoneField({ id, label, value, type, required, disabled, invalidMessage, onChange }: PhoneProps) {
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

// Customer fields of the operation (same field set as before), driven by the
// server field rules; messages come from validation (customerRules.ts keys).
function CustomerDetail({ dispatchCredOper, errors = {} }: Props) {
  const credoper = useAppSelector(selectCredoper);
  const meta = credoper?.metadataResponse;
  const error = (key: string) => errors[key] ?? null;

  return (
    <div className="row gx-3">
      <div className="col-md-8">
        <OperationField rule={fieldRule(meta, "customerName")} error={error("customerName")}>
          {(field) => (
            <InputField
              label="Customer name"
              id="credoper.customerName"
              value={credoper?.customerName ?? ""}
              onChange={(e) => setCredOperField(dispatchCredOper, "customerName", e.target.value)}
              {...field}
            />
          )}
        </OperationField>
      </div>
      <div className="col-md-4">
        <OperationField rule={fieldRule(meta, "customerVAT")} error={error("customerVAT.legalDocNumber")}>
          {(field) => (
            <InputField
              label="Fiscal number"
              id="credoper.fiscalNumber"
              value={credoper?.customerVAT?.legalDocNumber ?? ""}
              onChange={(e) => setCustomerVATField(dispatchCredOper, credoper, "legalDocNumber", e.target.value)}
              {...field}
            />
          )}
        </OperationField>
      </div>
      <div className="col-md-6">
        <OperationField rule={fieldRule(meta, "customerEmail")} error={error("customerEmail.email")}>
          {(field) => (
            <InputField
              label="E-mail"
              id="credoper.customerEmail"
              type="email"
              value={credoper?.customerEmail?.email ?? ""}
              onChange={(e) => setEmailField(dispatchCredOper, credoper, "email", e.target.value)}
              inputGroupSpan="@"
              {...field}
            />
          )}
        </OperationField>
      </div>
      <div className="col-md-3">
        <OperationField rule={fieldRule(meta, "customerPhone")} error={error("customerPhone.phoneNumber")}>
          {(field) => (
            <PhoneField
              id="credoper.customerPhone"
              label="Mobile phone"
              type="mobile"
              value={credoper?.customerPhone?.phoneNumber}
              onChange={(value) => setMobilePhoneField(dispatchCredOper, credoper, "phoneNumber", value)}
              {...field}
            />
          )}
        </OperationField>
      </div>
      <div className="col-md-3">
        <OperationField rule={fieldRule(meta, "customerLandLine")} error={error("customerLandLine.phoneNumber")}>
          {(field) => (
            <PhoneField
              id="credoper.customerLandlinePhone"
              label="Landline phone"
              type="landline"
              value={credoper?.customerLandLine?.phoneNumber}
              onChange={(value) => setLandLinePhoneField(dispatchCredOper, credoper, "phoneNumber", value)}
              {...field}
            />
          )}
        </OperationField>
      </div>
    </div>
  );
}

export default CustomerDetail;
