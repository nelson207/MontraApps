import { skipToken } from "@reduxjs/toolkit/query";
import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { CalculationMessageDto, NewStockUnitDto, StockContractDto, StockUnitSaveResultDto } from "@platform/api/generated/MontraPOSApi";
import InputField from "@platform/components/ui/InputField";
import { useWizard, type WizardStep } from "@platform/components/wizard/useWizard";
import WizardBar, { WizardNextButton } from "@platform/components/wizard/WizardBar";
import WizardStepCard from "@platform/components/wizard/WizardStepCard";
import WizardStepper from "@platform/components/wizard/WizardStepper";
import { useGetEquipmentTypesQuery } from "@platform/features/equipment/api/equipmentApi";
import EquipmentDetail from "@platform/features/equipment/components/EquipmentDetail";
import type { EquipmentField, EquipmentValue } from "@platform/features/equipment/equipmentModel";
import { useSingleOptionDefault } from "@platform/hooks/useSingleOptionDefault";
import { newId } from "@platform/utils/newId";
import { AGREEMENT_CARDS_PAGE_SIZE, useAddStockUnitMutation, useStockContracts } from "../api/stockApi";
import AgreementPicker from "../components/AgreementPicker";
import { ApiMessages } from "../components/StockStates";
import StockUnitRecap from "../components/StockUnitRecap";
import SupplierInvoiceFields from "../components/SupplierInvoiceFields";
import { useStockFormat } from "../model/format";
import { isDefiniteRefusal, stockProblemMessage } from "../model/problems";
import { emptyStockUnit, toNewStockUnit, todayLocal, type StockUnitDraft } from "../model/stockUnit";
import { isRequiredEquipment, validateContractStep, validateInvoiceStep, type StockErrors } from "../model/validation";
import { useStockText } from "../stockText";

type StepId = "agreement" | "vehicle" | "invoice";

// New stock unit: the agreement, the vehicle and the amount, and the supplier and its invoice. Coming
// from an agreement's card, that agreement is already chosen. Starting over starts clean.
function NewStockUnitPage() {
  const location = useLocation();
  const [round, setRound] = useState(0);
  const fromCard = round === 0 ? ((location.state as { contract?: StockContractDto } | null)?.contract ?? null) : null;
  return <StockUnitWizard key={round} fromCard={fromCard} onStartOver={() => setRound((r) => r + 1)} />;
}

