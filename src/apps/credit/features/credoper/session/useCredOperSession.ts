import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  selectCredoper,
  selectCredoperIsDirty,
  selectQuotationConverted,
  useAppDispatch,
  useAppSelector,
} from "@credit/store";
import { applyWorkContextDefaults } from "./applyWorkContextDefaults";
import { useWorkContext } from "@platform/features/workContext/hooks/useWorkContext";
import { CredOperRefusedError, openCredOper, quotationToProposal } from "../api/credOperApi";
import { stepName } from "../api/credOperMapping";
import { loadExisting, startBlank, startConverted } from "../credoperSlice";
import {
  editableStage,
  STEP_OF_STAGE,
  stageOf,
  type CredOperDraft,
  type Stage,
} from "../model/credOperDraft";
import {
  afterDiscard,
  CONVERT_FROM_PARAM,
  OPEN_ID_PARAM,
  resolveEntry,
  type EntryDecision,
  type SessionNavState,
} from "./resolveEntry";

export type SessionStatus = "loading" | "ready" | "prompt" | "error";

export const STAGE_ROUTES: Record<Stage, string> = {
  quotation: "/quotation",
  proposal: "/proposal",
};

/** The screen that edits a saved operation, opened by its id (Search) */
export const openOperationPath = (stage: Stage, id: string) =>
  `${STAGE_ROUTES[stage]}?${new URLSearchParams({ [OPEN_ID_PARAM]: id })}`;

/** The proposal screen, making a new proposal from a saved quotation (its id) */
export const convertQuotationPath = (quotationId: string) =>
  `${STAGE_ROUTES.proposal}?${new URLSearchParams({ [CONVERT_FROM_PARAM]: quotationId })}`;

const FALLBACK_NOTICE =
  "The operation you opened isn't available anymore, so a new one was started.";

const ALREADY_CONVERTED = "A proposal was already saved from this quotation.";

type Entry = { key: string; decision: EntryDecision; attempt: number };

/**
 * Decides what the Quotation / Proposal screen works on (spec §2):
 * menu entry → new operation (asks first over unsaved work), Search → the saved operation
 * (?id=…, loaded from GET /api/credit-operations/credoper/{id}; asks first over unsaved work),
 * conversion (?fromQuotation=…, GET …/credoper/{id}/quotation-to-proposal; asks first over unsaved
 * work) → the new proposal; nothing in memory → new + notice.
 */
