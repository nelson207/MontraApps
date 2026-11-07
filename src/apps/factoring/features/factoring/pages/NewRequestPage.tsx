import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useWizard, type WizardStep } from "@platform/components/wizard/useWizard";
import WizardBar, { WizardNextButton } from "@platform/components/wizard/WizardBar";
import WizardStepCard from "@platform/components/wizard/WizardStepCard";
import WizardStepper from "@platform/components/wizard/WizardStepper";
import { useSingleOptionDefault } from "@platform/hooks/useSingleOptionDefault";
import { useAgreements, useCession, useCounterparties } from "../api/factoringApi";
import AgreementPicker from "../components/AgreementPicker";
import CounterpartyField from "../components/CounterpartyField";
import type { CounterpartyList } from "../components/CounterpartySearchModal";
import DocumentsEditor from "../components/DocumentsEditor";
import { ApiMessages, SubmitFailure } from "../components/FactoringStates";
import { useFactoringText } from "../factoringText";
import { useCessionSubmission, type CessionSubmission, type CessionSummary } from "../hooks/useCessionSubmission";
import { useCounterpartyAdds } from "../hooks/useCounterpartyAdds";
import { useFactoringFormat } from "../model/format";
import {
  advanceOf,
  buildCessionRequest,
  counterpartiesOf,
  pendingCounterpartiesOf,
  emptyInvoice,
  findAgreement,
  isConfirming,
  kindClass,
  kindLabel,
  totalOf,
  type Agreement,
  type Counterparty,
  type InvoiceRow,
  type RequestDraft,
} from "../model/factoring";
import { factoringProblemMessage } from "../model/problems";
import { validateAgreementStep, validateDocumentsStep, validateSupplierStep, type FactoringErrors } from "../model/validation";

const DOCUMENTS_PATH = "/factoring/documents";

// New request (a cession): the agreement, under confirming its supplier, and the invoices (under
// factoring, each with its debtor). A request whose outcome isn't settled takes over the page, also
// after a reload, so it can't be sent a second time by accident.
function NewRequestPage() {
  const submission = useCessionSubmission();
  // Finishing starts a clean form; a definite failure keeps what was filled in
  const [formKey, setFormKey] = useState(0);
  const { phase, retrying } = submission;
  const takenOver = phase === "unanswered" || phase === "uncertain" || phase === "accepted" || (phase === "sending" && retrying);
  return (
    <>
      {takenOver && <CessionOutcome submission={submission} onFinished={() => setFormKey((key) => key + 1)} />}
      <div hidden={takenOver}>
        <RequestWizard key={formKey} submission={submission} />
      </div>
    </>
  );
}

type StepId = "agreement" | "supplier" | "invoices";

