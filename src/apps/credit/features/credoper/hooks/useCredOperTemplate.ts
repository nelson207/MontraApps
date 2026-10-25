import { useEffect, useState } from "react";
import type { CreditOperationStep } from "@platform/api/generated/MontraPOSApi";
import { selectCredoperAwaitingTemplate, useAppDispatch, useAppSelector } from "@credit/store";
import { newCredOper } from "../api/credOperApi";
import { applyTemplate } from "../credoperSlice";
import { STEP_OF_STAGE, type CredOperDraft, type Stage } from "../model/credOperDraft";

/**
 * A new operation starts blank; once its business is chosen (picked, or preset when it's the
 * only one) the server's blank operation is fetched (GET /api/credit-operations/new-credoper;
 * a proposal also gets its customer) and merged under what was chosen.
 */
export function useCredOperTemplate(stage: Stage, operation: CredOperDraft) {
  const dispatch = useAppDispatch();
  const awaiting = useAppSelector(selectCredoperAwaitingTemplate);
  const businessId = operation.aplBusinessId;
  const [failure, setFailure] = useState<{ error: unknown; attempt: number } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!awaiting || !businessId) return;
    // An answer after leaving (or for a retry that was replaced) is dropped
    let cancelled = false;
    newCredOper(dispatch, STEP_OF_STAGE[stage] as CreditOperationStep)
      .then((template) => {
        if (!cancelled) dispatch(applyTemplate(template));
      })
      .catch((error: unknown) => {
        if (!cancelled) setFailure({ error, attempt });
      });
    return () => {
      cancelled = true;
    };
  }, [awaiting, businessId, attempt, stage, dispatch]);

  const error = awaiting && failure?.attempt === attempt ? failure.error : null;
  return {
    /** Waiting for the business, or for the template: the steps after Business can't be shown yet */
    isPending: awaiting,
    isLoading: awaiting && !!businessId && !error,
    error,
    retry: () => setAttempt((n) => n + 1),
  };
}
