import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import InputField from "@platform/components/ui/InputField";
import { useWizard, type WizardStep } from "@platform/components/wizard/useWizard";
import WizardBar, { WizardNextButton } from "@platform/components/wizard/WizardBar";
import WizardStepCard from "@platform/components/wizard/WizardStepCard";
import WizardStepper from "@platform/components/wizard/WizardStepper";
import { useSingleOptionDefault } from "@platform/hooks/useSingleOptionDefault";
import { useAgreements, useApprovedInvoices } from "../api/factoringApi";
import AdvanceCost from "../components/AdvanceCost";
import AdvanceOutcome from "../components/AdvanceOutcome";
import AgreementPicker from "../components/AgreementPicker";
import { LoadProblem, Loading, SubmitFailure } from "../components/FactoringStates";
import { useFactoringText } from "../factoringText";
import { useAdvanceSubmission, type AdvanceSubmission } from "../hooks/useAdvanceSubmission";
import { useFactoringFormat } from "../model/format";
import { findAgreement, isConfirming, kindClass, kindLabel, sumOfAmounts, type Agreement } from "../model/factoring";
import { validateAdvance } from "../model/validation";

const ADVANCES_PATH = "/factoring/advances";

// An advance on an agreement, in steps like a new request's: the agreement, then under factoring an amount and a value date (Accipiens picks the invoices by the contract's rule), under
// confirming the approved invoices too, with a summary. One whose outcome isn't settled takes
// over the page, also after a reload.
function AdvancePage() {
  const submission = useAdvanceSubmission();
  // Finishing starts a clean form; a definite failure keeps what was filled in
  const [formKey, setFormKey] = useState(0);
  const { phase, retrying } = submission;
  const takenOver = phase === "unanswered" || phase === "uncertain" || phase === "accepted" || (phase === "sending" && retrying);
  return (
    <>
      {takenOver && <AdvanceOutcome submission={submission} onFinished={() => setFormKey((key) => key + 1)} />}
      <div hidden={takenOver}>
        <AdvanceWizard key={formKey} submission={submission} />
      </div>
    </>
  );
}

type StepId = "agreement" | "advance";