export function useCredOperSession(stage: Stage) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const openId = searchParams.get(OPEN_ID_PARAM);
  const convertFrom = stage === "proposal" ? searchParams.get(CONVERT_FROM_PARAM) : null;
  const stored = useAppSelector(selectCredoper);
  const isDirty = useAppSelector(selectCredoperIsDirty);
  const alreadyConverted = useAppSelector(selectQuotationConverted(convertFrom));
  const workContext = useWorkContext();
  const intent = (location.state as SessionNavState | null)?.intent ?? "new";

  // Decided once per navigation (location.key), so re-renders don't restart it
  const [entry, setEntry] = useState<Entry>(() => ({
    key: location.key,
    decision: resolveEntry({ intent, openId, convertFrom, stage, stored, isDirty }),
    attempt: 0,
  }));
  if (entry.key !== location.key) {
    setEntry({
      key: location.key,
      decision: resolveEntry({ intent, openId, convertFrom, stage, stored, isDirty }),
      attempt: 0,
    });
  }

  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [loadFailure, setLoadFailure] = useState<{ runId: string; error: unknown } | null>(null);
  const startedFor = useRef<string | null>(null);

  const createsNew =
    entry.decision === "startNew" || entry.decision === "fallbackNew";
  const runId = `${entry.key}#${entry.attempt}`;
  const contextSettled = workContext.isReady || workContext.isError;

  // An answer for a run that's over (left, retried, another operation opened) is dropped
  const currentRun = useRef(runId);
  useEffect(() => {
    currentRun.current = runId;
  });

  // The stored operation belongs to the other screen (e.g. browser Back): go there
  const redirectTo =
    entry.decision === "redirect" && stored
      ? openId
        ? openOperationPath(stageOf(stored), openId)
        : STAGE_ROUTES[stageOf(stored)]
      : null;
  useEffect(() => {
    if (redirectTo)
      navigate(redirectTo, {
        replace: true,
        state: { intent: "open" } satisfies SessionNavState,
      });
  }, [redirectTo, navigate]);

  useEffect(() => {
    if (!createsNew || !contextSettled || startedFor.current === runId) return;
    startedFor.current = runId;
    // A blank operation: the server's (GET /api/credit-operations/new-credoper) is only asked
    // for once the business, company and asset type are decided (useCredOperTemplate)
    dispatch(
      startBlank({
        ...applyWorkContextDefaults({ credOperStep: STEP_OF_STAGE[stage] }, workContext.selection),
        insurances: [],
      }),
    );
    setLoadedFor(runId);
  }, [
    createsNew,
    contextSettled,
    runId,
    stage,
    dispatch,
    workContext.selection,
  ]);

  // A saved operation opened from Search: loaded, then edited on its own screen
  useEffect(() => {
    if (entry.decision !== "load" || !openId || startedFor.current === runId) return;
    startedFor.current = runId;
    openCredOper(dispatch, openId)
      .then((operation) => {
        if (currentRun.current !== runId) return;
        // Without a step: the screen it was opened on
        const ownStage = operation.credOperStep == null ? stage : editableStage(stepName(operation.credOperStep));
        if (!ownStage) {
          throw new CredOperRefusedError([], "This operation can't be edited here: only quotations and proposals can.");
        }
        dispatch(loadExisting(operation));
        if (ownStage !== stage) {
          navigate(openOperationPath(ownStage, openId), {
            replace: true,
            state: { intent: "open" } satisfies SessionNavState,
          });
        } else {
          setLoadedFor(runId);
        }
      })
      .catch((error: unknown) => {
        if (currentRun.current === runId) setLoadFailure({ runId, error });
      });
  }, [entry.decision, openId, runId, stage, dispatch, navigate]);

  // A new proposal from a saved quotation (Convert to proposal): the API's, as it returned it (not
  // saved yet), then edited on the proposal screen without the parameter (a refresh doesn't
  // convert again)
  useEffect(() => {
    // Reached by a link kept from before: it would only fail, so it isn't asked for (see `status`)
    if (entry.decision !== "convert" || !convertFrom || alreadyConverted || startedFor.current === runId) return;
    startedFor.current = runId;
    quotationToProposal(dispatch, convertFrom)
      .then((proposal) => {
        if (currentRun.current !== runId) return;
        dispatch(startConverted(proposal));
        navigate(STAGE_ROUTES.proposal, {
          replace: true,
          state: { intent: "continue" } satisfies SessionNavState,
        });
      })
      .catch((error: unknown) => {
        if (currentRun.current === runId) setLoadFailure({ runId, error });
      });
  }, [entry.decision, convertFrom, alreadyConverted, runId, dispatch, navigate]);

  // Leaving the site with unsaved changes → browser confirmation
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  let status: SessionStatus;
  if (entry.decision === "promptDiscard") status = "prompt";
  else if (entry.decision === "useStored")
    status = stored ? "ready" : "loading";
  else if (entry.decision === "convert" && alreadyConverted) status = "error";
  else if ((entry.decision === "load" || entry.decision === "convert") && loadFailure?.runId === runId) status = "error";
  else status = loadedFor === runId && stored ? "ready" : "loading";

  const operation: CredOperDraft | null = status === "ready" ? stored : null;

  return {
    /** Changes whenever a different operation session starts (resets wizard position) */
    sessionId: runId,
    operation,
    status,
    /** A saved operation opened to edit (Search): the wizard starts at its summary */
    isOpened: !!openId && (entry.decision === "load" || entry.decision === "useStored"),
    /** Why the operation couldn't be opened, or the quotation converted (status "error") */
    loadError: status !== "error" ? null : entry.decision === "convert" && alreadyConverted ? new CredOperRefusedError([], ALREADY_CONVERTED) : loadFailure?.error,
    /** The quotation being converted to a proposal (its id), if that's what the screen does */
    convertFrom: entry.decision === "convert" ? convertFrom : null,
    retry: () => setEntry((e) => ({ ...e, attempt: e.attempt + 1 })),
    notice: entry.decision === "fallbackNew" ? FALLBACK_NOTICE : null,
    /** What the prompt's discard does: convert the quotation, open the one asked for, or start a new one */
    discardsTo: convertFrom ? ("convert" as const) : openId ? ("open" as const) : ("new" as const),
    discardAndStartNew: () =>
      setEntry((e) => ({ ...e, decision: afterDiscard(openId, convertFrom), attempt: e.attempt + 1 })),
    continueEditing: () => {
      if (!stored) return;
      const storedStage = stageOf(stored);
      if (storedStage !== stage || openId || convertFrom) {
        // Its own screen, without the other operation's id in the URL
        navigate(STAGE_ROUTES[storedStage], {
          replace: true,
          state: { intent: "continue" } satisfies SessionNavState,
        });
      } else {
        setEntry((e) => ({ ...e, decision: "useStored" }));
      }
    },
  };
}
