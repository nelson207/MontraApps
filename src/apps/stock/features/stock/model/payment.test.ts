import { describe, expect, it } from "vitest";
import { formatMoney } from "./format";
import {
  classifyPostResult,
  classifyStatus,
  findAccount,
  pollPayment,
  POLL_INTERVAL_MS,
  POLL_TIMEOUT_MS,
  sumOfAmounts,
  validatePaymentForm,
  verifyPayment,
  type PaymentSummary,
} from "./payment";
import { isDefiniteRefusal } from "./problems";

const MESSAGES = [{ severity: "Error", text: "Existe variação de Capital após a data..." }];

describe("sumOfAmounts", () => {
  it("adds in cents", () => expect(sumOfAmounts([{ amount: 0.1 }, { amount: 0.2 }])).toBe(0.3));
  it("has no sum without units", () => expect(sumOfAmounts([])).toBeNull());
  it("doesn't take a missing amount as 0", () => expect(sumOfAmounts([{ amount: 100 }, { amount: null }])).toBeNull());
});

describe("validatePaymentForm", () => {
  const valid = { accountId: "a", valueDate: "2020-01-01", amount: 10, endReasonId: 0, stockCount: 1 };

  it("doesn't restrict the value date, and an end reason of id 0 counts", () => expect(validatePaymentForm(valid)).toEqual({}));

  it("requires every field", () =>
    expect(Object.keys(validatePaymentForm({ accountId: null, valueDate: "", amount: null, endReasonId: null, stockCount: 0 })).sort()).toEqual([
      "account",
      "amount",
      "endReason",
      "stocks",
      "valueDate",
    ]));
});

describe("classifyPostResult", () => {
  it("isUncertain wins, even with isStarted", () => {
    expect(classifyPostResult({ isUncertain: true, isStarted: false, messages: MESSAGES })).toEqual({ kind: "uncertain", messages: MESSAGES });
    expect(classifyPostResult({ isUncertain: true, isStarted: true, paymentId: "p" }).kind).toBe("uncertain");
  });

  it("isStarted: false means nothing was paid", () => expect(classifyPostResult({ isStarted: false, isUncertain: false, messages: MESSAGES })).toEqual({ kind: "refused", messages: MESSAGES }));

  it("isStarted: true follows the payment", () => expect(classifyPostResult({ isStarted: true, isUncertain: false, paymentId: "AQ/p" })).toMatchObject({ kind: "started", paymentId: "AQ/p" }));

  it("what can't be followed or isn't understood is never 'nothing was paid'", () => {
    expect(classifyPostResult({ isStarted: true, paymentId: null }).kind).toBe("uncertain");
    expect(classifyPostResult({}).kind).toBe("uncertain");
    expect(classifyPostResult(null).kind).toBe("uncertain");
  });
});

describe("isDefiniteRefusal (a new correlationId) or not (the same one)", () => {
  it.each([400, 403, 404, 409, 422])("%i: refused", (status) => expect(isDefiniteRefusal({ status, data: {} })).toBe(true));

  it.each([[401], [408], [500], [502], [503], ["FETCH_ERROR"], ["TIMEOUT_ERROR"], ["PARSING_ERROR"]])("%s: the outcome isn't known", (status) =>
    expect(isDefiniteRefusal({ status })).toBe(false),
  );
});

describe("classifyStatus", () => {
  it("isSuccessful means nothing until isFinished", () => expect(classifyStatus({ isFinished: false, isSuccessful: false }).kind).toBe("running"));
  it("a finished batch that failed", () => expect(classifyStatus({ isFinished: true, isSuccessful: false, messages: MESSAGES })).toEqual({ kind: "failed", messages: MESSAGES }));
  it("a successful batch has only ended, whatever stocksPaid says", () => expect(classifyStatus({ isFinished: true, isSuccessful: true, stocksPaid: null, stocksInError: null }).kind).toBe("ended"));
});

