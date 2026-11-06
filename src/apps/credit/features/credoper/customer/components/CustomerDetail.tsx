import InputField from "@platform/components/ui/InputField";
import PhoneField from "../../components/forms/PhoneField";
import {
  setCredOperField,
  setCustomerVATField,
  setEmailField,
  setLandLinePhone,
  setMobilePhone,
} from "../../utils/fieldSetters";
import { selectCredoper, useAppSelector } from "@credit/store";
import { fieldRule, type FieldErrors } from "../../validation/fieldRules";
import type { QuotationDataProps } from "../../types/credoperTypes";
import OperationField from "../../components/OperationField";

type Props = QuotationDataProps & {
  /** Validation messages to show (field path → message) */
  errors?: FieldErrors;
};

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
              value={credoper?.customerPhone}
              onChange={(phone) => setMobilePhone(dispatchCredOper, credoper, phone)}
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
              value={credoper?.customerLandLine}
              onChange={(phone) => setLandLinePhone(dispatchCredOper, credoper, phone)}
              {...field}
            />
          )}
        </OperationField>
      </div>
    </div>
  );
}

export default CustomerDetail;
