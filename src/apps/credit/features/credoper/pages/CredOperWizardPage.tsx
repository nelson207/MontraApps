import StepTransition from "@platform/components/ui/StepTransition";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { problemMessage, problemStatus, PROBLEM } from "@platform/api/problemCode";
import {
  selectCredoper,
  selectCredoperIsDirty,
  selectCredoperRevision,
  selectQuotationConverted,
  useAppDispatch,
  useAppSelector,
} from "@credit/store";
import PageLoader from "@platform/features/layout/components/PageLoader";
import {
  conversionErrorMessage,
  failedSave,
  isConcurrencyConflict,
  openCredOper,
  saveErrorMessage,
  useSaveCredOper,
} from "../api/credOperApi";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import DiscardPrompt from "../components/wizard/DiscardPrompt";
import OperationHeader from "../components/wizard/OperationHeader";
import ProductDefaultsLoading from "../components/wizard/ProductDefaultsLoading";
import ProductDefaultsPrompt from "../components/wizard/ProductDefaultsPrompt";
import { SaveSheet, SaveStatus } from "../components/wizard/SaveResults";
import Stepper from "../components/wizard/Stepper";
import SummaryPanel from "../components/wizard/SummaryPanel";
import { useCalculation } from "../hooks/useCalculation";
import WizardActions from "../components/wizard/WizardActions";
import { DEFAULT_TERM_RESTRICTIONS } from "../constants";
import { useBusinessChoices } from "../business/useBusinessChoices";
import { useCompanyChoices } from "../business/useCompanyChoices";
import {
  loadExisting,
  markSaved,
  patchCredoper,
  presetAssetType,
  presetBusiness,
  presetCompany,
} from "../credoperSlice";
import { useAssetTypeChoices } from "../business/useAssetTypeChoices";
import { assetTypeLabel, assetTypeOf, checkAssetType } from "../model/business";
import useFinancialProductSync from "../hooks/useFinancialProductSync";
import { useNewAsset } from "../hooks/useNewAsset";
import { useCredOperTemplate } from "../hooks/useCredOperTemplate";
import { useQuotationOptions } from "../hooks/useQuotationOptions";
import {
  convertedFromQuotation,
  operationTitle,
  stageOf,
  type CredOperDraft,
  type Stage,
} from "../model/credOperDraft";
import { hasCalculationError, opensAfterSave, type SaveOutcome } from "../model/operationMessages";
import {
  convertQuotationPath,
  openOperationPath,
  useCredOperSession,
} from "../session/useCredOperSession";
import { buildTermTicks } from "../utils/termTicks";
import type { FieldErrors } from "../validation/fieldRules";
import { todayLocal } from "../validation/localDate";
import { STEP_COMPONENTS } from "../wizard/stepComponents";
import { stepsFor, validateStages, type StepId } from "../wizard/steps";

const termTicks = buildTermTicks(DEFAULT_TERM_RESTRICTIONS);

const CONFLICT_MESSAGE =
  "This operation was changed by someone else, so your changes weren't saved. Reopen it to see the latest version.";

/** How long Calculate stays highlighted: its animation's length (credoper.scss), and a little more */
const CALCULATE_NUDGE_MS = 1400;

/** Focus the first invalid field once React has rendered the errors. */
const focusFirstInvalid = () =>
  requestAnimationFrame(() =>
    document.querySelector<HTMLElement>("main [aria-invalid=true]")?.focus(),
  );

