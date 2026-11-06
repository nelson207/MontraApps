import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { latestDebounced } from "./latestDebounced";

/** A request whose answer the test releases when it wants (any order) */
function deferredRequests() {
  const pending: { arg: string; resolve: (value: string) => void; reject: (error: unknown) => void }[] = [];
  const run = vi.fn(
    (arg: string) =>
      new Promise<string>((resolve, reject) => {
        pending.push({ arg, resolve, reject });
      }),
  );
  return { run, pending };
}

describe("latestDebounced", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("asks once typing stops: only the last value, after the delay", async () => {
    const { run } = deferredRequests();
    const sync = latestDebounced(run, { onResult: vi.fn() }, 400);
    sync.schedule("1");
    await vi.advanceTimersByTimeAsync(300);
    sync.schedule("15");
    await vi.advanceTimersByTimeAsync(399);
    expect(run).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(run.mock.calls).toEqual([["15"]]);
  });

  it("leaving the field asks at once; nothing scheduled, nothing asked", async () => {
    const { run } = deferredRequests();
    const sync = latestDebounced(run, { onResult: vi.fn() }, 400);
    sync.flush();
    expect(run).not.toHaveBeenCalled();
    sync.schedule("20");
    sync.flush();
    expect(run.mock.calls).toEqual([["20"]]);
    await vi.advanceTimersByTimeAsync(400);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("an earlier answer arriving after a later one is dropped", async () => {
    const { run, pending } = deferredRequests();
    const onResult = vi.fn();
    const sync = latestDebounced(run, { onResult }, 400);
    sync.schedule("10");
    sync.flush();
    sync.schedule("25");
    sync.flush();

    pending[1].resolve("answer 25");
    await vi.runAllTimersAsync();
    pending[0].resolve("answer 10");
    await vi.runAllTimersAsync();
    expect(onResult.mock.calls).toEqual([["answer 25", "25"]]);
  });

  it("an answer still on its way when the user types again doesn't count", async () => {
    const { run, pending } = deferredRequests();
    const onResult = vi.fn();
    const sync = latestDebounced(run, { onResult }, 400);
    sync.schedule("10");
    sync.flush();
    // Typing again before the answer: it would overwrite what's being typed
    sync.schedule("100");
    pending[0].resolve("answer 10");
    await vi.advanceTimersByTimeAsync(0);
    expect(onResult).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(400);
    pending[1].resolve("answer 100");
    await vi.advanceTimersByTimeAsync(0);
    expect(onResult.mock.calls).toEqual([["answer 100", "100"]]);
  });

  it("only the latest request's failure is reported", async () => {
    const { run, pending } = deferredRequests();
    const onError = vi.fn();
    const sync = latestDebounced(run, { onResult: vi.fn(), onError }, 400);
    sync.schedule("1");
    sync.flush();
    sync.schedule("2");
    sync.flush();
    pending[0].reject(new Error("old"));
    pending[1].reject(new Error("new"));
    await vi.runAllTimersAsync();
    expect(onError.mock.calls.map(([error]) => (error as Error).message)).toEqual(["new"]);
  });

  it("cancel drops what's scheduled and any answer on its way", async () => {
    const { run, pending } = deferredRequests();
    const onResult = vi.fn();
    const sync = latestDebounced(run, { onResult }, 400);
    sync.schedule("1");
    sync.flush();
    sync.schedule("2");
    sync.cancel();
    pending[0].resolve("answer 1");
    await vi.runAllTimersAsync();
    expect(run).toHaveBeenCalledTimes(1);
    expect(onResult).not.toHaveBeenCalled();
  });
});
