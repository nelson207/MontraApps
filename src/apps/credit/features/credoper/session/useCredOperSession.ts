import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  selectCredoper,
  selectCredoperIsDirty,
  useAppDispatch,
  useAppSelector,
} from "@credit/store";
import { applyWorkContextDefaults } from "./applyWorkContextDefaults";
import { useWorkContext } from "@platform/features/workContext/hooks/useWorkContext";
import { startBlank } from "../credoperSlice";
import {
  STEP_OF_STAGE,
  stageOf,
  type CredOperDraft,
  type Stage,
} from "../model/credOperDraft";
import {
  resolveEntry,
  type EntryDecision,
  type SessionNavState,
} from "./resolveEntry";

export type SessionStatus = "loading" | "ready" | "prompt";

export const STAGE_ROUTES: Record<Stage, string> = {
  quotation: "/quotation",
  proposal: "/proposal",
};

const FALLBACK_NOTICE =
  "The operation you opened isn't available anymore, so a new one was started.";

type Entry = { key: string; decision: EntryDecision; attempt: number };

/**
 * Decides what the Quotation / Proposal screen works on (spec §2):
 * menu entry → new operation (asks first over unsaved work), Search → the opened
 * operation, conversion → the proposal; nothing in memory → new + notice.
 */
export function useCredOperSession(stage: Stage) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const stored = useAppSelector(selectCredoper);
  const isDirty = useAppSelector(selectCredoperIsDirty);
  const workContext = useWorkContext();
  const intent = (location.state as SessionNavState | null)?.intent ?? "new";

  // Decided once per navigation (location.key), so re-renders don't restart it
  const [entry, setEntry] = useState<Entry>(() => ({
    key: location.key,
    decision: resolveEntry({ intent, stage, stored, isDirty }),
    attempt: 0,
  }));
  if (entry.key !== location.key) {
    setEntry({
      key: location.key,
      decision: resolveEntry({ intent, stage, stored, isDirty }),
      attempt: 0,
    });
  }

  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const startedFor = useRef<string | null>(null);

  const createsNew =
    entry.decision === "startNew" || entry.decision === "fallbackNew";
  const runId = `${entry.key}#${entry.attempt}`;
  const contextSettled = workContext.isReady || workContext.isError;

  // The stored operation belongs to the other screen (e.g. browser Back): go there
  const redirectTo =
    entry.decision === "redirect" && stored
      ? STAGE_ROUTES[stageOf(stored)]
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
    // for once the business is chosen (useCredOperTemplate)
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
  else status = loadedFor === runId && stored ? "ready" : "loading";

  const operation: CredOperDraft | null = status === "ready" ? stored : null;

  return {
    /** Changes whenever a different operation session starts (resets wizard position) */
    sessionId: runId,
    operation,
    status,
    notice: entry.decision === "fallbackNew" ? FALLBACK_NOTICE : null,
    discardAndStartNew: () =>
      setEntry((e) => ({ ...e, decision: "startNew", attempt: e.attempt + 1 })),
    continueEditing: () => {
      if (!stored) return;
      const storedStage = stageOf(stored);
      if (storedStage !== stage) {
        navigate(STAGE_ROUTES[storedStage], {
          replace: true,
          state: { intent: "open" } satisfies SessionNavState,
        });
      } else {
        setEntry((e) => ({ ...e, decision: "useStored" }));
      }
    },
  };
}
