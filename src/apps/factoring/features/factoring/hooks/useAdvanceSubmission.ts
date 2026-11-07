import { useEffect, useState } from "react";
import type { FactoringAdvanceResultDto, FactoringKind, NewFactoringAdvanceDto } from "@platform/api/generated/MontraPOSApi";
import { useAppDispatch } from "@platform/app/store";
import { factoringApi, readAdvanceBatch } from "../api/factoringApi";
import { classifyAdvance, pollBatch, type AdvanceAccepted, type ApiMessage } from "../model/submission";
import { useSubmission } from "./useSubmission";

export type AdvanceRequest = Omit<NewFactoringAdvanceDto, "correlationId">;

/** What the outcome shows */
export type AdvanceSummary = {
  kind: FactoringKind | undefined;
  financialInstitution: string | null;
  contractNumber: number | null;
  currencyId: string | null;
  amount: number;
  valueDate: string;
  invoiceNumbers: string[];
};

export function useAdvanceSubmission() {
  const dispatch = useAppDispatch();
  return useSubmission<AdvanceRequest, FactoringAdvanceResultDto, AdvanceSummary, AdvanceAccepted>({
    flow: "advance",
    post: (contractId, body) => dispatch(factoringApi.endpoints.submitAdvance.initiate({ contractId, body })).unwrap(),
    classify: classifyAdvance,
  });
}

export type AdvanceSubmission = ReturnType<typeof useAdvanceSubmission>;

export type BatchProgress =
  | { status: "processing" }
  | { status: "stillProcessing" }
  | { status: "successful"; waitsForBackOffice: boolean; messages: ApiMessage[] }
  | { status: "failed"; messages: ApiMessage[] }
  | { status: "unconfirmed"; messages: ApiMessage[] };

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Follows a started advance's batch. A read that fails isn't a failed advance: polling goes on. */
export function useBatchProgress(batchId: string | undefined) {
  const dispatch = useAppDispatch();
  const [progress, setProgress] = useState<BatchProgress>({ status: "processing" });
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (!batchId) return;
    let cancelled = false;
    void pollBatch({
      getBatch: async () => (await dispatch(readAdvanceBatch(batchId))).data ?? null,
      sleep,
      now: Date.now,
      isCancelled: () => cancelled,
    }).then((result) => {
      if (result.kind === "cancelled") return;
      if (result.kind === "timeout") setProgress({ status: "stillProcessing" });
      else if (result.outcome.kind === "successful")
        setProgress({ status: "successful", waitsForBackOffice: result.outcome.waitsForBackOffice, messages: result.outcome.messages });
      else setProgress({ status: result.outcome.kind, messages: result.outcome.messages });
    });
    return () => {
      cancelled = true;
    };
  }, [batchId, round, dispatch]);

  return {
    progress,
    /** After "still processing": follow it for another 2 minutes */
    followAgain: () => {
      setProgress({ status: "processing" });
      setRound((r) => r + 1);
    },
  };
}
