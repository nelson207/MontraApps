import { skipToken } from "@reduxjs/toolkit/query";
import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { CalculationMessageDto, NewStockUnitDto, StockContractDto, StockUnitSaveResultDto } from "@platform/api/generated/MontraPOSApi";
import InputField from "@platform/components/ui/InputField";
import StepTransition from "@platform/components/ui/StepTransition";
import StepsNav from "@platform/components/ui/StepsNav";
import { useGetEquipmentTypesQuery } from "@platform/features/equipment/api/equipmentApi";
import EquipmentDetail from "@platform/features/equipment/components/EquipmentDetail";
import type { EquipmentField, EquipmentValue } from "@platform/features/equipment/equipmentModel";
import { newId } from "@platform/utils/newId";
import { useAddStockUnitMutation } from "../api/stockApi";
import AgreementPicker from "../components/AgreementPicker";
import { ApiMessages } from "../components/StockStates";
import StockUnitRecap from "../components/StockUnitRecap";
import SupplierInvoiceFields from "../components/SupplierInvoiceFields";
import { useStockFormat } from "../model/format";
import { isDefiniteRefusal, stockProblemMessage } from "../model/problems";
import { emptyStockUnit, toNewStockUnit, todayLocal, type StockUnitDraft } from "../model/stockUnit";
import { isRequiredEquipment, validateContractStep, validateInvoiceStep } from "../model/validation";
import { useStockText } from "../stockText";

