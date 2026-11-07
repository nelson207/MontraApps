import { describe, expect, it, vi } from "vitest";
import { isDefiniteRefusal } from "./problems";
import { classifyAdvance, classifyBatch, classifyCession, classifyCounterparty, POLL_INTERVAL_MS, POLL_TIMEOUT_MS, pollBatch } from "./submission";

const messages = [{ severity: "Error", text: "From Accipiens" }];

describe("the answer to a new request", () => {
  it("isSubmitted true is accepted, also with no number yet", () =>
    expect(classifyCession({ isSubmitted: true, cessionId: "AQ/x", cessionNumber: null, messages: [] })).toEqual({
      kind: "accepted",
      accepted: { cessionId: "AQ/x", cessionNumber: null },
      messages: [],
    }));
  it("isSubmitted false is a refusal", () => expect(classifyCession({ isSubmitted: false, messages })).toEqual({ kind: "refused", messages }));
  it("isUncertain wins over everything", () => {
    expect(classifyCession({ isUncertain: true, isSubmitted: false, messages }).kind).toBe("uncertain");
    expect(classifyCession({ isUncertain: true, isSubmitted: true }).kind).toBe("uncertain");
  });
  it("an answer that says neither is uncertain, never a refusal", () => {
    expect(classifyCession({}).kind).toBe("uncertain");
    expect(classifyCession(null).kind).toBe("uncertain");
  });
});

describe("the answer to an advance", () => {
  it("isStarted true with a batch is followed", () =>
    expect(classifyAdvance({ isStarted: true, batchId: "AQ/b", advanceId: "AQ/a" })).toEqual({ kind: "accepted", accepted: { batchId: "AQ/b", advanceId: "AQ/a" }, messages: [] }));
  it("isStarted false is a refusal even with a batchId, which isn't followed", () =>
    expect(classifyAdvance({ isStarted: false, batchId: "AQ/b", messages })).toEqual({ kind: "refused", messages }));
  it("isUncertain wins, and started with no batch can't be followed", () => {
    expect(classifyAdvance({ isUncertain: true, isStarted: true, batchId: "AQ/b" }).kind).toBe("uncertain");
    expect(classifyAdvance({ isStarted: true }).kind).toBe("uncertain");
    expect(classifyAdvance(undefined).kind).toBe("uncertain");
  });
});

describe("the answer to adding a counterparty", () => {
  it.each([
    [{ isAdded: true }, "added"],
    [{ isAdded: false, messages }, "refused"],
    [{ isAdded: false, isUncertain: true }, "uncertain"],
    [{ isAdded: true, isUncertain: true }, "uncertain"],
    [{}, "uncertain"],
  ])("%j is %s", (answer, kind) => expect(classifyCounterparty(answer).kind).toBe(kind));
});

describe("a batch", () => {
  it("isSuccessful means nothing until isFinished", () => expect(classifyBatch({ isFinished: false, isSuccessful: true }).kind).toBe("running"));
  it("successful, waiting for the back office only when Initial", () => {
    expect(classifyBatch({ isFinished: true, isSuccessful: true, advanceStatus: "Initial" })).toEqual({ kind: "successful", waitsForBackOffice: true, messages: [] });
    expect(classifyBatch({ isFinished: true, isSuccessful: true, advanceStatus: "Active" })).toEqual({ kind: "successful", waitsForBackOffice: false, messages: [] });
  });
  it("result decides once finished, over isSuccessful", () => {
    expect(classifyBatch({ isFinished: true, isSuccessful: false, result: "Succeeded", advanceStatus: "Initial" })).toEqual({ kind: "successful", waitsForBackOffice: true, messages: [] });
    expect(classifyBatch({ isFinished: true, isSuccessful: true, result: "Failed", messages })).toEqual({ kind: "failed", messages });
    expect(classifyBatch({ isFinished: true, isSuccessful: true, result: "Unknown", messages })).toEqual({ kind: "unconfirmed", messages });
    expect(classifyBatch({ isFinished: true, isSuccessful: true, result: "Running" }).kind).toBe("running");
    expect(classifyBatch({ isFinished: false, result: "Failed" }).kind).toBe("running");
  });
  it("finished without success isn't confirmed, with its messages", () => expect(classifyBatch({ isFinished: true, isSuccessful: false, messages })).toEqual({ kind: "unconfirmed", messages }));
});

describe("polling", () => {
  const clock = () => {
    let time = 0;
    return { now: () => time, sleep: vi.fn(async (ms: number) => void (time += ms)) };
  };

  it("reads every 2 seconds until the batch finishes", async () => {
    const { now, sleep } = clock();
    const getBatch = vi.fn().mockResolvedValueOnce({ isFinished: false }).mockResolvedValueOnce({ isFinished: true, isSuccessful: true });
    const result = await pollBatch({ getBatch, sleep, now, isCancelled: () => false });
    expect(result).toMatchObject({ kind: "finished", outcome: { kind: "successful" } });
    expect(getBatch).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(POLL_INTERVAL_MS);
  });

  it("a failed read isn't a failed advance: it goes on", async () => {
    const { now, sleep } = clock();
    const getBatch = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ isFinished: true, isSuccessful: true });
    expect((await pollBatch({ getBatch, sleep, now, isCancelled: () => false })).kind).toBe("finished");
    expect(getBatch).toHaveBeenCalledTimes(2);
  });

  it("stops after 2 minutes with a timeout, not a failure", async () => {
    const { now, sleep } = clock();
    const getBatch = vi.fn().mockResolvedValue({ isFinished: false });
    expect(await pollBatch({ getBatch, sleep, now, isCancelled: () => false })).toEqual({ kind: "timeout" });
    expect(getBatch).toHaveBeenCalledTimes(POLL_TIMEOUT_MS / POLL_INTERVAL_MS);
  });

  it("stops reading when cancelled", async () => {
    const { now, sleep } = clock();
    const getBatch = vi.fn();
    expect(await pollBatch({ getBatch, sleep, now, isCancelled: () => true })).toEqual({ kind: "cancelled" });
    expect(getBatch).not.toHaveBeenCalled();
  });
});

describe("what makes a next try a new attempt", () => {
  it.each([400, 403, 404, 409, 429])("%i is a definite refusal", (status) => expect(isDefiniteRefusal({ status })).toBe(true));
  it.each([401, 408, 500, 502, 503, "FETCH_ERROR", "TIMEOUT_ERROR", "PARSING_ERROR"])("%s says nothing about the outcome", (status) => expect(isDefiniteRefusal({ status })).toBe(false));
});
