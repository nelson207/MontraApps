export type StepperState = "current" | "error" | "done" | "todo";

/**
 * How the stepper shows each step: the current one; one with errors showing; done (✓) when it
 * was reached and its mandatory fields are filled; otherwise its number. `complete` (reached and
 * valid, the current step included) fills the line to the next step.
 */
export function stepperStates<Id extends string>(
  ids: Id[],
  {
    current,
    maxVisited,
    invalid,
    shownErrors,
  }: {
    current: number;
    /** Highest step index reached */
    maxVisited: number;
    /** Steps whose mandatory fields aren't all valid */
    invalid: readonly Id[];
    /** Steps whose errors are showing (after Next / Save) */
    shownErrors: readonly Id[];
  },
): { state: StepperState; complete: boolean }[] {
  return ids.map((id, index) => {
    const complete = index <= maxVisited && !invalid.includes(id);
    const state: StepperState =
      index === current ? "current" : shownErrors.includes(id) ? "error" : complete ? "done" : "todo";
    return { state, complete };
  });
}