// New stock unit, in two steps: 1) the agreement, the vehicle and the amount, 2) the supplier and
// its invoice. Coming from an agreement's card, that agreement is already chosen.
function NewStockUnitPage() {
  const tx = useStockText();
  const { money, date } = useStockFormat();
  const location = useLocation();
  const today = todayLocal();
  const initial = (location.state as { contract?: StockContractDto } | null)?.contract ?? null;

  const [draft, setDraft] = useState<StockUnitDraft>(() => emptyStockUnit(initial?.canAddStock ? initial : null));
  const [step, setStep] = useState(0);
  const [contractsPage, setContractsPage] = useState(1);
  const [showErrors, setShowErrors] = useState([false, false]);
  const [saved, setSaved] = useState<{ result: StockUnitSaveResultDto; draft: StockUnitDraft } | null>(null);
  const [refusal, setRefusal] = useState<CalculationMessageDto[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  /** Sent without a definite answer: it can only be repeated as it is, since it may already be saved */
  const [unanswered, setUnanswered] = useState<{ contractId: string; body: NewStockUnitDto } | null>(null);

  const correlationId = useRef<string | null>(null);
  const sendingNow = useRef(false);
  const [addStockUnit, adding] = useAddStockUnitMutation();

  const errorsByStep = [validateContractStep(draft, today), validateInvoiceStep(draft)];
  const errors = showErrors[step] ? errorsByStep[step] : {};
  const locked = adding.isLoading || unanswered !== null;
  const { contract } = draft;
  // The backend only lists what the application's settings list: with none, no vehicle can be entered
  const equipmentTypes = useGetEquipmentTypesQuery(contract?.companyId ? { companyId: contract.companyId } : skipToken);

  /** The shared equipment detail's rules here: every field visible and editable; what is required depends on the state */
  const equipmentRule = (field: EquipmentField) => ({
    visible: true,
    required: isRequiredEquipment(field, draft.equipment.equipmentStateId),
    readOnly: false,
  });

  const update = (changes: Partial<StockUnitDraft>) => setDraft((d) => ({ ...d, ...changes }));
  const updateEquipment = (changes: Partial<EquipmentValue>) => setDraft((d) => ({ ...d, equipment: { ...d.equipment, ...changes } }));

  const goTo = (next: number) => {
    setStep(next);
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  };

  const send = async (contractId: string, body: NewStockUnitDto) => {
    if (sendingNow.current) return;
    sendingNow.current = true;
    setRefusal(null);
    setProblem(null);
    try {
      const result = await addStockUnit({ contractId, body }).unwrap();
      setUnanswered(null);
      correlationId.current = null;
      if (result.isSaved === true) setSaved({ result, draft });
      else setRefusal(result.messages ?? []);
    } catch (error) {
      const message = stockProblemMessage(error, tx("add.saveError", "The stock unit couldn't be saved."));
      setProblem(message);
      if (isDefiniteRefusal(error)) {
        correlationId.current = null;
        setUnanswered(null);
      } else {
        setUnanswered({ contractId, body });
      }
    } finally {
      sendingNow.current = false;
    }
  };

  const next = () => {
    if (unanswered) return void send(unanswered.contractId, unanswered.body);
    if (Object.keys(errorsByStep[step]).length > 0) {
      setShowErrors((s) => s.map((v, i) => (i === step ? true : v)));
      return;
    }
    if (step === 0) return goTo(1);
    if (!contract?.id) return;
    correlationId.current ??= newId();
    void send(contract.id, toNewStockUnit(draft, correlationId.current));
  };

  const startOver = () => {
    setDraft(emptyStockUnit());
    setShowErrors([false, false]);
    setSaved(null);
    setRefusal(null);
    setProblem(null);
    goTo(0);
  };

  if (saved) {
    const { stock, messages } = saved.result;
    const savedCurrency = saved.draft.contract?.currencyId;
    return (
      <div className="card shadow-sm border-0">
        <div className="card-body p-4 p-lg-5 text-center">
          <i className="bi bi-hourglass-split text-warning display-5" aria-hidden="true" />
          <h2 className="h4 mt-3 mb-1">{tx("add.savedTitle", "Stock saved, but not active")}</h2>
          <p className="text-body-secondary mb-4">{tx("add.savedText", "The stock unit is registered, but it isn't active yet, so it can't be used or paid for now.")}</p>
          <div className="text-start mx-auto app-wizard-done">
            <ApiMessages messages={messages} />
          </div>
          <div className="text-start border rounded-3 p-3 mb-4 mx-auto app-wizard-done">
            <StockUnitRecap draft={saved.draft} withInvoice />
            {stock && (
              <dl className="row small mb-0 mt-2 border-top pt-2">
                {[
                  [tx("add.item", "Item"), stock.item != null ? String(stock.item) : null],
                  [tx("add.savedAmount", "Saved amount"), money(stock.amount, savedCurrency)],
                  [tx("units.begin", "Begin"), date(stock.beginDate)],
                  [tx("units.due", "Due"), date(stock.dueDate)],
                  [tx("units.end", "End"), date(stock.endDate)],
                ]
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div className="col-6 col-lg-4 mb-2" key={label}>
                      <dt className="fw-normal text-body-secondary">{label}</dt>
                      <dd className="fw-semibold mb-0">{value}</dd>
                    </div>
                  ))}
              </dl>
            )}
          </div>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <button type="button" className="btn btn-primary" onClick={startOver}>
              <i className="bi bi-plus-lg me-2" aria-hidden="true" />
              {tx("add.newUnit", "New stock unit")}
            </button>
            <Link to="/stock/units" className="btn btn-outline-secondary">
              {tx("add.viewUnits", "View stock units")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currency = contract?.currencyId;

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-body py-3">
        <StepsNav
          steps={[{ label: tx("add.stepVehicle", "Contract, vehicle and amount") }, { label: tx("add.stepInvoice", "Supplier and invoice") }]}
          current={step}
          onSelect={(target) => !locked && goTo(target)}
        />
      </div>

      <div className="card-body p-3 p-lg-4">
        <StepTransition index={step}>
          {step === 0 ? (
            <>
              <section className="mb-4" aria-labelledby="stock-agreement-title">
                <h2 className="h6 mb-3" id="stock-agreement-title">
                  {tx("agreements.agreement", "Agreement")}
                </h2>
                <AgreementPicker
                  value={contract}
                  onChange={(chosen) => update({ contract: chosen, supplierInterventionId: null })}
                  page={contractsPage}
                  onPageChange={setContractsPage}
                  invalidMessage={errors.contract}
                />
              </section>

              <section className="mb-4" aria-label={tx("add.equipment", "Equipment detail")}>
                {equipmentTypes.currentData?.length === 0 && (
                  <div className="alert alert-warning" role="alert">
                    {tx("add.noEquipmentTypes", "No equipment types are set up for this agreement's company, so stock can't be added yet. Ask an administrator to set them up.")}
                  </div>
                )}
                {/* The same equipment detail as Montra Credit's operations, plus the VIN */}
                <EquipmentDetail
                  value={draft.equipment}
                  onChange={updateEquipment}
                  idPrefix="stock.equipment"
                  companyId={contract?.companyId}
                  noCompanyHint={tx("add.chooseAgreementFirst", "Select an agreement first")}
                  error={(field) => errors[`equipment.${field}`]}
                  rule={equipmentRule}
                  withVin
                  allowedTypeIds={contract?.equipmentTypeIds}
                  allowedStateIds={contract?.equipmentStateIds}
                />
              </section>

              <section aria-labelledby="stock-amount-title">
                <h2 className="h6 mb-3" id="stock-amount-title">
                  {tx("recap.amount", "Amount")}
                </h2>
                <div className="row gx-3">
                  <div className="col-md-6 col-xl-4">
                    <InputField
                      id="stock-amount"
                      label={tx("add.amount", "Amount to finance")}
                      type="number"
                      required
                      min={0}
                      step={0.01}
                      inputGroupSpan={currency ?? undefined}
                      value={draft.amount ?? ""}
                      onChange={(e) => update({ amount: e.target.value === "" ? null : Number(e.target.value) })}
                      invalidMessage={errors.amount}
                    />
                  </div>
                  <div className="col-md-6 col-xl-8 d-flex align-items-md-center">
                    <p className="form-text mt-0 mb-3 mt-md-3">
                      {contract
                        ? tx("add.limitHint", "Up to {{max}} for this vehicle on agreement {{number}}.", {
                            max: money(contract.maxPerVehicle, currency) ?? "",
                            number: contract.number ?? "",
                          })
                        : tx("add.chooseHint", "Choose an agreement to see how much you can finance.")}
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
                    {tx("add.recapTitle", "Vehicle and amount")}
                  </h2>
                  {!locked && (
                    <button type="button" className="btn btn-link btn-sm p-0" onClick={() => goTo(0)}>
                      <i className="bi bi-pencil me-1" aria-hidden="true" />
                      {tx("add.change", "Change")}
                    </button>
                  )}
                </div>
                <StockUnitRecap draft={draft} />
              </section>

              <section aria-labelledby="stock-invoice-title">
                <h2 className="h6 mb-3" id="stock-invoice-title">
                  {tx("add.stepInvoice", "Supplier and invoice")}
                </h2>
                <SupplierInvoiceFields draft={draft} onChange={update} errors={errors} disabled={locked} />
              </section>

              {refusal && (
                <div role="status">
                  <p className="fw-semibold mb-2">{tx("add.refused", "The stock unit wasn't accepted.")}</p>
                  <ApiMessages messages={refusal} />
                </div>
              )}
              {problem && (
                <div className="alert alert-danger" role="alert">
                  {problem}
                </div>
              )}
              {unanswered && (
                <div className="alert alert-warning mb-0" role="alert">
                  {tx("add.unanswered", "There was no answer, so the stock unit may already be saved. Try again: the same request is sent and it won't be saved twice.")}
                </div>
              )}
            </>
          )}
        </StepTransition>
      </div>

      <div className="card-footer bg-body d-flex justify-content-between gap-2 py-3">
        {step > 0 ? (
          <button type="button" className="btn btn-ghost" onClick={() => goTo(step - 1)} disabled={locked}>
            <i className="bi bi-arrow-left me-2" aria-hidden="true" />
            {tx("common.back", "Back")}
          </button>
        ) : (
          <span />
        )}
        <button type="button" className="btn btn-primary" onClick={next} disabled={adding.isLoading}>
          {step === 0 ? (
            <>
              {tx("common.next", "Next")}
              <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
            </>
          ) : adding.isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              {tx("add.saving", "Saving…")}
            </>
          ) : unanswered ? (
            tx("common.tryAgain", "Try again")
          ) : (
            <>
              <i className="bi bi-send me-2" aria-hidden="true" />
              {tx("add.submit", "Save stock unit")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default NewStockUnitPage;
