import { useRef, useState } from "react";
import { newId } from "@platform/utils/newId";
import { isDefiniteRefusal } from "../model/problems";
import { clearAttempt, loadAttempt, saveAttempt, type ApiMessage, type Attempt, type Outcome } from "../model/submission";

// One request or advance, with its correlationId, from the press of the button to its outcome.
//
//   idle → sending → accepted
//                  → no answer: unanswered → sending (SAME correlationId and body)
//                  → uncertain (no retry; the user checks the list)
//                  → definite failure: idle, with `failure` (NEW correlationId next time)
//
// The attempt is saved before it is sent, so a page reload resumes it instead of starting another.

export type SubmissionPhase = "idle" | Attempt<unknown, unknown, unknown>["phase"];

export type SubmissionFailure = { kind: "refused"; messages: ApiMessage[] } | { kind: "rejected"; error: unknown };

type Config<Request, Answer, Accepted> = {
  flow: string;
  /** The POST, resolving to its answer and rejecting with the RTK Query error */
  post: (contractId: string, body: Request & { correlationId: string }) => Promise<Answer>;
  classify: (answer: Answer) => Outcome<Accepted>;
};

type State<Request, Summary, Accepted> = {
  phase: SubmissionPhase;
  attempt: Attempt<Request, Summary, Accepted> | null;
  failure: SubmissionFailure | null;
  /** Sending again after no answer */
  retrying: boolean;
  /** Why the last try got no definite answer */
  lastError: unknown;
};

function resume<Request, Summary, Accepted>(flow: string): State<Request, Summary, Accepted> {
  const saved = loadAttempt<Request, Summary, Accepted>(flow);
  const idle = { failure: null, retrying: false, lastError: null };
  if (!saved) return { ...idle, phase: "idle", attempt: null };
  // Closed while waiting for the answer: as good as a network error
  const phase = saved.phase === "sending" ? "unanswered" : saved.phase;
  return { ...idle, phase, attempt: { ...saved, phase } };
}

export function useSubmission<Request, Answer, Summary, Accepted>({ flow, post, classify }: Config<Request, Answer, Accepted>) {
  const [state, setState] = useState<State<Request, Summary, Accepted>>(() => resume(flow));
  // Set synchronously: two clicks in the same tick must send one request
  const sendingNow = useRef(false);

  const run = async (attempt: Attempt<Request, Summary, Accepted>, retrying: boolean) => {
    const sending = { ...attempt, phase: "sending" as const };
    saveAttempt(flow, sending);
    setState({ phase: "sending", attempt: sending, failure: null, retrying, lastError: null });
    const settle = (next: Attempt<Request, Summary, Accepted>, lastError: unknown = null) => {
      saveAttempt(flow, next);
      setState({ phase: next.phase, attempt: next, failure: null, retrying: false, lastError });
    };
    const fail = (failure: SubmissionFailure) => {
      clearAttempt(flow);
      setState({ phase: "idle", attempt: null, failure, retrying: false, lastError: null });
    };
    try {
      const answer = await post(attempt.contractId, { ...attempt.request, correlationId: attempt.correlationId });
      const outcome = classify(answer);
      if (outcome.kind === "refused") fail({ kind: "refused", messages: outcome.messages });
      else if (outcome.kind === "uncertain") settle({ ...sending, phase: "uncertain", messages: outcome.messages });
      else settle({ ...sending, phase: "accepted", accepted: outcome.accepted, messages: outcome.messages });
    } catch (error) {
      if (isDefiniteRefusal(error)) fail({ kind: "rejected", error });
      else settle({ ...sending, phase: "unanswered" }, error);
    } finally {
      sendingNow.current = false;
    }
  };

  return {
    ...state,
    /** A press of the button: a new correlationId, valid until this attempt has a definite outcome */
    submit: (contractId: string, request: Request, summary: Summary) => {
      if (sendingNow.current || state.phase !== "idle") return;
      sendingNow.current = true;
      void run({ correlationId: newId(), contractId, request, summary, phase: "sending" }, false);
    },
    /** After no answer: the same correlationId and the same body */
    retry: () => {
      if (sendingNow.current || state.phase !== "unanswered" || !state.attempt) return;
      sendingNow.current = true;
      void run(state.attempt, true);
    },
    /** The user has seen the outcome (or checked the list): the next submission is a new attempt */
    finish: () => {
      clearAttempt(flow);
      setState({ phase: "idle", attempt: null, failure: null, retrying: false, lastError: null });
    },
  };
}
