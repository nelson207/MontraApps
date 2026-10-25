import StepTransition from "@platform/components/ui/StepTransition";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import StepsNav from "@platform/components/ui/StepsNav";
import type { CompleteSelection } from "@platform/features/workContext/hierarchy";
import { useWorkContext } from "@platform/features/workContext/hooks/useWorkContext";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import { useCreateFactoringRequestMutation, useGetFactoringAgreementsQuery, type FactoringRequest } from "../api/factoringApi";
import AgreementPicker from "../components/AgreementPicker";
import DocumentsEditor from "../components/DocumentsEditor";
import EntityField from "../components/EntityField";
import {
  advanceOf,
  emptyDocument,
  emptyFactoringDraft,
  formatEuro,
  isConfirming,
  NATURE_LABELS,
  todayLocal,
  totalOf,
  type FactoringDocument,
  type FactoringDraft,
} from "../model/factoring";
import { validateAgreementStep, validateDocumentsStep } from "../model/validation";

const STEPS = [{ label: "Agreement" }, { label: "Invoices" }];

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// New factoring request, in two steps: 1) the agreement (and, under confirming, its supplier),
// 2) the invoices (under factoring, each with its debtor). The working context gives the credit
// intermediary (its agreements) and the vendor registering it.
function NewRequestPage() {
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

  // A different credit intermediary has other agreements: start over
  return <RequestWizard key={selection.organization.id} context={selection as CompleteSelection} />;
}

