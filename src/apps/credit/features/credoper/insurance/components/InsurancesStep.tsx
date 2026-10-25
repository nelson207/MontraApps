import { useState } from "react";
import { selectCredoper, useAppDispatch, useAppSelector } from "@credit/store";
import { addInsurance, removeInsurance, updateInsurance } from "../../credoperSlice";
import {
  insuredLabel,
  type CarInsurance,
  type CreditProtectionInsurance,
  type CredOperDraft,
  type Insurance,
} from "../../model/credOperDraft";
import type { FieldErrors } from "../../validation/fieldRules";
import { todayLocal } from "../../validation/localDate";
import type { StepProps } from "../../wizard/stepTypes";
import { isAutoInsurance } from "../../model/business";
import { useGetInsuranceTypesQuery } from "../insuranceApi";
import { validateInsurance } from "../insuranceRules";
import CarInsuranceDialog from "./CarInsuranceDialog";
import CreditProtectionDialog from "./CreditProtectionDialog";

type DialogState =
  | { kind: "creditProtection"; editing?: CreditProtectionInsurance }
  | { kind: "car"; editing?: CarInsurance }
  | null;

function InsuranceCard({
  insurance,
  operation,
  typeName,
  errors,
  onEdit,
  onRemove,
}: {
  insurance: Insurance;
  operation: CredOperDraft;
  typeName?: string;
  errors: FieldErrors;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const insured = insuredLabel(insurance, operation);
  // Broken links are always flagged (spec §5); other errors once they're shown
  const linkError = validateInsurance(insurance, operation, todayLocal())[`insurances.${insurance.id}.link`];
  const otherErrors = Object.entries(errors)
    .filter(([key]) => key.startsWith(`insurances.${insurance.id}.`) && !key.endsWith(".link"))
    .map(([, message]) => message);

  return (
    <div className={`app-insurance-card ${linkError || otherErrors.length ? "has-errors" : ""}`}>
      <div className="flex-grow-1 overflow-hidden">
        <div className="fw-semibold text-truncate">{typeName ?? "Insurance"}</div>
        <div className="small text-body-secondary text-truncate">
          <i className={`bi ${insurance.kind === "car" ? "bi-car-front" : "bi-person"} me-1`} aria-hidden="true" />
          {insured ?? "—"}
        </div>
        {insurance.kind === "car" && (
          <div className="small text-body-secondary">
            Driver:{" "}
            {insurance.driver.mainDriverIsCustomer ? "the customer" : insurance.driver.name || "—"} ·{" "}
            {insurance.protectionIds.length} {insurance.protectionIds.length === 1 ? "protection" : "protections"}
          </div>
        )}
        {linkError && <div className="small text-danger mt-1">{linkError}</div>}
        {otherErrors.map((message) => (
          <div key={message} className="small text-danger mt-1">
            {message}
          </div>
        ))}
      </div>
      <div className="d-flex gap-1 flex-shrink-0">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onEdit} aria-label={`Edit ${typeName ?? "insurance"}`}>
          <i className="bi bi-pencil" />
        </button>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRemove} aria-label={`Remove ${typeName ?? "insurance"}`}>
          <i className="bi bi-trash" />
        </button>
      </div>
    </div>
  );
}

// Proposal: optional insurances, several of each kind (spec §5).
function InsurancesStep({ errors }: StepProps) {
  const dispatch = useAppDispatch();
  const operation = useAppSelector(selectCredoper);
  const [dialog, setDialog] = useState<DialogState>(null);
  const protectionTypes = useGetInsuranceTypesQuery("CreditProtection");
  const carTypes = useGetInsuranceTypesQuery("Car");
  if (!operation) return null;

  const typeName = (ins: Insurance) =>
    (ins.kind === "car" ? carTypes.data : protectionTypes.data)?.find((t) => t.id === ins.insuranceTypeId)?.name;

  const save = (ins: Insurance) => {
    const exists = operation.insurances.some((i) => i.id === ins.id);
    dispatch(exists ? updateInsurance({ id: ins.id, changes: ins }) : addInsurance(ins));
    setDialog(null);
  };

  const remove = (ins: Insurance) => {
    if (window.confirm(`Remove ${typeName(ins) ?? "this insurance"}?`)) dispatch(removeInsurance(ins.id));
  };

  // Auto insurance: the car insurance is the product (no credit to protect)
  const autoInsurance = isAutoInsurance(operation);
  const allSections = [
    {
      kind: "creditProtection" as const,
      title: "Credit protection",
      icon: "bi-person-check",
      canAdd: (operation.interventions?.length ?? 0) > 0,
      hint: "Add a person in Interventions first.",
    },
    {
      kind: "car" as const,
      title: "Car insurance",
      icon: "bi-car-front",
      canAdd: (operation.assets?.length ?? 0) > 0,
      hint: "Add a vehicle in Financial data first.",
    },
  ];

  const sections = autoInsurance ? allSections.filter((section) => section.kind === "car") : allSections;

  return (
    <>
      <p className="text-body-secondary small">
        {autoInsurance
          ? "The insurance for the vehicle: type, driver and protections."
          : "Insurances are optional. You can add several of each kind."}
      </p>
      {errors["insurances.required"] && (
        <div className="alert alert-warning d-flex align-items-center gap-2 py-2" role="alert">
          <i className="bi bi-exclamation-triangle" aria-hidden="true" />
          {errors["insurances.required"]}
        </div>
      )}

      {sections.map((section) => {
        const list = operation.insurances.filter((i) => i.kind === section.kind);
        return (
          <section key={section.kind} className="mb-4">
            <div className="app-form-section justify-content-between">
              <span>
                <i className={`bi ${section.icon} me-2`} aria-hidden="true" />
                {section.title}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                disabled={!section.canAdd}
                title={!section.canAdd ? section.hint : undefined}
                onClick={() => setDialog({ kind: section.kind })}
              >
                <i className="bi bi-plus-lg me-1" aria-hidden="true" />
                Add
              </button>
            </div>
            {!section.canAdd && <p className="small text-body-secondary">{section.hint}</p>}
            {list.length === 0 ? (
              section.canAdd && <p className="small text-body-secondary mb-0">No insurances added.</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {list.map((ins) => (
                  <InsuranceCard
                    key={ins.id}
                    insurance={ins}
                    operation={operation}
                    typeName={typeName(ins)}
                    errors={errors}
                    onEdit={() =>
                      setDialog(ins.kind === "car" ? { kind: "car", editing: ins } : { kind: "creditProtection", editing: ins })
                    }
                    onRemove={() => remove(ins)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {dialog?.kind === "creditProtection" && (
        <CreditProtectionDialog operation={operation} initial={dialog.editing} onSave={save} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "car" && (
        <CarInsuranceDialog operation={operation} initial={dialog.editing} onSave={save} onClose={() => setDialog(null)} />
      )}
    </>
  );
}

export default InsurancesStep;
