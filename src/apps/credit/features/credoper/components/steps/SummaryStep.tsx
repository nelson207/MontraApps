import type { ReactNode } from "react";
import {
  selectCredoper,
  selectCredoperIsDirty,
  useAppSelector,
} from "@credit/store";
import type { CredOperDraft } from "../../model/credOperDraft";
import {
  issuesByStep,
  type StepId,
  type StepIssues,
} from "../../wizard/steps";
import type { StepProps } from "../../wizard/stepTypes";
import { hasFinancing, isAutoInsurance } from "../../model/business";
import { financingFigures } from "../review/financingFigures";
import { BusinessCard, CustomerCard, FinancingCard, InsurancesCard, PeopleCard, VehicleCards } from "../review/ReviewCards";
import { money, percent } from "../../hooks/useCalculation";

const FIELD_LABELS: Record<string, string> = {
  customerName: "Customer name",
  legalDocNumber: "Document number",
  email: "E-mail",
  phoneNumber: "Phone number",
  creditIntermediaryStructNode: "Credit intermediary",
  showRoomStructNode: "Supplier",
  salePersonStructNode: "Vendor",
  equipmentTypeId: "Equipment type",
  equipmentCategoryId: "Equipment category",
  equipmentStateId: "Equipment state",
  licencePlate: "License plate",
  registrationDate: "Registration date",
  description: "Description",
  netAmount: "Equipment amount",
  retakeAmount: "Initial entry amount",
  retakePercentage: "Initial entry percentage",
  credOperClassification: "Customer type",
  financialProduct: "Financial product",
  amount: "Financed amount",
  term: "Term",
  fullName: "Name",
  birthDate: "Birth date",
  validDate: "Identification document expiry",
  insuranceTypeId: "Insurance type",
  licenseExpiryDate: "Driver license expiry",
  name: "Driver name",
  licenseNumber: "Driver license number",
  protectionIds: "Protections",
  link: "Insured person / vehicle",
  duplicate: "Duplicate insurance",
  role: "Role",
  brand: "Brand",
  model: "Model",
  version: "Version",
  odometer: "Km",
  enginesize: "Engine size",
  doors: "Doors",
};

const fieldLabel = (key: string) =>
  FIELD_LABELS[key.split(".").at(-1) ?? ""] ?? "Field";

// --- Readiness -------------------------------------------------------------------