function Wizard({
  stage,
  operation,
  startAtSummary = false,
}: {
  stage: Stage;
  operation: CredOperDraft;
  /** A saved operation opened to edit: shown whole (Summary), every step reachable */
  startAtSummary?: boolean;
}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isDirty = useAppSelector(selectCredoperIsDirty);
  const revision = useAppSelector(selectCredoperRevision);
  const quotationConverted = useAppSelector(selectQuotationConverted(operation.id, operation.credOperNumber));
  // The business decides the steps; with a single business to offer (a new proposal: only those
  // that can start in proposal, Settings → Application) it's chosen for the
  // user and the Business step is skipped
  // Subscribed here for the whole operation: the Business step and the financial product field
  // read the same answer, never reloaded when going back
  const { data: businesses, isLoading: loadingBusinesses } = useBusinessChoices(stage, operation);
  // A proposal made from a quotation keeps its company, business and operation type: nothing
  // decides them for the user (the store keeps them too, credoperSlice)
  const locked = convertedFromQuotation(operation);
  const onlyBusiness = businesses?.length === 1 ? businesses[0] : null;
  useEffect(() => {
    if (!locked && onlyBusiness && !operation.aplBusinessId)
      dispatch(presetBusiness(onlyBusiness.id));
  }, [locked, onlyBusiness, operation.aplBusinessId, dispatch]);
  // The companies the business can be done with: one = decided for the user, several = the
  // Company step (also while they're loading or failed, so it can show that)
  const companyChoices = useCompanyChoices(stage, operation);
  const onlyCompany = companyChoices.data?.length === 1 ? companyChoices.data[0] : null;
  useEffect(() => {
    if (!locked && onlyCompany && operation.aplCompanyId !== onlyCompany.id)
      dispatch(presetCompany(onlyCompany.id));
  }, [locked, onlyCompany, operation.aplCompanyId, dispatch]);
  // What the business finances in the company, asked once both are decided
  // (GET /api/credit-operations/asset-types): one = decided for the user, several = the Asset type
  // step (also while they're loading). After another business or company, an asset type no longer
  // offered is chosen again; its data goes only once the user confirms it there (checkAssetType).
  const assetTypeChoices = useAssetTypeChoices(stage, operation);
  const assetTypeCheck = checkAssetType(operation, assetTypeChoices.data);
  const currentAssetType = assetTypeOf(operation);
  useEffect(() => {
    if (assetTypeCheck.preset !== undefined) dispatch(presetAssetType(assetTypeCheck.preset));
    else if (assetTypeCheck.clear) dispatch(patchCredoper({ assetTypeId: undefined }));
  }, [assetTypeCheck.preset, assetTypeCheck.clear, dispatch]);
  const steps = stepsFor(stage, operation, {
    chooseBusiness: !onlyBusiness,
    chooseCompany: !!operation.aplBusinessId && !onlyCompany,
    chooseAssetType: !!operation.aplBusinessId && assetTypeCheck.userChooses,
  });
  // The tag under the title: Company · Business · Asset type
  const business = businesses?.find((b) => b.id === operation.aplBusinessId);
  const headerLabels = {
    company: business?.offers.find((o) => o.companyId === operation.aplCompanyId)?.companyLabel,
    assetType:
      currentAssetType === undefined
        ? undefined
        : (assetTypeChoices.data?.find((a) => a.id === currentAssetType)?.label ?? assetTypeLabel(currentAssetType)),
  };
  // Steps come and go with the business: track the position by step id
  const firstStep = startAtSummary ? steps[steps.length - 1] : steps[0];
  const [currentId, setCurrentId] = useState<StepId>(() => firstStep.id);
  const [visited, setVisited] = useState<StepId[]>(() => [firstStep.id]);
  const found = steps.findIndex((s) => s.id === currentId);
  // A step that went away (e.g. no longer auto credit): stay on Financial data
  const index =
    found !== -1
      ? found
      : currentId === "company" || currentId === "assetType"
        ? // the company or the asset type was decided: the step after those
          Math.max(0, steps.findIndex((s) => s.id !== "business" && s.id !== "company"))
        : currentId === "customer" || currentId === "quotation" || currentId === "business"
        ? 0 // the first steps changed (the Quotation step came or went), or the Business step went away
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

  // New API: POST /api/credit-operations/save-credoper (answer merged over the draft)
  const [save, saveState] = useSaveCredOper();
  // What the last save answered. It stays while the user moves around and edits, because that's
  // how they act on it: only the next save replaces it (a refused save comes back thrown, not as
  // the mutation's)
  const [outcome, setOutcome] = useState<SaveOutcome | null>(null);
  // Its messages, above the action bar: open by themselves when there's something to act on
  const [sheetOpen, setSheetOpen] = useState(false);
  // Where focus goes once the sheet has opened or closed
  const focusNext = useRef<"save-results" | "save-status" | null>(null);
  useEffect(() => {
    if (!focusNext.current) return;
    const target = document.getElementById(focusNext.current) ?? document.getElementById("save-status");
    focusNext.current = null;
    target?.focus();
  }, [outcome, sheetOpen]);
  /** What a save answered: Save is at the bottom of a long page, so it takes the user to it */
  const report = (answer: SaveOutcome) => {
    focusNext.current = "save-results";
    setOutcome(answer);
    setSheetOpen(opensAfterSave(answer));
  };
  const showSheet = (open: boolean) => {
    focusNext.current = open ? "save-results" : "save-status";
    setSheetOpen(open);
  };

  // Options for the operation fields; financial products and classifications depend on the business
  const { options, loadingFinancialProducts, loadingClassifications } = useQuotationOptions({
    business,
    companyId: operation.aplCompanyId,
    loadingBusinesses,
  });
  // The server's blank operation, fetched once the asset type is decided (chosen or set for the user); the
  // product's defaults come after it (they'd have nothing to land on before)
  const template = useCredOperTemplate(stage, operation, options.credOperClassifications);
  const { conflicts, resolveConflicts, isLoading: loadingProductDefaults } = useFinancialProductSync(operation, !template.awaiting);
  // A new equipment or building when the asset type, business or company changes (the first is the template's)
  const newAsset = useNewAsset(operation, template);

  const validation = validateStages(steps, operation, todayLocal());
  const stale = !!outcome && outcome.revision !== revision;
  // A refused calculation is fixed in Financial data: the step shows it until the values change
  const financialRefused =
    !!outcome && !outcome.saved && !stale && hasCalculationError(outcome.messages) && steps.some((s) => s.id === "financial");
  const visibleInvalid = [
    ...validation.invalidSteps.filter((id) => shownFor.includes(id)),
    ...(financialRefused && !validation.invalidSteps.includes("financial") ? (["financial"] as const) : []),
  ];
  const step = steps[index];
  const StepComponent = STEP_COMPONENTS[step.id];
  // The Financial data step is left forward only once calculated with the values on screen
  const calc = useCalculation(operation);
  const awaitingCalculation = step.id === "financial" && calc.needsCalculation;
  /** The page waits (overlay): a new product's values loading, or a calculation running */
  const blocked = loadingProductDefaults || calc.isLoading;
  // Next pressed before calculating: Calculate is highlighted for a moment
  const [calculateNudged, setCalculateNudged] = useState(false);
  useEffect(() => {
    if (!calculateNudged) return;
    const timer = setTimeout(() => setCalculateNudged(false), CALCULATE_NUDGE_MS);
    return () => clearTimeout(timer);
  }, [calculateNudged]);

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
    if (awaitingCalculation) return setCalculateNudged(true);
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

  // One save at a time (the button is off meanwhile too; the API also takes a repeated save of a
  // new operation, by its correlationId, as the same one)
  const saving = useRef(false);
  const onSave = async () => {
    if (saving.current || !validateAll()) return;
    saving.current = true;
    try {
      const { operation: saved, messages } = await save(operation);
      // Edits made while saving are kept (and stay unsaved)
      dispatch(markSaved(saved, revision));
      report({ saved: true, messages, revision });
    } catch (error) {
      // Nothing was saved: the form stays as the user left it, with the error, ready to save again
      // with the same correlationId. A conflict (409) offers to reopen, never done by itself
      report(failedSave(error, revision));
    } finally {
      saving.current = false;
    }
  };

  // Someone else saved the operation since it was opened: its latest version, in place of this one
  const [reopening, setReopening] = useState(false);
  const reopen = async () => {
    if (!operation.id || reopening) return;
    setReopening(true);
    try {
      dispatch(loadExisting(await openCredOper(dispatch, operation.id)));
      setOutcome(null);
      setSheetOpen(false);
    } catch (error) {
      report(failedSave(error, revision));
    } finally {
      setReopening(false);
    }
  };

  // Quotation → proposal: only from the saved quotation, as saved (no changes since). The proposal
  // screen makes it (GET …/quotation-to-proposal) and opens it, not saved yet
  const onConvert = () => {
    if (!canConvert || !validateAll()) return;
    setOutcome(null);
    navigate(convertQuotationPath(operation.id!));
  };

  const conflict = isConcurrencyConflict(outcome?.error);
  // Said when the API's messages don't: a request that failed rather than a refusal
  const failureText =
    !outcome || outcome.saved || outcome.messages.length > 0
      ? undefined
      : conflict
        ? CONFLICT_MESSAGE
        : saveErrorMessage(outcome.error);
  const results = outcome && { outcome, title: operationTitle(stage, operation), stage, stale };
  // Next waits for the calculation, unless the step has errors to show first
  const nextBlocked = awaitingCalculation && !validation.invalidSteps.includes(step.id);

  const canConvert = operation.id != null && !isDirty;
  const showCalculation = step.id === "financial";
  const errorsForStep: FieldErrors = shownFor.includes(step.id)
    ? validation.errors
    : {};

  return (
    // Blocked while a new product's values load: nothing to type, calculate or leave meanwhile
    // Also while calculating: the values on screen are about to be replaced by the result
    <div className="d-flex flex-column gap-3 app-credoper app-has-wizard-bar" inert={blocked} aria-busy={blocked || undefined}>
      <div className="card border-0 shadow-sm">
        <div className="card-body d-flex flex-column gap-3">
          <OperationHeader
            stage={stage}
            operation={operation}
            isDirty={isDirty}
            companyLabel={headerLabels.company}
            assetTypeLabel={headerLabels.assetType}
          />
          <Stepper
            steps={steps}
            current={index}
            maxVisited={maxVisited}
            invalid={visibleInvalid}
            incomplete={validation.invalidSteps}
            onSelect={(i) => (i > index && awaitingCalculation ? undefined : goTo(steps[i].id))}
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
                {/* The people wait for the customer (asked for once there's a classification); a failure is said below */}
                {template.isPending && !template.error && (step.id === "interventions" || step.id === "insurances") ? (
                  <div className="d-flex align-items-center gap-2 text-body-secondary py-4" role="status">
                    <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                    Preparing the {stage}…
                  </div>
                ) : (
                <>
                {!!newAsset.error && (step.id === "equipment" || step.id === "building") && (
                  <div className="alert alert-warning d-flex align-items-center gap-2" role="alert">
                    <span className="flex-grow-1">
                      Couldn't prepare the new {step.id === "building" ? "building" : "equipment"}:{" "}
                      {getApiErrorMessage(newAsset.error) ?? "please try again."}
                    </span>
                    <button type="button" className="btn btn-sm btn-outline-warning" onClick={newAsset.retry}>
                      Retry
                    </button>
                  </div>
                )}
                {/* The server's blank operation failed (after the product was chosen): the step stays usable */}
                {!!template.error && step.id !== "business" && (
                  <div className="alert alert-warning d-flex align-items-center gap-2" role="alert">
                    <span className="flex-grow-1">
                      Couldn't prepare the {stage}: {getApiErrorMessage(template.error) ?? "please try again."}
                    </span>
                    <button type="button" className="btn btn-sm btn-outline-warning" onClick={template.retry}>
                      Retry
                    </button>
                  </div>
                )}
                <StepComponent
                  stage={stage}
                  saveResultsShown={!!outcome && !stale}
                  calculationStale={calc.isStale}
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
                      credOperClassifications: loadingClassifications,
                    },
                    termTicks,
                    dispatchCredOper: dispatch,
                  }}
                />
                </>
                )}
              </StepTransition>
            </div>
          </section>
        </div>
        {showCalculation && (
          <div className="col-12 col-lg-4">
            <SummaryPanel operation={operation} calc={calc} nudged={calculateNudged} />
          </div>
        )}
      </div>
      {conflicts.length > 0 && (
        // Keyed by the conflicts: a newer product's question starts with its own choices
        <ProductDefaultsPrompt key={conflicts.map((c) => c.field).join()} conflicts={conflicts} onResolve={resolveConflicts} />
      )}
      {loadingProductDefaults ? <ProductDefaultsLoading /> : calc.isLoading && <ProductDefaultsLoading text="Calculating…" />}
      {/* In the blocked page, not portalled: nothing to press while it waits */}
      <WizardActions
        isFirst={index === 0}
        // Before a business is chosen it is the only step, but the flow continues after it
        isLast={index === steps.length - 1 && step.id !== "business"}
        onBack={() => goTo(steps[Math.max(0, index - 1)].id)}
        onNext={next}
        nextBlocked={nextBlocked}
        nextHint={awaitingCalculation ? (calc.isStale ? "Values changed: calculate again before moving on." : "Calculate before moving on.") : undefined}
        onSave={onSave}
        isSaving={saveState.isLoading || reopening}
        // Only a saved quotation (it has an id) can be converted
        showConvert={stage === "quotation" && step.id === "summary" && operation.id != null && !quotationConverted}
        canConvert={canConvert}
        onConvert={onConvert}
        isConverting={false}
        convertHint="Save your changes first."
        status={results && <SaveStatus {...results} open={sheetOpen} onToggle={() => showSheet(!sheetOpen)} />}
        sheet={
          results &&
          sheetOpen && (
            <SaveSheet
              {...results}
              failure={failureText}
              action={conflict ? { label: "Reopen", onClick: () => void reopen(), busy: reopening } : undefined}
              // Calculation messages are fixed there, when the operation has that step
              onGoToFinancial={
                step.id !== "financial" && steps.some((s) => s.id === "financial")
                  ? () => {
                      goTo("financial");
                      setSheetOpen(false);
                    }
                  : undefined
              }
              onHide={() => showSheet(false)}
            />
          )
        }
      />
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
      ? `${stageOf(stored) === "proposal" ? "Proposal" : "Quotation"}${stored.credOperNumber != null ? ` #${stored.credOperNumber}` : ""}`
      : `a new ${stageOf(stored)}`;

  if (session.status === "prompt") {
    return (
      <DiscardPrompt
        label={storedLabel}
        discardsTo={session.discardsTo}
        onContinue={session.continueEditing}
        onDiscard={session.discardAndStartNew}
      />
    );
  }

  if (session.status === "error") {
    const converting = session.convertFrom;
    const message = converting
      ? conversionErrorMessage(session.loadError)
      : problemStatus(session.loadError) === 404
        ? "It doesn't exist anymore, or you can't see it."
        : (problemMessage(session.loadError, { [PROBLEM.invalidId]: "The link to it isn't valid anymore." }) ??
          getApiErrorMessage(session.loadError) ??
          "Please try again.");
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center py-5" role="alert">
          <i className="bi bi-exclamation-triangle display-6 text-warning" aria-hidden="true" />
          <h2 className="h5 mt-3">{converting ? "Couldn't convert the quotation to a proposal" : "Couldn't open the operation"}</h2>
          <p className="text-body-secondary">{message}</p>
          <div className="d-flex justify-content-center gap-2">
            {converting && problemStatus(session.loadError) !== 404 ? (
              <Link to={openOperationPath("quotation", converting)} className="btn btn-ghost">
                <i className="bi bi-arrow-left me-1" aria-hidden="true" />
                Back to the quotation
              </Link>
            ) : (
              <Link to="/search" className="btn btn-ghost">
                <i className="bi bi-arrow-left me-1" aria-hidden="true" />
                Back to search
              </Link>
            )}
            <button type="button" className="btn btn-primary" onClick={session.retry}>
              Retry
            </button>
          </div>
        </div>
      </div>
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
        startAtSummary={session.isOpened}
      />
    </>
  );
}

export default CredOperWizardPage;
