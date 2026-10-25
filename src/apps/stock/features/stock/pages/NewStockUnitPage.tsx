import StepTransition from "@platform/components/ui/StepTransition";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { CompleteSelection } from "@platform/features/workContext/hierarchy";
import { useWorkContext } from "@platform/features/workContext/hooks/useWorkContext";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import { useCreateStockUnitMutation, useGetAgreementsQuery, type StockUnit } from "../api/stockApi";
import AgreementPicker from "../components/AgreementPicker";
import StockUnitRecap from "../components/StockUnitRecap";
import SupplierInvoiceFields from "../components/SupplierInvoiceFields";
import InputField from "@platform/components/ui/InputField";
import StepsNav from "@platform/components/ui/StepsNav";
import EquipmentDetail from "@platform/features/equipment/components/EquipmentDetail";
import type { EquipmentField, EquipmentValue } from "@platform/features/equipment/equipmentModel";
import { amountLimitOf, emptyStockUnit, formatEuro, todayLocal, type StockUnitDraft } from "../model/stockUnit";
import { REQUIRED_EQUIPMENT, validateContractStep, validateInvoiceStep } from "../model/validation";

/** The shared equipment detail's rules here: every field visible and editable, a few required */
const equipmentRule = (field: EquipmentField) => ({
  visible: true,
  required: (REQUIRED_EQUIPMENT as readonly string[]).includes(field),
  readOnly: false,
});

const STEPS = [{ label: "Contract, vehicle and amount" }, { label: "Supplier and invoice" }];

// New stock unit, in two steps: 1) the agreement, the vehicle and the amount, 2) the supplier and
// its invoice. The working context gives the credit intermediary (its agreements and suppliers),
// the default supplier and the vendor registering it.
function NewStockUnitPage() {
  const { selection, isReady, isError } = useWorkContext();

  if (isError)
    return (
      <div className="alert alert-danger" role="alert">
        Your working context couldn't be loaded, so the agreements aren't known. Try again in a moment.
      </div>
    );

  if (!isReady || !selection?.organization || !selection.unit || !selection.member)
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );

  // A different credit intermediary has other agreements and suppliers: start over
  return <StockUnitWizard key={selection.organization.id} context={selection as CompleteSelection} />;
}

