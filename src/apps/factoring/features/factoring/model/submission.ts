import type {
  CalculationMessageDto,
  FactoringAdvanceBatchDto,
  FactoringAdvanceResultDto,
  FactoringCessionResultDto,
  FactoringCounterpartyResultDto,
} from "@platform/api/generated/MontraPOSApi";

// What each answer means, free of React and tested on its own: requests and advances can't be sent
// twice by accident, so what counts as a definite outcome is decided here, in one place.

export const POLL_INTERVAL_MS = 2_000;
export const POLL_TIMEOUT_MS = 120_000;

export type ApiMessage = CalculationMessageDto;

export type Outcome<Accepted> =
  | { kind: "uncertain"; messages: ApiMessage[] }
  | { kind: "refused"; messages: ApiMessage[] }
  | { kind: "accepted"; accepted: Accepted; messages: ApiMessage[] };

export type CessionAccepted = { cessionId: string | null; cessionNumber: number | null };
export type AdvanceAccepted = { batchId: string; advanceId: string | null };

/** isUncertain wins over everything; only an explicit false means nothing was saved */
export function classifyCession(result: FactoringCessionResultDto | null | undefined): Outcome<CessionAccepted> {
  const messages = result?.messages ?? [];
  if (!result || result.isUncertain) return { kind: "uncertain", messages };
  if (result.isSubmitted === false) return { kind: "refused", messages };
  if (result.isSubmitted === true)
    return { kind: "accepted", accepted: { cessionId: result.cessionId ?? null, cessionNumber: result.cessionNumber ?? null }, messages };
  return { kind: "uncertain", messages };
}

/**
 * The same for an advance. A refusal can carry a batchId: it is not followed, and the next try is a
 * new attempt. Started with no batch to follow can't be confirmed from here, so it is uncertain.
 */
export function classifyAdvance(result: FactoringAdvanceResultDto | null | undefined): Outcome<AdvanceAccepted> {
  const messages = result?.messages ?? [];
  if (!result || result.isUncertain) return { kind: "uncertain", messages };
  if (result.isStarted === false) return { kind: "refused", messages };
  if (result.isStarted === true && result.batchId)
    return { kind: "accepted", accepted: { batchId: result.batchId, advanceId: result.advanceId ?? null }, messages };
  return { kind: "uncertain", messages };
}

export type CounterpartyOutcome = { kind: "added" | "refused" | "uncertain"; messages: ApiMessage[] };

export function classifyCounterparty(result: FactoringCounterpartyResultDto | null | undefined): CounterpartyOutcome {
  const messages = result?.messages ?? [];
  if (!result || result.isUncertain) return { kind: "uncertain", messages };
  if (result.isAdded === true) return { kind: "added", messages };
  if (result.isAdded === false) return { kind: "refused", messages };
  return { kind: "uncertain", messages };
}

export type BatchOutcome =
  | { kind: "running" }
  | { kind: "successful"; waitsForBackOffice: boolean; messages: ApiMessage[] }
  /** The API says it failed: the user can correct it and request it again, as a new attempt */
  | { kind: "failed"; messages: ApiMessage[] }
  /** The API can't tell, so only the list can */
  | { kind: "unconfirmed"; messages: ApiMessage[] };

/** Nothing counts until the batch is finished. Then `result` decides, and without one isSuccessful. */
export function classifyBatch(batch: FactoringAdvanceBatchDto): BatchOutcome {
  if (batch.isFinished !== true || batch.result === "Running") return { kind: "running" };
  const messages = batch.messages ?? [];
  if (batch.result === "Failed") return { kind: "failed", messages };
  const succeeded = batch.result ? batch.result === "Succeeded" : batch.isSuccessful === true;
  if (!succeeded) return { kind: "unconfirmed", messages };
  return { kind: "successful", waitsForBackOffice: batch.advanceStatus?.toLowerCase() === "initial", messages };
}

type PollDeps = {
  /** Null when this read failed: a failed read isn't a failed advance, so polling goes on */
  getBatch: () => Promise<FactoringAdvanceBatchDto | null>;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  isCancelled: () => boolean;
};

export type PollResult = { kind: "finished"; outcome: Exclude<BatchOutcome, { kind: "running" }> } | { kind: "timeout" } | { kind: "cancelled" };

/** One read every 2 seconds (never overlapping), for up to 2 minutes */
export async function pollBatch({ getBatch, sleep, now, isCancelled }: PollDeps): Promise<PollResult> {
  const deadline = now() + POLL_TIMEOUT_MS;
  while (now() + POLL_INTERVAL_MS <= deadline) {
    await sleep(POLL_INTERVAL_MS);
    if (isCancelled()) return { kind: "cancelled" };
    const batch = await getBatch();
    if (isCancelled()) return { kind: "cancelled" };
    if (batch) {
      const outcome = classifyBatch(batch);
      if (outcome.kind !== "running") return { kind: "finished", outcome };
    }
  }
  return { kind: "timeout" };
}

/**
 * One submission, kept until it has a definite outcome, also across a page reload: reopening the
 * page mustn't make a new correlationId for something that may have been sent.
 */
export type Attempt<Request, Summary, Accepted> = {
  correlationId: string;
  contractId: string;
  request: Request;
  /** What the screens show about it afterwards */
  summary: Summary;
  phase: "sending" | "unanswered" | "uncertain" | "accepted";
  accepted?: Accepted;
  messages?: ApiMessage[];
};

const storageKey = (flow: string) => `montra.factoring.attempt.${flow}`;

export function loadAttempt<Request, Summary, Accepted>(flow: string): Attempt<Request, Summary, Accepted> | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey(flow)) ?? "null") as Attempt<Request, Summary, Accepted> | null;
    return saved && typeof saved.correlationId === "string" && saved.request && saved.summary ? saved : null;
  } catch {
    return null;
  }
}

export function saveAttempt(flow: string, attempt: unknown): void {
  try {
    sessionStorage.setItem(storageKey(flow), JSON.stringify(attempt));
  } catch {
    // Without storage the attempt is still kept while the page is open
  }
}

export function clearAttempt(flow: string): void {
  try {
    sessionStorage.removeItem(storageKey(flow));
  } catch {
    // Nothing to clear
  }
}