function StockUnitWizard({ fromCard, onStartOver }: { fromCard: StockContractDto | null; onStartOver: () => void }) {
  const tx = useStockText();
  const { money, date } = useStockFormat();
  const today = todayLocal();
  const initial = fromCard?.canAddStock ? fromCard : null;

  const [draft, setDraft] = useState<StockUnitDraft>(() => emptyStockUnit(initial));
  const [contractsPage, setContractsPage] = useState(1);
  const update = (changes: Partial<StockUnitDraft>) => setDraft((d) => ({ ...d, ...changes }));
  const [saved, setSaved] = useState<{ result: StockUnitSaveResultDto; draft: StockUnitDraft } | null>(null);
  const [refusal, setRefusal] = useState<CalculationMessageDto[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  /** Sent without a definite answer: it can only be repeated as it is, since it may already be saved */
  const [unanswered, setUnanswered] = useState<{ contractId: string; body: NewStockUnitDto } | null>(null);

  const correlationId = useRef<string | null>(null);
  const sendingNow = useRef(false);
  const [addStockUnit, adding] = useAddStockUnitMutation();

  // One agreement is decided for the user, and its step left out. The step stays when others can't
  // take stock: that is where it says so.
  const firstPage = useStockContracts(1, AGREEMENT_CARDS_PAGE_SIZE).currentData;
  const listed = firstPage?.items ?? [];
  const isWholeList = !!firstPage && (firstPage.totalCount ?? 0) === listed.length;
  const choosable = isWholeList ? listed.filter((c) => c.canAddStock) : [];
  const onlyAgreement = listed.length === 1 && choosable.length === 1;

  const vehicleAndContract = Object.entries(validateContractStep(draft, today));
  const errorsByStep: Record<StepId, StockErrors> = {
    agreement: Object.fromEntries(vehicleAndContract.filter(([field]) => field === "contract")),
    vehicle: Object.fromEntries(vehicleAndContract.filter(([field]) => field !== "contract")),
    invoice: validateInvoiceStep(draft),
  };
  const steps: WizardStep<StepId>[] = [
    ...(onlyAgreement ? [] : [{ id: "agreement" as const, label: tx("agreements.agreement", "Agreement"), icon: "bi-file-earmark-text" }]),
    { id: "vehicle", label: tx("add.stepVehicle", "Vehicle and amount"), icon: "bi-car-front" },
    { id: "invoice", label: tx("add.stepInvoice", "Supplier and invoice"), icon: "bi-receipt" },
  ];
  const wizard = useWizard<StepId>({
    steps,
    invalid: steps.map((s) => s.id).filter((id) => Object.keys(errorsByStep[id]).length > 0),
    first: initial ? "vehicle" : undefined,
    whenGone: () => "vehicle",
  });
  const { step } = wizard;
  const errors = wizard.showsErrors(step.id) ? errorsByStep[step.id] : {};
  const locked = adding.isLoading || unanswered !== null;
  const { contract } = draft;
  useSingleOptionDefault(!contract && choosable.length === 1 ? (choosable[0].id ?? null) : null, () => update({ contract: choosable[0], supplierInterventionId: null }));
  // The backend only lists what the application's settings list: with none, no vehicle can be entered
  const equipmentTypes = useGetEquipmentTypesQuery(contract?.companyId ? { companyId: contract.companyId } : skipToken);

  /** The shared equipment detail's rules here: every field visible and editable; what is required depends on the state */
  const equipmentRule = (field: EquipmentField) => ({
    visible: true,
    required: isRequiredEquipment(field, draft.equipment.equipmentStateId),
    readOnly: false,
  });

  const updateEquipment = (changes: Partial<EquipmentValue>) => setDraft((d) => ({ ...d, equipment: { ...d.equipment, ...changes } }));

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

  const submit = () => {
    if (unanswered) return void send(unanswered.contractId, unanswered.body);
    if (!wizard.validateAll() || !contract?.id) return;
    correlationId.current ??= newId();
    void send(contract.id, toNewStockUnit(draft, correlationId.current));
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
            <button type="button" className="btn btn-primary" onClick={onStartOver}>
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
    <div className="d-flex flex-column gap-3 app-has-wizard-bar">
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <WizardStepper {...wizard.stepper} onSelect={(i) => !locked && wizard.stepper.onSelect(i)} />
        </div>
      </div>

      <WizardStepCard index={wizard.index} step={step}>
          {step.id === "agreement" && (
            <AgreementPicker
              value={contract}
              onChange={(chosen) => {
                if (chosen.id !== contract?.id) update({ contract: chosen, supplierInterventionId: null });
                wizard.advance();
              }}
              page={contractsPage}
              onPageChange={setContractsPage}
              invalidMessage={errors.contract}
            />
          )}

          {step.id === "vehicle" && (
            <>
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
          )}

          {step.id === "invoice" && (
            <>
              <section className="mb-4 p-3 rounded-3 bg-body-tertiary" aria-labelledby="stock-recap-title">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h2 className="h6 mb-0" id="stock-recap-title">
                    {tx("add.recapTitle", "Vehicle and amount")}
                  </h2>
                  {!locked && (
                    <button type="button" className="btn btn-link btn-sm p-0" onClick={() => wizard.goTo("vehicle")}>
                      <i className="bi bi-pencil me-1" aria-hidden="true" />
                      {tx("add.change", "Change")}
                    </button>
                  )}
                </div>
                <StockUnitRecap draft={draft} />
              </section>

              <section aria-label={tx("add.stepInvoice", "Supplier and invoice")}>
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
      </WizardStepCard>

      <WizardBar onBack={wizard.isFirst ? undefined : wizard.back} backDisabled={locked}>
        {wizard.isLast ? (
          <button type="button" className="btn btn-primary" onClick={submit} disabled={adding.isLoading}>
            {adding.isLoading ? (
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
        ) : (
          <WizardNextButton onClick={() => wizard.next()} disabled={adding.isLoading} />
        )}
      </WizardBar>
    </div>
  );
}

export default NewStockUnitPage;