describe("pollPayment", () => {
  const clock = () => {
    let time = 1_000;
    const sleeps: number[] = [];
    return {
      now: () => time,
      sleep: async (ms: number) => {
        sleeps.push(ms);
        time += ms;
      },
      sleeps,
    };
  };

  it("reads every 2 seconds until the batch finishes", async () => {
    const { now, sleep, sleeps } = clock();
    const answers = [{ isFinished: false, isSuccessful: false }, { isFinished: false, isSuccessful: false }, { isFinished: true, isSuccessful: true }];
    const result = await pollPayment({ getStatus: async () => answers.shift() ?? null, sleep, now, isCancelled: () => false });
    expect(result).toMatchObject({ kind: "finished", outcome: { kind: "ended" } });
    expect(sleeps).toEqual([POLL_INTERVAL_MS, POLL_INTERVAL_MS, POLL_INTERVAL_MS]);
  });

  it("a failed read isn't a failed payment", async () => {
    const { now, sleep } = clock();
    const answers = [null, null, { isFinished: true, isSuccessful: false }];
    const result = await pollPayment({ getStatus: async () => answers.shift() ?? null, sleep, now, isCancelled: () => false });
    expect(result).toMatchObject({ kind: "finished", outcome: { kind: "failed" } });
  });

  it("gives up after 2 minutes", async () => {
    const { now, sleep, sleeps } = clock();
    const result = await pollPayment({ getStatus: async () => ({ isFinished: false }), sleep, now, isCancelled: () => false });
    expect(result).toEqual({ kind: "timeout" });
    expect(sleeps).toHaveLength(POLL_TIMEOUT_MS / POLL_INTERVAL_MS);
  });

  it("stops when the page is left", async () => {
    const { now, sleep } = clock();
    expect(await pollPayment({ getStatus: async () => null, sleep, now, isCancelled: () => true })).toEqual({ kind: "cancelled" });
  });
});

describe("verifyPayment: only a real change is 'paid'", () => {
  const summary: PaymentSummary = {
    stocks: [{ id: "u1", label: "#1", state: "Activate", amount: 100, currencyId: "EUR" }],
    account: { id: "a", number: 7, relation: null },
    amount: 100,
    currencyId: "EUR",
    valueDate: "2026-01-01",
    endReasonName: "x",
    allowPartialPayment: false,
  };
  const attempt = { summary, baselineBalance: 500 };

  it("the unit changed state", () => expect(verifyPayment(attempt, { units: { u1: "Terminate" }, balance: 500 }).verdict).toBe("paid"));
  it("the balance changed", () => expect(verifyPayment(attempt, { units: { u1: "Activate" }, balance: 400 }).verdict).toBe("paid"));
  it("nothing changed", () => expect(verifyPayment(attempt, { units: { u1: "Activate" }, balance: 500 }).verdict).toBe("no_change"));
  it("a unit that couldn't be read", () => expect(verifyPayment(attempt, { units: {}, balance: 500 }).verdict).toBe("unreadable"));
  it("an account that couldn't be read", () => expect(verifyPayment(attempt, { units: { u1: "Activate" }, balance: undefined }).verdict).toBe("unreadable"));
  it("a state that became null isn't a change", () => expect(verifyPayment(attempt, { units: { u1: null }, balance: 500 }).verdict).toBe("no_change"));
  it("a balance that became null isn't a change", () => expect(verifyPayment(attempt, { units: { u1: "Activate" }, balance: null }).verdict).toBe("no_change"));
  it("a balance unknown before can't be compared", () => expect(verifyPayment({ summary, baselineBalance: null }, { units: { u1: "Activate" }, balance: 400 }).verdict).toBe("no_change"));
  it("a real change counts even if something else couldn't be read", () => expect(verifyPayment(attempt, { units: { u1: "Sold" }, balance: undefined }).verdict).toBe("paid"));
});

describe("findAccount", () => {
  it("by id, then by number", () => {
    const accounts = [{ id: "x", number: 7 }, { id: "a", number: 8 }];
    expect(findAccount(accounts, { id: "a", number: 8, relation: null })?.number).toBe(8);
    expect(findAccount(accounts, { id: "other", number: 7, relation: null })?.id).toBe("x");
    expect(findAccount(accounts, { id: "other", number: null, relation: null })).toBeUndefined();
  });
});

describe("formatMoney", () => {
  it("uses the record's currency and the locale", () => {
    expect(formatMoney(1234.5, "USD", "en")).toBe("$1,234.50");
    expect(formatMoney(1234.5, "EUR", "pt-PT")).toMatch(/1234,50|1\s?234,50/);
  });
  it("0 is an amount; null isn't", () => {
    expect(formatMoney(0, "EUR", "en")).toBe("€0.00");
    expect(formatMoney(null, "EUR", "en")).toBeNull();
  });
  it("copes with a currency Intl can't read", () => expect(formatMoney(5, "NOT-A-CODE", "en")).toBe("5.00 NOT-A-CODE"));
});
