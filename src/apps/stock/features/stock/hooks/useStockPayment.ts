import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "@platform/app/store";
import { newId } from "@platform/utils/newId";
import { readNettingAccounts, readPaymentStatus, readStockUnit, stockApi } from "../api/stockApi";
import {
  classifyPostResult,
  clearAttempt,
  findAccount,
  loadAttempt,
  pollPayment,
  saveAttempt,
  verifyPayment,
  type ApiMessage,
  type PaymentAttempt,
  type PaymentRequest,
  type PaymentSummary,
  type Verification,
} from "../model/payment";
import { isDefiniteRefusal } from "../model/problems";

// One payment, from the confirmation to what the unit and the account say afterwards.
//
//   idle → confirming → sending → started: processing → verifying → verified
//                                         (→ stillProcessing when the 2 minutes run out)
//                               → no answer: unanswered → sending (SAME correlationId)
//                               → uncertain (no retry; the user checks with the back office)
//                               → definite failure: idle, with `failure` (NEW correlationId next time)
//
// The attempt is saved before it is sent, so a page reload resumes it instead of starting another.

export type PaymentPhase = "idle" | "confirming" | PaymentAttempt["phase"] | "stillProcessing" | "verified";

export type PaymentFailure = { kind: "refused" | "batchFailed" | "rejected"; messages: ApiMessage[]; error?: unknown };

/** A confirmation not sent yet: closing it costs nothing */
type Draft = Omit<PaymentAttempt, "phase"> & { phase: "confirming" };

type State = {
  phase: PaymentPhase;
  attempt: PaymentAttempt | Draft | null;
  /** The confirmation is reading the account's balance, to compare with afterwards */
  preparing: boolean;
  failure: PaymentFailure | null;
  /** Why the last try got no definite answer */
  lastError: unknown;
  verification: Verification | null;
};

const IDLE: State = { phase: "idle", attempt: null, preparing: false, failure: null, lastError: null, verification: null };

