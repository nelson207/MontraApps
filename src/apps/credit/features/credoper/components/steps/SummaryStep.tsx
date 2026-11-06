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
import { hasBuilding, hasEquipment, hasFinancing, isAutoInsurance } from "../../model/business";
import { dealSentence, financingFigures, paymentBreakdown, type PaymentBreakdown } from "../review/financingFigures";
import { CustomerCard, FinancingCard, InsurancesCard, PeopleCard, VehicleCards } from "../review/ReviewCards";
import { useVehicleName } from "../review/useVehicleName";
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
  equipYear: "Year",
  equipMonth: "Month",
  description: "Description",
  netAmount: "Equipment amount",
  retakeAmount: "Initial entry amount",
  retakePercentage: "Initial entry percentage",
  credOperClassification: "Contract classification",
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

export function Readiness({
  groups,
  stage,
  operation,
  goTo,
  resultsShown = false,
}: {
  groups: StepIssues[];
  stage: StepProps["stage"];
  operation: CredOperDraft;
  goTo: (step: StepId) => void;
  /** The last save's results are showing: they say whether it's saved */
  resultsShown?: boolean;
}) {
  const isDirty = useAppSelector(selectCredoperIsDirty);
  const count = groups.reduce((total, group) => total + group.issues.length, 0);

  if (count === 0) {
    if (resultsShown) return null;
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
        className="bi bi-x-octagon-fill app-readiness-icon"
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
                <span className="badge rounded-pill text-bg-danger">
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

// --- The deal ------------------------------------------------------------------------

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className="text-nowrap">{value}</dd>
    </div>
  );
}

const share = (part: number, whole: number) => Math.round((part / whole) * 1000) / 10;

/** How the equipment is paid, drawn to scale: its initial entry, what's financed, and any financed costs */
function PaymentBar({ breakdown, totalLabel }: { breakdown: PaymentBreakdown; totalLabel: string }) {
  const { entry, asset, costs, total } = breakdown;
  const parts = [
    { key: "entry", label: "Initial entry", value: entry },
    { key: "asset", label: costs > 0 ? "Financed equipment" : "Financed amount", value: asset },
    { key: "costs", label: "Fees, insurance and other costs", value: costs },
  ].filter((part) => part.value > 0);
  const described = parts.map((part) => `${part.label} ${money.format(part.value)}`).join(", ");
  return (
    <div>
      <div className="app-deal-bar" role="img" aria-label={`${totalLabel} ${money.format(total)}: ${described}`}>
        {parts.map((part) => (
          <span key={part.key} className={`is-${part.key}`} style={{ flexBasis: `${share(part.value, total)}%` }} />
        ))}
      </div>
      <div className="app-deal-key small">
        {parts.map((part) => (
          <span key={part.key}>
            <i className={`is-${part.key}`} aria-hidden="true" />
            <span>{part.label}</span> <strong className="app-tabular">{money.format(part.value)}</strong>{" "}
            <span className="text-body-secondary app-tabular">({share(part.value, total).toLocaleString("pt-PT")} %)</span>
          </span>
        ))}
        <span className="ms-auto text-body-secondary">
          {totalLabel} <strong className="text-body app-tabular">{money.format(total)}</strong>
        </span>
      </div>
    </div>
  );
}

/** What's being financed, as the deal's sentence names it */
function useFinancedThing(op: CredOperDraft): string | null {
  const vehicle = useVehicleName(op, 0);
  if (hasBuilding(op)) return "a building";
  if (!hasEquipment(op)) return null;
  const count = op.assets?.length ?? 0;
  return count > 1 ? `${count} vehicles` : vehicle;
}

/** The deal at a glance (read-only: the term and the calculation are in Financial data) */
export function DealOverview({ operation, stale = false, onEdit }: { operation: CredOperDraft; stale?: boolean; onEdit?: () => void }) {
  const f = financingFigures(operation);
  const breakdown = paymentBreakdown(operation);
  const thing = useFinancedThing(operation);
  const sentence = dealSentence(
    { amount: f.financed, term: f.term, thing, customer: operation.customerName },
    (value) => money.format(value),
  );
  const amount = (value: number | null) => (value != null ? money.format(value) : "—");
  const toCalculate = onEdit && (
    <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={onEdit}>
      Calculate in Financial data
    </button>
  );

  return (
    <section className="app-deal" aria-label="Financing summary">
      {sentence && <p className="app-deal-line">{sentence}</p>}

      <div className={`app-deal-pay ${stale ? "is-stale" : ""}`}>
        <div>
          <small className="text-body-secondary d-block">Monthly payment</small>
          <div className="app-financing-monthly app-tabular">
            {amount(f.monthly)}
            <span className="fs-6 fw-normal text-body-secondary"> / month</span>
          </div>
          {!f.calculated && <small className="text-body-secondary">Not calculated yet. {toCalculate}</small>}
          {f.calculated && stale && <small className="text-warning-emphasis">Values changed since calculating. {toCalculate}</small>}
        </div>
        <dl className="app-deal-stats">
          {f.tan != null && <Stat label="TAN" value={percent(f.tan)} />}
          {f.taeg != null && <Stat label="TAEG" value={percent(f.taeg)} />}
          {f.total != null && <Stat label="Total to pay" value={money.format(f.total)} />}
          {!breakdown && (
            <>
              <Stat label="Financed amount" value={amount(f.financed)} />
              {f.base != null && <Stat label={f.baseLabel} value={money.format(f.base)} />}
              {f.initialEntry != null && (
                <Stat
                  label="Initial entry"
                  value={`${money.format(f.initialEntry)}${f.initialEntryPercentage != null ? ` (${f.initialEntryPercentage} %)` : ""}`}
                />
              )}
            </>
          )}
        </dl>
      </div>

      {breakdown && <PaymentBar breakdown={breakdown} totalLabel={breakdown.costs > 0 ? "Total" : f.baseLabel} />}

      <small className="text-body-secondary">Indicative values, subject to approval.</small>
    </section>
  );
}

// --- Review cards (shared: ../review/ReviewCards) ----------------------------------

// Last step: is it ready, what's the deal, and a review of everything entered.
function SummaryStep({ stage, goTo, formProps, steps, errorsByStep, saveResultsShown, calculationStale }: StepProps) {
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
      <Readiness groups={groups} stage={stage} operation={op} goTo={goTo} resultsShown={saveResultsShown} />

      {hasFinancing(op) && (
        <DealOverview operation={op} stale={calculationStale} onEdit={has("financial") ? () => goTo("financial") : undefined} />
      )}

      <div className="row g-3">
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
