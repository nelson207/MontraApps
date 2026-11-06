import type {
  CalculationMessageDto,
  NewStockPaymentDto,
  StockNettingAccountDto,
  StockPaymentResultDto,
  StockPaymentStatusDto,
  StockUnitListItemDto,
} from "@platform/api/generated/MontraPOSApi";
import { tx } from "../stockText";

// The rules of paying stocks, free of React. This moves real money, so what counts as a definite
// outcome is decided here, in one place, and tested on its own (payment.test.ts).

export const POLL_INTERVAL_MS = 2_000;
export const POLL_TIMEOUT_MS = 120_000;

export type ApiMessage = CalculationMessageDto;

/** What the confirmation (and the result) shows */
export type PaymentSummary = {
  stocks: { id: string; label: string; state: string | null; amount: number | null; currencyId: string | null }[];
  account: { id: string; number: number | null; relation: string | null };
  amount: number;
  currencyId: string | null;
  valueDate: string;
  endReasonName: string;
  allowPartialPayment: boolean;
};

export type PaymentRequest = Omit<NewStockPaymentDto, "correlationId">;

/**
 * One payment attempt, kept until it has a definite outcome, also across a page reload: reopening
 * the page mustn't make a new correlationId for a payment that may have been sent.
 */
export type PaymentAttempt = {
  correlationId: string;
  request: PaymentRequest;
  summary: PaymentSummary;
  /** The account's balance read when the confirmation opened: null when it couldn't be read */
  baselineBalance: number | null;
  phase: "sending" | "unanswered" | "uncertain" | "processing" | "verifying";
  paymentId?: string;
  messages?: ApiMessage[];
};

/** Rounded to cents, so 0.1 + 0.2 isn't 0.30000000000000004; null when an amount is missing (a guess would move money) */
export function sumOfAmounts(units: Pick<StockUnitListItemDto, "amount">[]): number | null {
  if (units.length === 0 || units.some((unit) => unit.amount === null || unit.amount === undefined)) return null;
  return units.reduce((cents, unit) => cents + Math.round((unit.amount as number) * 100), 0) / 100;
}

export type PaymentForm = {
  accountId: string | null;
  valueDate: string;
  amount: number | null;
  endReasonId: number | null;
  stockCount: number;
};

export type PaymentErrors = Partial<Record<"stocks" | "account" | "valueDate" | "amount" | "endReason", string>>;

/** Required fields only. The value date isn't restricted and the amount isn't capped: Accipiens decides. */
export function validatePaymentForm(form: PaymentForm): PaymentErrors {
  const errors: PaymentErrors = {};
  if (form.stockCount === 0) errors.stocks = tx("validation.stocks", "Select at least one active stock.");
  if (!form.accountId) errors.account = tx("validation.account", "Select the netting account.");
  if (!form.valueDate) errors.valueDate = tx("validation.valueDate", "Enter the value date.");
  if (form.amount === null || !(form.amount > 0)) errors.amount = tx("validation.amount", "Enter an amount above zero.");
  if (form.endReasonId === null) errors.endReason = tx("validation.endReason", "Select the end reason.");
  return errors;
}

export type PostOutcome =
  | { kind: "uncertain"; messages: ApiMessage[] }
  | { kind: "refused"; messages: ApiMessage[] }
  | { kind: "started"; paymentId: string; messages: ApiMessage[] };

/**
 * The answer to POST /payments. isUncertain wins over everything; only an explicit isStarted: false
 * means nothing was paid. Anything else that can't be followed by its paymentId is uncertain too.
 */
export function classifyPostResult(result: StockPaymentResultDto | null | undefined): PostOutcome {
  const messages = result?.messages ?? [];
  if (!result || result.isUncertain) return { kind: "uncertain", messages };
  if (result.isStarted === false) return { kind: "refused", messages };
  if (result.isStarted === true && result.paymentId) return { kind: "started", paymentId: result.paymentId, messages };
  return { kind: "uncertain", messages };
}

export type StatusOutcome = { kind: "running" } | { kind: "failed"; messages: ApiMessage[] } | { kind: "ended"; messages: ApiMessage[] };