function StockUnitWizard({ context }: { context: CompleteSelection }) {
  const today = todayLocal();
  const [draft, setDraft] = useState<StockUnitDraft>(() => emptyStockUnit(context.unit));
  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState([false, false]);
  const [created, setCreated] = useState<{ unit: StockUnit; draft: StockUnitDraft } | null>(null);

  const agreements = useGetAgreementsQuery(context.organization.id);
  const agreement = agreements.data?.find((a) => a.id === draft.agreementId);
  const [createStockUnit, creation] = useCreateStockUnitMutation();

  const errorsByStep = [validateContractStep(draft, agreement, today), validateInvoiceStep(draft)];
  const errors = showErrors[step] ? errorsByStep[step] : {};

  const update = (changes: Partial<StockUnitDraft>) => setDraft((d) => ({ ...d, ...changes }));
  const updateEquipment = (changes: Partial<EquipmentValue>) => setDraft((d) => ({ ...d, equipment: { ...d.equipment, ...changes } }));

  const goTo = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = async () => {
    if (Object.keys(errorsByStep[step]).length > 0) {
      setShowErrors((s) => s.map((v, i) => (i === step ? true : v)));
      return;
    }
    if (step === 0) return goTo(1);
    if (!agreement) return;
    try {
      const unit = await createStockUnit({
        intermediaryId: context.organization.id,
        vendorId: context.member.id,
        draft,
        agreement,
      }).unwrap();
      setCreated({ unit, draft });
    } catch {
      // shown from creation.error
    }
  };

  const startOver = () => {
    setDraft(emptyStockUnit(context.unit));
    setShowErrors([false, false]);
    setCreated(null);
    creation.reset();
    goTo(0);
  };

  if (created)
    return (
      <div className="card shadow-sm border-0">
        <div className="card-body p-4 p-lg-5 text-center">
          <i className="bi bi-check-circle-fill text-success display-5" aria-hidden="true" />
          <h2 className="h4 mt-3 mb-1">Stock unit submitted</h2>
          <p className="text-body-secondary mb-4">
            Reference <span className="fw-semibold text-body">{created.unit.reference}</span> · sent to{" "}
            {created.unit.financialCompany} for approval.
          </p>
          <div className="text-start border rounded-3 p-3 mb-4 mx-auto app-wizard-done">
            <StockUnitRecap draft={created.draft} agreement={agreement} withInvoice />
          </div>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <button type="button" className="btn btn-primary" onClick={startOver}>
              <i className="bi bi-plus-lg me-2" aria-hidden="true" />
              New stock unit
            </button>
            <Link to="/stock/units" className="btn btn-outline-secondary">
              View stock units
            </Link>
          </div>
        </div>
      </div>
    );

  const limit = agreement ? amountLimitOf(agreement) : null;
  const submitError = creation.isError ? (getApiErrorMessage(creation.error) ?? "The stock unit couldn't be submitted.") : null;

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-body py-3">
        <StepsNav steps={STEPS} current={step} onSelect={goTo} />
      </div>

      <div className="card-body p-3 p-lg-4">
        <StepTransition index={step}>
          {step === 0 ? (
            <>
              <section className="mb-4" aria-labelledby="stock-agreement-title">
                <h2 className="h6 mb-3" id="stock-agreement-title">
                  Agreement
                  <span className="fw-normal text-body-secondary ms-2 small">{context.organization.name}</span>
                </h2>
                <AgreementPicker
                  agreements={agreements.data}
                  isLoading={agreements.isLoading}
                  isError={agreements.isError}
                  value={draft.agreementId}
                  onChange={(agreementId) => update({ agreementId })}
                  invalidMessage={errors.agreement}
                />
              </section>

              <section className="mb-4" aria-label="Equipment detail">
                {/* The same equipment detail as Montra Credit's operations, plus the VIN */}
                <EquipmentDetail
                  value={draft.equipment}
                  onChange={updateEquipment}
                  idPrefix="stock.equipment"
                  error={(field) => errors[`equipment.${field}`]}
                  rule={equipmentRule}
                  withVin
                />
              </section>

              <section aria-labelledby="stock-amount-title">
                <h2 className="h6 mb-3" id="stock-amount-title">
                  Amount
                </h2>
                <div className="row gx-3">
                  <div className="col-md-6 col-xl-4">
                    <InputField
                      id="stock-amount"
                      label="Amount to finance"
                      type="number"
                      required
                      min={0}
                      step={100}
                      inputGroupSpan="€"
                      value={draft.amount ?? ""}
                      onChange={(e) => update({ amount: e.target.value === "" ? null : Number(e.target.value) })}
                      invalidMessage={errors.amount}
                    />
                  </div>
                  <div className="col-md-6 col-xl-8 d-flex align-items-md-center">
                    <p className="form-text mt-0 mb-3 mt-md-3">
                      {limit === null
                        ? "Choose an agreement to see how much you can finance."
                        : `Up to ${formatEuro(limit)} for this vehicle on ${agreement!.number}.`}
                    </p>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <>
              <section className="mb-4 p-3 rounded-3 bg-body-tertiary" aria-labelledby="stock-recap-title">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h2 className="h6 mb-0" id="stock-recap-title">
                    Vehicle and amount
                  </h2>
                  <button type="button" className="btn btn-link btn-sm p-0" onClick={() => goTo(0)}>
                    <i className="bi bi-pencil me-1" aria-hidden="true" />
                    Change
                  </button>
                </div>
                <StockUnitRecap draft={draft} agreement={agreement} />
              </section>

              <section aria-labelledby="stock-invoice-title">
                <h2 className="h6 mb-3" id="stock-invoice-title">
                  Supplier and invoice
                </h2>
                <SupplierInvoiceFields
                  intermediaryId={context.organization.id}
                  supplier={draft.supplier}
                  invoiceNumber={draft.invoiceNumber}
                  onChange={update}
                  errors={errors}
                />
              </section>

              {submitError && (
                <div className="alert alert-danger mb-0" role="alert">
                  {submitError}
                </div>
              )}
            </>
          )}
        </StepTransition>
      </div>

      <div className="card-footer bg-body d-flex justify-content-between gap-2 py-3">
        {step > 0 ? (
          <button type="button" className="btn btn-outline-secondary" onClick={() => goTo(step - 1)} disabled={creation.isLoading}>
            <i className="bi bi-arrow-left me-2" aria-hidden="true" />
            Back
          </button>
        ) : (
          <span />
        )}
        <button type="button" className="btn btn-primary" onClick={next} disabled={creation.isLoading}>
          {step === 0 ? (
            <>
              Next
              <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
            </>
          ) : creation.isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Submitting…
            </>
          ) : (
            <>
              <i className="bi bi-send me-2" aria-hidden="true" />
              Submit stock unit
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default NewStockUnitPage;