function resume(contractId: string): State {
  const attempt = loadAttempt(contractId);
  if (!attempt) return IDLE;
  // Closed while waiting for the answer: as good as a network error
  const phase = attempt.phase === "sending" ? "unanswered" : attempt.phase;
  return { ...IDLE, phase, attempt: { ...attempt, phase } };
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function useStockPayment(contractId: string) {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<State>(() => resume(contractId));
  // Set synchronously: two clicks in the same tick must send one payment
  const sendingNow = useRef(false);

  const { phase, attempt } = state;
  const paymentId = attempt?.paymentId;

  /** A new correlationId, valid until the attempt has a definite outcome */
  const open = async (request: PaymentRequest, summary: PaymentSummary) => {
    const correlationId = newId();
    const draft: Draft = { correlationId, request, summary, baselineBalance: null, phase: "confirming" };
    setState({ ...IDLE, phase: "confirming", attempt: draft, preparing: true });
    const accounts = await dispatch(readNettingAccounts(contractId));
    const balance = findAccount(accounts.data, summary.account)?.totalCapital ?? null;
    setState((s) =>
      s.attempt?.correlationId === correlationId && s.phase === "confirming"
        ? { ...s, preparing: false, attempt: { ...s.attempt, baselineBalance: balance } }
        : s,
    );
  };

  /** Back to the form, before anything was sent */
  const cancel = () => {
    if (phase === "confirming") setState(IDLE);
  };

  /** The first send and every repeat after no answer: always this attempt's correlationId and body */
  const send = async () => {
    if (sendingNow.current || !attempt || (phase !== "confirming" && phase !== "unanswered")) return;
    sendingNow.current = true;
    const sending: PaymentAttempt = { ...attempt, phase: "sending" };
    saveAttempt(contractId, sending);
    setState((s) => ({ ...s, phase: "sending", attempt: sending, lastError: null }));
    try {
      const { correlationId, request } = sending;
      const result = await dispatch(stockApi.endpoints.payStocks.initiate({ correlationId, ...request })).unwrap();
      const outcome = classifyPostResult(result);
      if (outcome.kind === "refused") {
        clearAttempt(contractId);
        setState({ ...IDLE, failure: { kind: "refused", messages: outcome.messages } });
      } else if (outcome.kind === "uncertain") {
        const uncertain: PaymentAttempt = { ...sending, phase: "uncertain", messages: outcome.messages };
        saveAttempt(contractId, uncertain);
        setState({ ...IDLE, phase: "uncertain", attempt: uncertain });
      } else {
        const processing: PaymentAttempt = { ...sending, phase: "processing", paymentId: outcome.paymentId, messages: outcome.messages };
        saveAttempt(contractId, processing);
        setState({ ...IDLE, phase: "processing", attempt: processing });
      }
    } catch (error) {
      if (isDefiniteRefusal(error)) {
        clearAttempt(contractId);
        setState({ ...IDLE, failure: { kind: "rejected", messages: [], error } });
      } else {
        const unanswered: PaymentAttempt = { ...sending, phase: "unanswered" };
        saveAttempt(contractId, unanswered);
        setState({ ...IDLE, phase: "unanswered", attempt: unanswered, lastError: error });
      }
    } finally {
      sendingNow.current = false;
    }
  };

  // Follow the batch. A status read that fails isn't a failed payment: polling goes on.
  useEffect(() => {
    if (phase !== "processing" || !paymentId) return;
    let cancelled = false;
    void pollPayment({
      getStatus: async () => (await dispatch(readPaymentStatus(paymentId))).data ?? null,
      sleep,
      now: Date.now,
      isCancelled: () => cancelled,
    }).then((result) => {
      if (result.kind === "cancelled") return;
      if (result.kind === "timeout") {
        setState((s) => ({ ...s, phase: "stillProcessing" }));
      } else if (result.outcome.kind === "failed") {
        clearAttempt(contractId);
        setState({ ...IDLE, failure: { kind: "batchFailed", messages: result.outcome.messages } });
      } else {
        const verifying: PaymentAttempt = { ...(attempt as PaymentAttempt), phase: "verifying", messages: result.outcome.messages };
        saveAttempt(contractId, verifying);
        setState((s) => ({ ...s, phase: "verifying", attempt: verifying }));
      }
    });
    return () => {
      cancelled = true;
    };
    // Follows once per entry into the phase; the attempt doesn't change during it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paymentId, contractId, dispatch]);

  // An ended batch proves nothing: read the units and the account, and report what they say
  useEffect(() => {
    if (phase !== "verifying" || !attempt) return;
    let cancelled = false;
    const { summary } = attempt;
    void (async () => {
      const [units, accounts] = await Promise.all([
        Promise.all(summary.stocks.map(({ id }) => dispatch(readStockUnit(id)))),
        dispatch(readNettingAccounts(contractId)),
      ]);
      if (cancelled) return;
      const account = accounts.data ? findAccount(accounts.data, summary.account) : undefined;
      const verification = verifyPayment(
        attempt,
        {
          units: Object.fromEntries(summary.stocks.map(({ id }, i) => [id, units[i].data ? (units[i].data.state ?? null) : undefined])),
          balance: account ? (account.totalCapital ?? null) : undefined,
        },
        attempt.messages,
      );
      setState((s) => ({ ...s, phase: "verified", verification }));
    })();
    return () => {
      cancelled = true;
    };
    // Reads once per entry into the phase; the attempt doesn't change during it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, contractId, dispatch]);

  return {
    ...state,
    summary: attempt?.summary ?? null,
    messages: attempt?.messages ?? [],
    open,
    cancel,
    send,
    /** After "still processing": follow it for another 2 minutes */
    followAgain: () => setState((s) => (s.phase === "stillProcessing" ? { ...s, phase: "processing" } : s)),
    /** After "processed, no change yet": read the unit and the account again */
    verifyAgain: () => setState((s) => (s.phase === "verified" ? { ...s, phase: "verifying" } : s)),
    /** The user has seen the result (or checked with the back office): the next payment is a new attempt */
    finish: () => {
      clearAttempt(contractId);
      setState(IDLE);
    },
  };
}
