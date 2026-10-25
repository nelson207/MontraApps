import { useState } from "react";
import SelectField from "@platform/components/ui/SelectField";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import {
  interventionName,
  interventionRole,
  ROLE_LABELS,
  type CreditProtectionInsurance,
  type CredOperDraft,
} from "../../model/credOperDraft";
import { todayLocal } from "../../validation/localDate";
import { useGetInsuranceTypesQuery } from "../insuranceApi";
import { DUPLICATE_MESSAGE, isDuplicate, validateInsurance } from "../insuranceRules";
import InsuranceDialog from "./InsuranceDialog";
import { newId } from "@platform/utils/newId";

type Props = {
  operation: CredOperDraft;
  initial?: CreditProtectionInsurance;
  onSave: (insurance: CreditProtectionInsurance) => void;
  onClose: () => void;
};

// Credit protection: who is insured + which insurance type.
function CreditProtectionDialog({ operation, initial, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<CreditProtectionInsurance>(
    () =>
      initial ?? {
        id: newId(),
        kind: "creditProtection",
        insuranceTypeId: 0,
        interventionRef: operation.interventions?.[0]?.correlationID ?? "",
      },
  );
  const [submitted, setSubmitted] = useState(false);
  const types = useGetInsuranceTypesQuery("CreditProtection");

  const others = operation.insurances.filter((i) => i.id !== draft.id);
  const errors = validateInsurance(draft, operation, todayLocal());
  const duplicate = isDuplicate(draft, [...others, draft]);
  const show = (field: string) => (submitted ? (errors[`insurances.${draft.id}.${field}`] ?? null) : null);

  const save = () => {
    setSubmitted(true);
    if (Object.keys(errors).length === 0 && !duplicate) onSave(draft);
  };

  return (
    <InsuranceDialog title={initial ? "Edit credit protection" : "Add credit protection"} onSave={save} onClose={onClose}>
      <SelectField
        id="insurance-person"
        label="Insured person"
        value={draft.interventionRef}
        options={(operation.interventions ?? []).map((person) => ({
          value: person.correlationID ?? "",
          label: `${interventionName(person)} · ${ROLE_LABELS[interventionRole(person)]}`,
        }))}
        onChange={(e) => setDraft((d) => ({ ...d, interventionRef: e.target.value }))}
        invalidMessage={show("link")}
      />

      {types.isError ? (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
          <span className="flex-grow-1">{getApiErrorMessage(types.error) ?? "Couldn't load insurance types."}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => types.refetch()}>
            Retry
          </button>
        </div>
      ) : (
        <SelectField
          id="insurance-type"
          label="Insurance type"
          value={draft.insuranceTypeId || undefined}
          isLoading={types.isLoading}
          placeholder="Select an insurance type"
          options={types.data?.map((t) => ({ value: t.id, label: t.name, title: t.description }))}
          onChange={(e) => setDraft((d) => ({ ...d, insuranceTypeId: Number(e.target.value) }))}
          invalidMessage={show("insuranceTypeId")}
        />
      )}
      {draft.insuranceTypeId > 0 && (
        <p className="small text-body-secondary mt-n2">
          {types.data?.find((t) => t.id === draft.insuranceTypeId)?.description}
        </p>
      )}

      {submitted && duplicate && (
        <div className="alert alert-warning py-2 mb-0" role="alert">
          {DUPLICATE_MESSAGE}
        </div>
      )}
    </InsuranceDialog>
  );
}

export default CreditProtectionDialog;