function RequestWizard({ submission }: { submission: CessionSubmission }) {
  const tx = useFactoringText();
  const agreements = useAgreements();
  const [chosen, setChosen] = useState<Pick<Agreement, "id" | "number"> | null>(null);
  const [draft, setDraft] = useState<RequestDraft>({ supplier: null, documents: [emptyInvoice("doc-0")] });
  const nextKey = useRef(1);

  const agreement = findAgreement(agreements.currentData, chosen);
  const confirming = !!agreement && isConfirming(agreement);
  const counterparties = useCounterparties(agreement?.id);
  const adds = useCounterpartyAdds();
  const options = agreement ? counterpartiesOf(counterparties.currentData, agreement) : [];
  const list: CounterpartyList = {
    contractId: agreement?.id ?? "",
    kind: confirming ? "Supplier" : "Debtor",
    items: options,
    pending: agreement ? pendingCounterpartiesOf(counterparties.currentData, agreement) : [],
    isLoading: !counterparties.currentData && !counterparties.isError,
    isError: counterparties.isError,
    error: counterparties.error,
    refetch: counterparties.refetch,
    adds,
  };

  // One option is decided for the user, and its step left out. An agreement's step stays when others
  // can't be chosen: that is where it says why.
  const choosable = (agreements.currentData ?? []).filter((a) => a.canSubmit === true);
  const onlyAgreement = agreements.currentData?.length === 1 && choosable.length === 1;
  const only = options.length === 1 && counterparties.currentData ? options[0] : null;
  const onlySupplier = confirming && !!only;

  const supplierErrors = validateSupplierStep(draft, agreement);
  const errorsByStep: Record<StepId, FactoringErrors> = {
    agreement: validateAgreementStep(agreement),
    supplier: supplierErrors,
    invoices: { ...(onlySupplier ? supplierErrors : {}), ...validateDocumentsStep(draft, agreement) },
  };
  const steps: WizardStep<StepId>[] = [
    ...(onlyAgreement ? [] : [{ id: "agreement" as const, label: tx("agreement.title", "Agreement"), icon: "bi-file-earmark-text" }]),
    ...(confirming && !onlySupplier ? [{ id: "supplier" as const, label: tx("invoices.supplier", "Supplier"), icon: "bi-shop" }] : []),
    { id: "invoices", label: tx("invoices.title", "Invoices"), icon: "bi-receipt" },
  ];
  const wizard = useWizard<StepId>({
    steps,
    invalid: steps.map((s) => s.id).filter((id) => Object.keys(errorsByStep[id]).length > 0),
    whenGone: (id) => (id === "supplier" ? "invoices" : steps[0].id),
  });
  const { step } = wizard;
  const errors = wizard.showsErrors(step.id) ? errorsByStep[step.id] : {};
  // An agreement that closed or left the list in a fresh read sends the user back to choose again
  if (step.id !== "agreement" && Object.keys(errorsByStep.agreement).length > 0) wizard.goTo("agreement");

  const sending = submission.phase === "sending";
  const { failure } = submission;
  const refetchAgreements = agreements.refetch;
  // After a failure the data may have moved (an agreement or a counterparty no longer available)
  useEffect(() => {
    if (failure) refetchAgreements();
  }, [failure, refetchAgreements]);

  const chooseAgreement = (next: Agreement) => {
    if (next.id === chosen?.id) return;
    setChosen({ id: next.id, number: next.number });
    // Debtors and suppliers belong to one agreement; the invoices' own data can stay
    setDraft((d) => ({ supplier: null, documents: d.documents.map((doc) => ({ ...doc, debtor: null })) }));
  };

  useSingleOptionDefault(chosen === null && choosable.length === 1 ? (choosable[0].id ?? null) : null, () => chooseAgreement(choosable[0]));

  // One supplier or one debtor: chosen by default
  const emptyParty = confirming ? !draft.supplier : !!agreement && draft.documents.some((doc) => !doc.debtor);
  useSingleOptionDefault(only?.interventionId && emptyParty ? only.interventionId : null, () => {
    if (!only) return;
    setDraft((d) => (confirming ? { ...d, supplier: only } : { ...d, documents: d.documents.map((doc) => (doc.debtor ? doc : { ...doc, debtor: only })) }));
  });

  const newInvoice = () => emptyInvoice(`doc-${nextKey.current++}`);
  const updateInvoice = (index: number, changes: Partial<InvoiceRow>) =>
    setDraft((d) => ({ ...d, documents: d.documents.map((doc, i) => (i === index ? { ...doc, ...changes } : doc)) }));

  const submit = () => {
    if (!wizard.validateAll() || !agreement?.id) return;
    const total = totalOf(draft.documents);
    const summary: CessionSummary = {
      kind: agreement.kind,
      financialInstitution: agreement.financialInstitution ?? null,
      contractNumber: agreement.number ?? null,
      currencyId: agreement.currencyId ?? null,
      supplierName: confirming ? (draft.supplier?.name ?? draft.supplier?.taxNumber ?? null) : null,
      total,
      advance: advanceOf(total, agreement.advancePercentage),
      invoices: draft.documents.map((doc) => ({
        key: doc.key,
        invoiceNumber: doc.invoiceNumber.trim(),
        debtorName: confirming ? null : (doc.debtor?.name ?? doc.debtor?.taxNumber ?? null),
        dueDate: doc.dueDate,
        amount: doc.amount,
      })),
    };
    submission.submit(agreement.id, buildCessionRequest(draft, agreement), summary);
  };

  const invoiceCount = draft.documents.length;
  const supplierField = (
    <CounterpartyField
      id="factoring-supplier"
      label={tx("invoices.supplier", "Supplier")}
      dialogTitle={tx("invoices.supplierDialog", "Select the supplier")}
      value={draft.supplier}
      list={list}
      onChange={(supplier: Counterparty) => {
        setDraft((d) => ({ ...d, supplier }));
        if (step.id === "supplier") wizard.advance();
      }}
      invalidMessage={errors.supplier}
    />
  );

  return (
    <div className="d-flex flex-column gap-3 app-has-wizard-bar">
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <WizardStepper {...wizard.stepper} onSelect={(i) => !sending && wizard.stepper.onSelect(i)} />
        </div>
      </div>

      <WizardStepCard index={wizard.index} step={step}>
        <fieldset disabled={sending}>
          {step.id === "agreement" && (
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
              disabledReason={(a) => (a.canSubmit === true ? null : tx("agreement.cantSubmit", "This agreement can't take new requests right now."))}
              hint={(a) =>
                isConfirming(a)
                  ? tx("agreement.hintConfirming", "One supplier's invoices: choose the supplier once.")
                  : tx("agreement.hintFactoring", "Your customers' invoices: choose the debtor of each one.")
              }
              invalidMessage={errors.agreement}
            />
          )}

          {step.id === "supplier" && (
            <>
              <p className="small text-body-secondary mb-3">{tx("invoices.supplierHint", "Confirming: every invoice of this request will be this supplier's.")}</p>
              <div className="row">
                <div className="col-12 col-md-8 col-xl-6">{supplierField}</div>
              </div>
            </>
          )}

          {step.id === "invoices" && agreement && (
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
              {/* Its step was left out: this is where a supplier can still be changed or added */}
              {onlySupplier && (
                <div className="row">
                  <div className="col-12 col-md-8 col-xl-6">{supplierField}</div>
                </div>
              )}
              <DocumentsEditor
                agreement={agreement}
                supplier={draft.supplier}
                debtors={list}
                documents={draft.documents}
                onChange={updateInvoice}
                onAdd={() => setDraft((d) => ({ ...d, documents: [...d.documents, newInvoice()] }))}
                onRemove={(index) => setDraft((d) => ({ ...d, documents: d.documents.filter((_, i) => i !== index) }))}
                errors={errors}
              />
            </>
          )}

          {failure && (
            <SubmitFailure
              failure={failure}
              refused={tx("submit.nothingSaved", "The request wasn't accepted. Nothing was saved.")}
              fallback={tx("submit.rejected", "The request wasn't accepted.")}
              notFound={tx("submit.notAvailable", "This agreement or one of its debtors or suppliers is no longer available. Nothing was saved.")}
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
                {tx("submit.sending", "Submitting…")}
              </>
            ) : (
              <>
                <i className="bi bi-send me-2" aria-hidden="true" />
                {invoiceCount === 1 ? tx("submit.one", "Submit invoice") : tx("submit.many", "Submit {{count}} invoices", { count: invoiceCount })}
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

/** What is known about a request after the form: its outcome, or that it isn't known yet */
function CessionOutcome({ submission, onFinished }: { submission: CessionSubmission; onFinished: () => void }) {
  const tx = useFactoringText();
  const { attempt, phase, lastError, retrying } = submission;
  const finish = () => {
    submission.finish();
    onFinished();
  };

  if (phase === "accepted" && attempt?.accepted) return <CessionSubmitted submission={submission} onNew={finish} />;

  const toDocuments = (
    <Link to={DOCUMENTS_PATH} className="btn btn-outline-secondary" onClick={finish}>
      {tx("submit.toDocuments", "Go to Documents")}
    </Link>
  );

  if (phase === "uncertain")
    return (
      <div className="card shadow-sm border-0">
        <div className="card-body p-4 p-lg-5">
          <h2 className="h5 mb-3">{tx("submit.uncertainTitle", "This request may have been saved")}</h2>
          <p className="text-body-secondary">{tx("submit.uncertainBody", "Check Documents before you send these invoices again: they may already be there.")}</p>
          <ApiMessages messages={attempt?.messages} />
          {toDocuments}
        </div>
      </div>
    );

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4 p-lg-5">
        <h2 className="h5 mb-3">{tx("submit.unansweredTitle", "There was no answer from the server")}</h2>
        <p className="text-body-secondary">
          {factoringProblemMessage(lastError, tx("submit.unansweredBody", "The request may or may not have arrived."))}{" "}
          {tx("submit.unansweredSafe", "Sending it again is safe: it can't create a second request.")}
        </p>
        <div className="d-flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={submission.retry} disabled={retrying || phase === "sending"}>
            {retrying && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            {tx("submit.sendAgain", "Send again")}
          </button>
          {toDocuments}
        </div>
      </div>
    </div>
  );
}

function CessionSubmitted({ submission, onNew }: { submission: CessionSubmission; onNew: () => void }) {
  const tx = useFactoringText();
  const { money, date } = useFactoringFormat();
  const { attempt } = submission;
  const accepted = attempt?.accepted;
  const missingNumber = accepted?.cessionNumber === null || accepted?.cessionNumber === undefined;
  // The answer may not carry the number yet
  const cession = useCession(accepted?.cessionId, !missingNumber);
  const number = accepted?.cessionNumber ?? cession.data?.number;
  if (!attempt) return null;
  const { summary } = attempt;

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4 p-lg-5 text-center">
        <i className="bi bi-check-circle-fill text-success display-5" aria-hidden="true" />
        <h2 className="h4 mt-3 mb-1">
          {number !== null && number !== undefined ? tx("submit.submittedNumber", "Request {{number}} submitted", { number }) : tx("submit.submitted", "Request submitted")}
        </h2>
        <p className="text-body-secondary mb-4">
          {tx("submit.waitsApproval", "It waits for back-office approval.")}
          {cession.isFetching ? ` ${tx("submit.readingNumber", "Reading its number…")}` : ""}
        </p>
        <div className="text-start mx-auto app-wizard-done">
          <ApiMessages messages={attempt.messages} />
        </div>
        <div className="text-start border rounded-3 p-3 mb-4 mx-auto app-wizard-done">
          <div className="d-flex flex-wrap gap-3 small mb-3">
            <span>
              <span className="text-body-secondary">{tx("invoices.total", "Total")}</span> <span className="fw-semibold">{money(summary.total, summary.currencyId)}</span>
            </span>
            {summary.advance !== null && (
              <span>
                <span className="text-body-secondary">{tx("advance.title", "Advance")}</span> <span className="fw-semibold">{money(summary.advance, summary.currencyId)}</span>
              </span>
            )}
            {summary.supplierName && (
              <span>
                <span className="text-body-secondary">{tx("invoices.supplier", "Supplier")}</span> <span className="fw-semibold">{summary.supplierName}</span>
              </span>
            )}
          </div>
          <ul className="list-unstyled small mb-0 d-flex flex-column gap-2">
            {summary.invoices.map((doc) => (
              <li key={doc.key} className="d-flex justify-content-between gap-3">
                <span className="min-w-0">
                  <span className="fw-semibold">{doc.invoiceNumber}</span>
                  {doc.debtorName && <span className="text-body-secondary"> · {doc.debtorName}</span>}
                  <span className="d-block text-body-secondary">{tx("submit.dueOn", "Due {{date}}", { date: date(doc.dueDate) })}</span>
                </span>
                <span className="fw-semibold text-nowrap">{money(doc.amount, summary.currencyId)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="d-flex flex-wrap justify-content-center gap-2">
          <button type="button" className="btn btn-primary" onClick={onNew}>
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            {tx("submit.new", "New request")}
          </button>
          <Link to={DOCUMENTS_PATH} className="btn btn-outline-secondary" onClick={onNew}>
            {tx("submit.viewDocuments", "View documents")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NewRequestPage;
