import StepTransition from "@platform/components/ui/StepTransition";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  selectCredoper,
  selectCredoperIsDirty,
  selectCredoperRevision,
  useAppDispatch,
  useAppSelector,
} from "@credit/store";
import PageLoader from "@platform/features/layout/components/PageLoader";
import {
  usePostApiCreditOperationsQuotationToProposalMutation,
  usePostApiCreditOperationsSaveCredOperMutation,
} from "@platform/api/legacy/legacyApi";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import DiscardPrompt from "../components/wizard/DiscardPrompt";
import OperationHeader from "../components/wizard/OperationHeader";
import Stepper from "../components/wizard/Stepper";
import SummaryPanel from "../components/wizard/SummaryPanel";
import WizardActions from "../components/wizard/WizardActions";
import { DEFAULT_TERM_RESTRICTIONS } from "../constants";
import { useBusinessChoices } from "../business/useBusinessChoices";
import { useCompanyChoices } from "../business/useCompanyChoices";
import { loadExisting, markSaved, presetBusiness, presetCompany } from "../credoperSlice";
import useFinancialProductSync from "../hooks/useFinancialProductSync";
import { useCredOperTemplate } from "../hooks/useCredOperTemplate";
import useQuotationBootstrap from "../hooks/useQuotationBootstrap";
import { useQuotationOptions } from "../hooks/useQuotationOptions";
import {
  STEP_OF_STAGE,
  stageOf,
  type CredOperDraft,
  type Stage,
} from "../model/credOperDraft";
import type { SessionNavState } from "../session/resolveEntry";
import {
  STAGE_ROUTES,
  useCredOperSession,
} from "../session/useCredOperSession";
import { buildTermTicks } from "../utils/termTicks";
import type { FieldErrors } from "../validation/fieldRules";
import { todayLocal } from "../validation/localDate";
import { STEP_COMPONENTS } from "../wizard/stepComponents";
import { stepsFor, validateStages, type StepId } from "../wizard/steps";

const termTicks = buildTermTicks(DEFAULT_TERM_RESTRICTIONS);

/** Focus the first invalid field once React has rendered the errors. */
const focusFirstInvalid = () =>
  requestAnimationFrame(() =>
    document.querySelector<HTMLElement>("main [aria-invalid=true]")?.focus(),
  );