function AdvanceWizard({ submission }: { submission: AdvanceSubmission }) {
  const tx = useFactoringText();
  const { money, date } = useFactoringFormat();
  const agreements = useAgreements();
  const [chosen, setChosen] = useState<Pick<Agreement, "id" | "number"> | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [valueDate, setValueDate] = useState("");
  /** undefined: not edited, so (confirming) the sum of the selected invoices */
  const [editedAmount, setEditedAmount] = useState<number | null | undefined>(undefined);

  const agreement = findAgreement(agreements.currentData, chosen);
  const confirming = !!agreement && isConfirming(agreement);
  const invoices = useApprovedInvoices(confirming ? agreement : undefined);
  const invoiceRows = invoices.currentData ?? [];
  const chosenInvoices = invoiceRows.filter((invoice) => invoice.id && selected.includes(invoice.id));
  const amount = editedAmount === undefined ? (confirming ? sumOfAmounts(chosenInvoices) : null) : editedAmount;
  const currencyId = agreement?.currencyId;

  // One agreement is decided for the user, and its step left out. The step stays when others can't
  // be chosen: that is where it says why.
  const choosable = (agreements.currentData ?? []).filter((a) => a.canAdvance === true);
  const onlyAgreement = agreements.currentData?.length === 1 && choosable.length === 1;

  const agreementInvalid = agreement?.canAdvance !== true;
  const advanceErrors = agreement ? validateAdvance({ agreement, amount, valueDate, invoiceCount: chosenInvoices.length }) : {};
  const steps: WizardStep<StepId>[] = [
    ...(onlyAgreement ? [] : [{ id: "agreement" as const, label: tx("agreement.title", "Agreement"), icon: "bi-file-earmark-text" }]),
    { id: "advance", label: tx("advance.title", "Advance"), icon: "bi-cash-coin" },
  ];
  const wizard = useWizard<StepId>({
    steps,
    invalid: [...(agreementInvalid && !onlyAgreement ? (["agreement"] as const) : []), ...(Object.keys(advanceErrors).length > 0 ? (["advance"] as const) : [])],
  });
  const { step } = wizard;
  const shown = wizard.showsErrors(step.id);
  const errors = shown ? advanceErrors : {};
  // An agreement that closed or left the list in a fresh read sends the user back to choose again
  if (step.id !== "agreement" && agreementInvalid) wizard.goTo("agreement");

  const sending = submission.phase === "sending";
  const { failure } = submission;
  const refetchAgreements = agreements.refetch;
  // After a failure the data may have moved: most of all an advance now in progress
  useEffect(() => {
    if (failure) refetchAgreements();
  }, [failure, refetchAgreements]);

  const chooseAgreement = (next: Agreement) => {
    if (next.id === chosen?.id) return;
    setChosen({ id: next.id, number: next.number });
    setSelected([]);
    setEditedAmount(undefined);
  };

  useSingleOptionDefault(chosen === null && choosable.length === 1 ? (choosable[0].id ?? null) : null, () => chooseAgreement(choosable[0]));

  const toggle = (id: string) => {
    setSelected((all) => (all.includes(id) ? all.filter((other) => other !== id) : [...all, id]));
    // Back to the new sum: an old amount must not silently apply to another selection
    setEditedAmount(undefined);
  };

  const submit = () => {
    if (!wizard.validateAll() || !agreement?.id || amount === null) return;
    const documentIds = chosenInvoices.map((invoice) => invoice.id as string);
    submission.submit(agreement.id, confirming ? { amount, valueDate, documentIds } : { amount, valueDate }, {
      kind: agreement.kind,
      financialInstitution: agreement.financialInstitution ?? null,
      contractNumber: agreement.number ?? null,
      currencyId: currencyId ?? null,
      amount,
      valueDate,
      invoiceNumbers: chosenInvoices.map((invoice) => invoice.invoiceNumber ?? "—"),
    });
  };

  return (
    <div className="d-flex flex-column gap-3 app-has-wizard-bar">
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <WizardStepper {...wizard.stepper} onSelect={(i) => !sending && wizard.stepper.onSelect(i)} />
        </div>
      </div>

      <WizardStepCard index={wizard.index} step={step}>
        <fieldset disabled={sending}>
          {step.id === "agreement" || !agreement ? (
            <>
              <p className="text-end mb-3">
                <Link to={ADVANCES_PATH} className="small">
                  {tx("advance.viewList", "View advances")}
                </Link>
              </p>
              <AgreementPicker
                agreements={agreements.currentData}
                isLoading={!agreements.currentData && !agreements.isError}
                error={agreements.isError ? agreements.error : null}
                onRetry={agreements.refetch}
                value={chosen?.id ?? null}
                onChange={(next) => {
                  chooseAgreement(next);
                  wizard.advance();
                }}
                disabledReason={(a) =>
                  a.canAdvance === true
                    ? null
                    : a.hasAdvanceInProgress === false
                      ? tx("agreement.cantAdvance", "This agreement can't take an advance right now.")
                      : tx("agreement.advanceInProgress", "An advance is already in progress on this agreement.")
                }
                hint={(a) =>
                  isConfirming(a)
                    ? tx("agreement.advanceHintConfirming", "Choose which approved invoices to advance.")
                    : tx("agreement.advanceHintFactoring", "Enter an amount: the invoices are picked by the agreement's rule.")
                }
                invalidMessage={shown && agreementInvalid ? tx("validation.agreement", "Select an agreement.") : undefined}
              />
            </>
          ) : (
            <>
              <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 mb-3">
                <span className={`badge rounded-pill ${kindClass(agreement.kind)}`}>{kindLabel(agreement.kind, tx)}</span>
                {onlyAgreement ? (
                  <span className="small">{[agreement.financialInstitution, agreement.number].filter((part) => part !== null && part !== undefined).join(" · ")}</span>
                ) : (
                  <button type="button" className="btn btn-link btn-sm p-0" onClick={() => wizard.goTo("agreement")}>
                    {[agreement.financialInstitution, agreement.number].filter((part) => part !== null && part !== undefined).join(" · ")}
                    <i className="bi bi-pencil ms-2" aria-hidden="true" />
                    <span className="visually-hidden">{tx("invoices.changeAgreement", "Change the agreement")}</span>
                  </button>
                )}
              </div>

              {confirming && (
                <section className="mb-4">
                  <h3 className="h6 mb-3">{tx("advance.invoices", "Approved invoices")}</h3>
                  {invoices.isError ? (
                    <LoadProblem error={invoices.error} fallback={tx("advance.invoicesError", "The approved invoices couldn't be loaded. Try again in a moment.")} onRetry={invoices.refetch} />
                  ) : !invoices.currentData ? (
                    <Loading hint={tx("documents.slow", "Reading your agreements' invoices. This can take a moment.")} />
                  ) : invoiceRows.length === 0 ? (
                    <p className="text-body-secondary mb-0">{tx("advance.noInvoices", "This agreement has no approved invoices to advance yet.")}</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm align-middle mb-0">
                        <thead>
                          <tr className="small text-body-secondary">
                            <th scope="col" />
                            <th scope="col">{tx("documents.invoice", "Invoice")}</th>
                            <th scope="col">{tx("invoices.supplier", "Supplier")}</th>
                            <th scope="col">{tx("documents.due", "Due")}</th>
                            <th scope="col" className="text-end">{tx("invoices.amount", "Amount")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceRows.map((invoice) => (
                            <tr key={invoice.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  aria-label={tx("advance.selectInvoice", "Select invoice {{number}}", { number: invoice.invoiceNumber ?? "—" })}
                                  checked={!!invoice.id && selected.includes(invoice.id)}
                                  onChange={() => invoice.id && toggle(invoice.id)}
                                />
                              </td>
                              <td className="text-nowrap">{invoice.invoiceNumber ?? "—"}</td>
                              <td>{invoice.counterparty ?? "—"}</td>
                              <td className="text-nowrap">{date(invoice.dueDate) || "—"}</td>
                              <td className="text-end text-nowrap">{money(invoice.amount, invoice.currencyId) ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {errors.invoices && <div className="invalid-feedback d-block">{errors.invoices}</div>}
                </section>
              )}

              <section className="row gx-3">
                <div className="col-md-6">
                  <InputField
                    id="advance-amount"
                    label={tx("invoices.amount", "Amount")}
                    type="number"
                    required
                    min={0}
                    step={0.01}
                    inputGroupSpan={currencyId ?? undefined}
                    value={amount ?? ""}
                    invalidMessage={errors.amount}
                    onChange={(e) => setEditedAmount(e.target.value === "" ? null : Number(e.target.value))}
                  />
                </div>
                <div className="col-md-6">
                  {/* Not restricted here: Accipiens decides which dates it accepts */}
                  <InputField
                    id="advance-value-date"
                    label={tx("advance.valueDate", "Value date")}
                    type="date"
                    required
                    value={valueDate}
                    invalidMessage={errors.valueDate}
                    onChange={(e) => setValueDate(e.target.value)}
                  />
                </div>
              </section>

              <dl className="app-documents-totals">
                <div>
                  <dt>{tx("invoices.available", "Available")}</dt>
                  {agreement.availableAmount === null || agreement.availableAmount === undefined ? (
                    <dd className="text-body-secondary">{tx("common.unavailable", "Unavailable")}</dd>
                  ) : (
                    <dd>{money(agreement.availableAmount, currencyId)}</dd>
                  )}
                </div>
              </dl>

              {confirming && agreement.id && invoiceRows.length > 0 && (
                <AdvanceCost
                  contractId={agreement.id}
                  documentIds={chosenInvoices.map((invoice) => invoice.id as string)}
                  amount={amount}
                  valueDate={valueDate}
                  currencyId={currencyId}
                  agreementAvailable={agreement.availableAmount}
                />
              )}
            </>
          )}

          {failure && (
            <SubmitFailure
              failure={failure}
              refused={tx("advance.notStarted", "The advance didn't start.")}
              fallback={tx("advance.rejected", "The advance wasn't accepted.")}
              notFound={tx("advance.notAvailable", "This agreement is no longer available. The advance didn't start.")}
            />
          )}
        </fieldset>
      </WizardStepCard>

      <WizardBar onBack={wizard.isFirst ? undefined : wizard.back} backDisabled={sending}>
        {wizard.isLast ? (
          <button type="button" className="btn btn-primary" onClick={submit} disabled={sending}>
            {sending ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                {tx("advance.requesting", "Requesting…")}
              </>
            ) : (
              <>
                <i className="bi bi-cash-coin me-2" aria-hidden="true" />
                {tx("advance.request", "Request advance")}
              </>
            )}
          </button>
        ) : (
          <WizardNextButton onClick={() => wizard.next()} disabled={sending} />
        )}
      </WizardBar>
    </div>
  );
}

export default AdvancePage;