function RequestWizard({ context }: { context: CompleteSelection }) {
  const today = todayLocal();
  const [draft, setDraft] = useState<FactoringDraft>(emptyFactoringDraft);
  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState([false, false]);
  const [created, setCreated] = useState<{ request: FactoringRequest; draft: FactoringDraft } | null>(null);
  const nextKey = useRef(1);

  const agreements = useGetFactoringAgreementsQuery(context.organization.id);
  const agreement = agreements.data?.find((a) => a.id === draft.agreementId);
  const confirming = !!agreement && isConfirming(agreement);
  const [createRequest, creation] = useCreateFactoringRequestMutation();

  const errorsByStep = [validateAgreementStep(draft, agreement), validateDocumentsStep(draft, agreement, today)];
  const errors = showErrors[step] ? errorsByStep[step] : {};

  const newDocument = () => emptyDocument(`doc-${nextKey.current++}`);
  const updateDocument = (index: number, changes: Partial<FactoringDocument>) =>
    setDraft((d) => ({ ...d, documents: d.documents.map((doc, i) => (i === index ? { ...doc, ...changes } : doc)) }));

  const goTo = (next: number) => {
    // The invoices step starts with one invoice to fill in
    if (next === 1 && draft.documents.length === 0) setDraft((d) => ({ ...d, documents: [newDocument()] }));
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
      const request = await createRequest({
        intermediaryId: context.organization.id,
        vendorId: context.member.id,
        draft,
        agreement,
      }).unwrap();
      setCreated({ request, draft });
    } catch {
      // shown from creation.error
    }
  };

  const startOver = () => {
    setDraft(emptyFactoringDraft());
    setShowErrors([false, false]);
    setCreated(null);
    creation.reset();
    setStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (created && agreement) {
    const total = totalOf(created.draft.documents);
    return (
      <div className="card shadow-sm border-0">
        <div className="card-body p-4 p-lg-5 text-center">
          <i className="bi bi-check-circle-fill text-success display-5" aria-hidden="true" />
          <h2 className="h4 mt-3 mb-1">Request submitted</h2>
          <p className="text-body-secondary mb-4">
            Reference <span className="fw-semibold text-body">{created.request.reference}</span> ·{" "}
            {created.request.documents} {created.request.documents === 1 ? "invoice" : "invoices"} sent to{" "}
            {agreement.financialCompany} ({NATURE_LABELS[agreement.nature].toLowerCase()}).
          </p>
          <div className="text-start border rounded-3 p-3 mb-4 mx-auto app-wizard-done">
            <div className="d-flex flex-wrap gap-3 small mb-3">
              <span>
                <span className="text-body-secondary">Total</span> <span className="fw-semibold">{formatEuro(total)}</span>
              </span>
              <span>
                <span className="text-body-secondary">Advance</span>{" "}
                <span className="fw-semibold">{formatEuro(advanceOf(total, agreement))}</span>
              </span>
              {created.draft.supplier && confirming && (
                <span>
                  <span className="text-body-secondary">Supplier</span>{" "}
                  <span className="fw-semibold">{created.draft.supplier.name}</span>
                </span>
              )}
            </div>
            <ul className="list-unstyled small mb-0 d-flex flex-column gap-2">
              {created.draft.documents.map((doc) => (
                <li key={doc.key} className="d-flex justify-content-between gap-3">
                  <span className="min-w-0">
                    <span className="fw-semibold">{doc.invoiceNumber.trim()}</span>
                    {!confirming && doc.debtor && <span className="text-body-secondary"> · {doc.debtor.name}</span>}
                    <span className="d-block text-body-secondary">Due {formatDate(doc.dueDate)}</span>
                  </span>
                  <span className="fw-semibold text-nowrap">{formatEuro(doc.amount ?? 0)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <button type="button" className="btn btn-primary" onClick={startOver}>
              <i className="bi bi-plus-lg me-2" aria-hidden="true" />
              New request
            </button>
            <Link to="/factoring/documents" className="btn btn-outline-secondary">
              View documents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const submitError = creation.isError ? (getApiErrorMessage(creation.error) ?? "The request couldn't be submitted.") : null;

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-body py-3">
        <StepsNav steps={STEPS} current={step} onSelect={goTo} />
      </div>

      <div className="card-body p-3 p-lg-4">
        <StepTransition index={step}>
          {step === 0 ? (
            <>
              <section className="mb-4" aria-labelledby="factoring-agreement-title">
                <h2 className="h6 mb-3" id="factoring-agreement-title">
                  Agreement
                  <span className="fw-normal text-body-secondary ms-2 small">{context.organization.name}</span>
                </h2>
                <AgreementPicker
                  agreements={agreements.data}
                  isLoading={agreements.isLoading}
                  isError={agreements.isError}
                  value={draft.agreementId}
                  onChange={(agreementId) => setDraft((d) => ({ ...d, agreementId }))}
                  invalidMessage={errors.agreement}
                />
              </section>

              {confirming && (
                <section aria-labelledby="factoring-supplier-title">
                  <h2 className="h6 mb-1" id="factoring-supplier-title">
                    Supplier
                  </h2>
                  <p className="small text-body-secondary mb-3">Confirming: every invoice of this request will be this supplier's.</p>
                  <div className="row">
                    <div className="col-12 col-md-8 col-xl-6">
                      <EntityField
                        id="factoring-supplier"
                        label="Supplier"
                        dialogTitle="Select the supplier"
                        value={draft.supplier}
                        onChange={(supplier) => setDraft((d) => ({ ...d, supplier }))}
                        invalidMessage={errors.supplier}
                      />
                    </div>
                  </div>
                </section>
              )}
            </>
          ) : (
            agreement && (
              <>
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                  <h2 className="h6 mb-0">Invoices</h2>
                  <button type="button" className="btn btn-link btn-sm p-0" onClick={() => goTo(0)}>
                    <span className={`badge rounded-pill app-nature-badge is-nature-${agreement.nature} me-2`}>
                      {NATURE_LABELS[agreement.nature]}
                    </span>
                    {agreement.financialCompany} · {agreement.number}
                    <i className="bi bi-pencil ms-2" aria-hidden="true" />
                    <span className="visually-hidden">Change the agreement</span>
                  </button>
                </div>
                <DocumentsEditor
                  agreement={agreement}
                  supplier={draft.supplier}
                  documents={draft.documents}
                  onChange={updateDocument}
                  onAdd={() => setDraft((d) => ({ ...d, documents: [...d.documents, newDocument()] }))}
                  onRemove={(index) => setDraft((d) => ({ ...d, documents: d.documents.filter((_, i) => i !== index) }))}
                  errors={errors}
                  today={today}
                />
                {submitError && (
                  <div className="alert alert-danger mt-3 mb-0" role="alert">
                    {submitError}
                  </div>
                )}
              </>
            )
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
              Submit {draft.documents.length === 1 ? "invoice" : `${draft.documents.length} invoices`}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default NewRequestPage;