function Wizard({
  stage,
  operation,
}: {
  stage: Stage;
  operation: CredOperDraft;
}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isDirty = useAppSelector(selectCredoperIsDirty);
  const revision = useAppSelector(selectCredoperRevision);
  // The business decides the steps; with a single business to offer (a new proposal: only those
  // that can start in proposal, Settings → Application) it's chosen for the
  // user and the Business step is skipped
  // Subscribed here for the whole operation: the Business step and the financial product field
  // read the same answer, never reloaded when going back
  const { data: businesses, isLoading: loadingBusinesses } = useBusinessChoices(stage, operation);
  const onlyBusiness = businesses?.length === 1 ? businesses[0] : null;
  useEffect(() => {
    if (onlyBusiness && !operation.aplBusinessId)
      dispatch(presetBusiness(onlyBusiness.id));
  }, [onlyBusiness, operation.aplBusinessId, dispatch]);
  // The companies the business can be done with: one = decided for the user, several = the
  // Company step (also while they're loading or failed, so it can show that)
  const companyChoices = useCompanyChoices(stage, operation);
  const onlyCompany = companyChoices.data?.length === 1 ? companyChoices.data[0] : null;
  useEffect(() => {
    if (onlyCompany && operation.aplCompanyId !== onlyCompany.id)
      dispatch(presetCompany(onlyCompany.id));
  }, [onlyCompany, operation.aplCompanyId, dispatch]);
  const steps = stepsFor(stage, operation, {
    chooseBusiness: !onlyBusiness,
    chooseCompany: !!operation.aplBusinessId && !onlyCompany,
  });
  // Steps come and go with the business: track the position by step id
  const [currentId, setCurrentId] = useState<StepId>(() => steps[0].id);
  const [visited, setVisited] = useState<StepId[]>(() => [steps[0].id]);
  const found = steps.findIndex((s) => s.id === currentId);
  // A step that went away (e.g. no longer auto credit): stay on Financial data
  const index =
    found !== -1
      ? found
      : currentId === "company"
        ? Math.max(0, steps.findIndex((s) => s.id !== "business")) // the company was decided: the step after Business
        : currentId === "customer" ||
          currentId === "quotation" ||
          currentId === "business"
        ? 0 // step 1 switched (Customer / Quotation), or the Business step went away
        : Math.max(
            0,
            steps.findIndex((s) => s.id === "financial"),
          );
  const maxVisited = Math.max(
    index,
    ...visited.map((id) => steps.findIndex((s) => s.id === id)),
  );
  /** Steps whose errors should be visible (after Next / Save / Convert) */
  const [shownFor, setShownFor] = useState<StepId[]>([]);

  const [save, saveState] = usePostApiCreditOperationsSaveCredOperMutation();
  const [convert, convertState] =
    usePostApiCreditOperationsQuotationToProposalMutation();

  // Options for the operation fields; financial products depend on the business
  const { options, loadingFinancialProducts } = useQuotationOptions({
    business: businesses?.find((b) => b.id === operation.aplBusinessId),
    companyId: operation.aplCompanyId,
    loadingBusinesses,
  });
  const bootstrap = useQuotationBootstrap();
  // The server's blank operation, fetched once the business is chosen
  const template = useCredOperTemplate(stage, operation);
  const { financialProduct } = useFinancialProductSync(
    operation,
    STEP_OF_STAGE[stage],
    !template.isPending,
  );

  const validation = validateStages(steps, operation, todayLocal());
  const visibleInvalid = validation.invalidSteps.filter((id) =>
    shownFor.includes(id),
  );
  const step = steps[index];
  const StepComponent = STEP_COMPONENTS[step.id];

  const goTo = (id: StepId) => {
    if (!steps.some((s) => s.id === id)) return;
    setCurrentId(id);
    setVisited((v) => (v.includes(id) ? v : [...v, id]));
  };

  // A step asked to move on (e.g. a business was picked): done here, once the operation and its
  // steps reflect the change, so the new steps exist and the step validates
  const [advancing, setAdvancing] = useState(false);
  if (advancing) {
    setAdvancing(false);
    if (!validation.invalidSteps.includes(step.id) && index < steps.length - 1)
      goTo(steps[index + 1].id);
  }

  const next = () => {
    setShownFor((s) => [...new Set([...s, step.id])]);
    if (validation.invalidSteps.includes(step.id)) return focusFirstInvalid();
    goTo(steps[index + 1].id);
  };

  /** Shows all errors; returns false (and jumps to the first problem) when invalid. */
  const validateAll = () => {
    setShownFor(steps.map((s) => s.id));
    if (!validation.firstInvalidStep) return true;
    goTo(validation.firstInvalidStep);
    focusFirstInvalid();
    return false;
  };

  const onSave = async () => {
    if (!validateAll()) return;
    convertState.reset();
    try {
      // Edits made while saving are kept (and stay unsaved)
      dispatch(
        markSaved(await save({ credOperDto: operation }).unwrap(), revision),
      );
    } catch {
      // shown in the action bar
    }
  };

  const onConvert = async () => {
    if (!validateAll()) return;
    saveState.reset();
    try {
      const proposal = await convert({ credOperDto: operation }).unwrap();
      dispatch(
        loadExisting({
          ...proposal,
          credOperStep: proposal.credOperStep ?? 2,
          insurances: operation.insurances,
        }),
      );
      navigate(STAGE_ROUTES.proposal, {
        state: { intent: "continue" } satisfies SessionNavState,
      });
    } catch {
      // shown in the action bar
    }
  };

  const canConvert = operation.id != null && !isDirty;
  const showCalculation = step.id === "financial";
  const errorsForStep: FieldErrors = shownFor.includes(step.id)
    ? validation.errors
    : {};

  return (
    <div className="d-flex flex-column gap-3 app-credoper">
      <div className="card border-0 shadow-sm">
        <div className="card-body d-flex flex-column gap-3">
          <OperationHeader
            stage={stage}
            operation={operation}
            isDirty={isDirty}
          />
          <Stepper
            steps={steps}
            current={index}
            maxVisited={maxVisited}
            invalid={visibleInvalid}
            incomplete={validation.invalidSteps}
            onSelect={(i) => goTo(steps[i].id)}
          />
        </div>
      </div>

      <div className="row g-3 align-items-start">
        {/* The Summary step shows the calculation itself, full width */}
        <div className={!showCalculation ? "col-12" : "col-12 col-lg-8"}>
          <section
            className="card border-0 shadow-sm"
            aria-labelledby="step-title"
          >
            <div className="card-body">
              <StepTransition index={index}>
                <h3 id="step-title" className="h5 fw-semibold mb-3">
                  <i
                    className={`bi ${step.icon} me-2 text-primary`}
                    aria-hidden="true"
                  />
                  {step.label}
                </h3>
                {template.isPending && step.id !== "business" ? (
                  template.error ? (
                    <div className="text-center py-4" role="alert">
                      <i className="bi bi-exclamation-triangle display-6 text-warning" aria-hidden="true" />
                      <h4 className="h6 mt-3">Couldn't start a new {stage}</h4>
                      <p className="text-body-secondary">
                        {getApiErrorMessage(template.error) ?? "Please try again."}
                      </p>
                      <button type="button" className="btn btn-primary" onClick={template.retry}>
                        Retry
                      </button>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center gap-2 text-body-secondary py-4" role="status">
                      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                      Preparing the {stage}…
                    </div>
                  )
                ) : (
                <StepComponent
                  stage={stage}
                  errors={
                    step.id === "summary" ? validation.errors : errorsForStep
                  }
                  showErrors={shownFor.includes(step.id)}
                  goTo={goTo}
                  advance={() => setAdvancing(true)}
                  steps={steps}
                  errorsByStep={validation.byStep}
                  formProps={{
                    options,
                    fetchingOptions: {
                      financialProducts: loadingFinancialProducts,
                      credOperClassifications:
                        bootstrap.fetchingCredoperClassifications,
                    },
                    termTicks,
                    dispatchCredOper: dispatch,
                    financialProduct,
                  }}
                />
                )}
              </StepTransition>
            </div>
            <div className="card-footer bg-body py-3">
              <WizardActions
                isFirst={index === 0}
                // Before a business is chosen it is the only step, but the flow continues after it
                isLast={index === steps.length - 1 && step.id !== "business"}
                onBack={() => goTo(steps[Math.max(0, index - 1)].id)}
                onNext={next}
                onSave={onSave}
                isSaving={saveState.isLoading}
                showConvert={stage === "quotation" && step.id === "summary"}
                canConvert={canConvert}
                onConvert={onConvert}
                isConverting={convertState.isLoading}
                convertHint={
                  operation.id == null
                    ? "Save the quotation first."
                    : "Save your changes first."
                }
                error={saveState.error ?? convertState.error}
              />
            </div>
          </section>
        </div>
        {showCalculation && (
          <div className="col-12 col-lg-4">
            <SummaryPanel operation={operation} />
          </div>
        )}
      </div>
    </div>
  );
}

// /quotation and /proposal (spec §2): session states around the wizard.
function CredOperWizardPage({ stage }: { stage: Stage }) {
  const session = useCredOperSession(stage);
  const stored = useAppSelector(selectCredoper);
  const storedLabel = !stored
    ? "the operation you were editing"
    : stored.id != null
      ? `${stageOf(stored) === "proposal" ? "Proposal" : "Quotation"} #${stored.credOperNumber ?? stored.id}`
      : `a new ${stageOf(stored)}`;

  if (session.status === "prompt") {
    return (
      <DiscardPrompt
        label={storedLabel}
        onContinue={session.continueEditing}
        onDiscard={session.discardAndStartNew}
      />
    );
  }

  if (session.status === "loading" || !session.operation) return <PageLoader />;

  return (
    <>
      {session.notice && (
        <div className="alert alert-info d-flex gap-2" role="status">
          <i className="bi bi-info-circle" aria-hidden="true" />
          <span>{session.notice}</span>
        </div>
      )}
      <Wizard
        key={session.sessionId}
        stage={stage}
        operation={session.operation}
      />
    </>
  );
}

export default CredOperWizardPage;