function Readiness({
  groups,
  stage,
  operation,
  goTo,
}: {
  groups: StepIssues[];
  stage: StepProps["stage"];
  operation: CredOperDraft;
  goTo: (step: StepId) => void;
}) {
  const isDirty = useAppSelector(selectCredoperIsDirty);
  const count = groups.reduce((total, group) => total + group.issues.length, 0);

  if (count === 0) {
    const hint =
      operation.id == null || isDirty
        ? `Everything required is filled in. Save the ${stage} to keep it.`
        : stage === "quotation"
          ? "Everything is saved. You can convert it to a proposal."
          : "Everything is saved.";
    return (
      <div className="app-readiness is-ready" role="status">
        <i
          className="bi bi-check-circle-fill app-readiness-icon"
          aria-hidden="true"
        />
        <div>
          <div className="fw-semibold">Ready</div>
          <div className="small text-body-secondary">{hint}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-readiness has-issues" role="status">
      <i
        className="bi bi-exclamation-triangle-fill app-readiness-icon"
        aria-hidden="true"
      />
      <div className="flex-grow-1 min-w-0">
        <div className="fw-semibold">
          {count === 1 ? "1 thing to fix" : `${count} things to fix`} before
          saving
        </div>
        <ul className="list-unstyled mb-0 mt-2 d-flex flex-column gap-2">
          {groups.map(({ step, issues }) => (
            <li key={step.id} className="app-readiness-step">
              <div className="d-flex align-items-center gap-2">
                <i className={`bi ${step.icon}`} aria-hidden="true" />
                <span className="fw-semibold">{step.label}</span>
                <span className="badge rounded-pill text-bg-warning">
                  {issues.length}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary ms-auto"
                  onClick={() => goTo(step.id)}
                >
                  Fix
                  <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
                </button>
              </div>
              <ul className="small mb-0 mt-1 ps-4 text-body-secondary">
                {issues.map(({ key, message }) => (
                  <li key={key}>
                    <span className="text-body">{fieldLabel(key)}</span>:{" "}
                    {message}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// --- Financing overview -------------------------------------------------------------

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="col">
      <small className="text-body-secondary d-block">{label}</small>
      <strong className="text-nowrap">{value}</strong>
    </div>
  );
}

/** The financing as calculated (read-only: the term and the calculation are in Financial data) */
function FinancingSummary({ operation, onEdit }: { operation: CredOperDraft; onEdit?: () => void }) {
  const f = financingFigures(operation);
  const amount = (value: number | null) => (value != null ? money.format(value) : "—");

  return (
    <section className="app-financing-overview" aria-label="Financing summary">
      <div className="row g-0">
        <div className="col-md-5 app-financing-hero">
          <small className="text-body-secondary">Monthly payment</small>
          <div className="app-financing-monthly">
            {amount(f.monthly)}
            <span className="fs-6 fw-normal text-body-secondary"> / month</span>
          </div>
          {!f.calculated && (
            <small className="text-body-secondary">
              Not calculated yet.{" "}
              {onEdit && (
                <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={onEdit}>
                  Calculate in Financial data
                </button>
              )}
            </small>
          )}
        </div>

        <div className="col-md-7 p-3 p-lg-4 d-flex flex-column gap-3">
          <div className="row row-cols-2 row-cols-sm-3 g-3">
            <Stat label="Financed amount" value={amount(f.financed)} />
            <Stat label={f.baseLabel} value={amount(f.base)} />
            <Stat
              label="Initial entry"
              value={
                f.initialEntry != null
                  ? `${money.format(f.initialEntry)}${f.initialEntryPercentage != null ? ` (${f.initialEntryPercentage} %)` : ""}`
                  : "—"
              }
            />
            <Stat label="Term" value={f.term != null ? `${f.term} months` : "—"} />
            <Stat label="TAN" value={percent(f.tan)} />
            <Stat label="TAEG" value={percent(f.taeg)} />
          </div>
          <small className="text-body-secondary">Indicative values, subject to approval.</small>
        </div>
      </div>
    </section>
  );
}

// --- Review cards (shared: ../review/ReviewCards) ----------------------------------

// Last step: is it ready, what does it cost, and a review of everything entered.
function SummaryStep({ stage, goTo, formProps, steps, errorsByStep }: StepProps) {
  const op = useAppSelector(selectCredoper);
  if (!op) return null;

  const options = formProps.options;
  const groups = issuesByStep(steps, errorsByStep);
  const has = (step: StepId) => steps.some((s) => s.id === step);
  const editable = (step: StepId) => (has(step) ? goTo : undefined);
  const issuesIn = (step: StepId) =>
    groups.find((g) => g.step.id === step)?.issues.length ?? 0;

  return (
    <div className="d-flex flex-column gap-4">
      <Readiness groups={groups} stage={stage} operation={op} goTo={goTo} />

      {hasFinancing(op) && (
        <FinancingSummary operation={op} onEdit={has("financial") ? () => goTo("financial") : undefined} />
      )}

      <div className="row g-3">
        <BusinessCard op={op} step="business" issues={issuesIn("business")} goTo={editable("business")} />

        <CustomerCard
          op={op}
          step="customer"
          issues={issuesIn("customer")}
          // A converted proposal's customer is read-only (shown in the Quotation step)
          goTo={steps.some((s) => s.id === "customer") ? goTo : undefined}
        />

        <VehicleCards op={op} step="equipment" issues={issuesIn("equipment")} goTo={editable("equipment")} />

        {hasFinancing(op) && (
          <FinancingCard op={op} options={options} step="financial" issues={issuesIn("financial")} goTo={goTo} />
        )}

        {stage === "proposal" && (
          <PeopleCard op={op} step="interventions" issues={issuesIn("interventions")} goTo={goTo} />
        )}

        {has("insurances") && (
          <InsurancesCard
            op={op}
            title={isAutoInsurance(op) ? "Insurance" : "Insurances"}
            step="insurances"
            issues={issuesIn("insurances")}
            goTo={goTo}
          />
        )}
      </div>
    </div>
  );
}

export default SummaryStep;