/** isSuccessful means nothing until isFinished. "ended" doesn't prove payment: see verifyPayment. */
export function classifyStatus(status: StockPaymentStatusDto): StatusOutcome {
  if (status.isFinished !== true) return { kind: "running" };
  const messages = status.messages ?? [];
  return status.isSuccessful === false ? { kind: "failed", messages } : { kind: "ended", messages };
}

type PollDeps = {
  /** Null when this read failed: a failed read isn't a failed payment, so polling goes on */
  getStatus: () => Promise<StockPaymentStatusDto | null>;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  isCancelled: () => boolean;
};

export type PollResult = { kind: "finished"; outcome: Exclude<StatusOutcome, { kind: "running" }> } | { kind: "timeout" } | { kind: "cancelled" };

/** One read every 2 seconds (never overlapping), for up to 2 minutes */
export async function pollPayment({ getStatus, sleep, now, isCancelled }: PollDeps): Promise<PollResult> {
  const deadline = now() + POLL_TIMEOUT_MS;
  while (now() + POLL_INTERVAL_MS <= deadline) {
    await sleep(POLL_INTERVAL_MS);
    if (isCancelled()) return { kind: "cancelled" };
    const status = await getStatus();
    if (isCancelled()) return { kind: "cancelled" };
    if (status) {
      const outcome = classifyStatus(status);
      if (outcome.kind !== "running") return { kind: "finished", outcome };
    }
  }
  return { kind: "timeout" };
}

export type UnitReading = { id: string; label: string; before: string | null; after: string | null | undefined; changed: boolean };

export type Verification = {
  verdict: "paid" | "no_change" | "unreadable";
  units: UnitReading[];
  balanceBefore: number | null;
  /** undefined: it couldn't be read */
  balanceAfter: number | null | undefined;
  balanceChanged: boolean;
  messages: ApiMessage[];
};

/**
 * What the unit and the account say after a batch that ended without errors. Only a real change
 * counts: a unit in another known state or a different balance. A value that can't be read is never
 * a change, so a failed reload can't turn into "paid".
 */
export function verifyPayment(
  attempt: Pick<PaymentAttempt, "summary" | "baselineBalance">,
  reloaded: { units: Record<string, string | null | undefined>; balance: number | null | undefined },
  messages: ApiMessage[] = [],
): Verification {
  const units = attempt.summary.stocks.map(({ id, label, state }) => {
    const after = reloaded.units[id];
    return { id, label, before: state, after, changed: !!after && after !== state };
  });
  const { baselineBalance: before } = attempt;
  const after = reloaded.balance;
  const balanceChanged = before !== null && after !== null && after !== undefined && after !== before;
  const unreadable = units.some((unit) => unit.after === undefined) || after === undefined;
  const verdict = units.some((unit) => unit.changed) || balanceChanged ? "paid" : unreadable ? "unreadable" : "no_change";
  return { verdict, units, balanceBefore: before, balanceAfter: after, balanceChanged, messages };
}

/** The account in a fresh read. Ids are opaque tokens, so its number is the fallback if a token differs. */
export const findAccount = (accounts: StockNettingAccountDto[] | undefined, account: PaymentSummary["account"]) =>
  accounts?.find((a) => a.id === account.id) ?? accounts?.find((a) => account.number !== null && a.number === account.number);

const storageKey = (contractId: string) => `montra.stock.paymentAttempt.${contractId}`;

export function loadAttempt(contractId: string): PaymentAttempt | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey(contractId)) ?? "null") as PaymentAttempt | null;
    return saved && typeof saved.correlationId === "string" && saved.summary && saved.request ? saved : null;
  } catch {
    return null;
  }
}

export function saveAttempt(contractId: string, attempt: PaymentAttempt): void {
  try {
    sessionStorage.setItem(storageKey(contractId), JSON.stringify(attempt));
  } catch {
    // Without storage the attempt is still kept while the page is open
  }
}

export function clearAttempt(contractId: string): void {
  try {
    sessionStorage.removeItem(storageKey(contractId));
  } catch {
    // Nothing to clear
  }
}
