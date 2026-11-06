/**
 * A request sent `delay` ms after the last `schedule` (typing stopped), or at once on `flush`
 * (e.g. the field lost focus), of which only the latest answer counts: an answer to an earlier
 * request, or to one that a newer `schedule` has overtaken, is dropped, whatever order the answers
 * arrive in.
 */
export function latestDebounced<A, R>(
  run: (arg: A) => Promise<R>,
  handlers: { onResult: (result: R, arg: A) => void; onError?: (error: unknown, arg: A) => void },
  delay = 400,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: { arg: A } | undefined;
  /** The request whose answer counts; bumped by every newer request or schedule */
  let latest = 0;

  const stopTimer = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  const flush = () => {
    stopTimer();
    if (!pending) return;
    const { arg } = pending;
    pending = undefined;
    const ticket = ++latest;
    run(arg).then(
      (result) => {
        if (ticket === latest) handlers.onResult(result, arg);
      },
      (error: unknown) => {
        if (ticket === latest) handlers.onError?.(error, arg);
      },
    );
  };

  return {
    /** Asks for `arg` once typing stops; an answer still on its way no longer counts */
    schedule(arg: A) {
      pending = { arg };
      latest += 1;
      stopTimer();
      timer = setTimeout(flush, delay);
    },
    /** Sends what's scheduled now, if anything */
    flush,
    /** Drops what's scheduled and any answer on its way */
    cancel() {
      stopTimer();
      pending = undefined;
      latest += 1;
    },
  };
}
