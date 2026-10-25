import { describe, expect, it } from "vitest";
import { stepperStates } from "./stepperStates";

const ids = ["business", "customer", "financial", "interventions"] as const;

describe("stepperStates", () => {
  it("marks only reached steps whose mandatory fields are filled as complete", () => {
    // Business current and valid, Customer reached but incomplete, Financial reached and valid
    const states = stepperStates([...ids], {
      current: 0,
      maxVisited: 2,
      invalid: ["customer"],
      shownErrors: [],
    });
    expect(states.map((s) => s.state)).toEqual(["current", "todo", "done", "todo"]);
    expect(states.map((s) => s.complete)).toEqual([true, false, true, false]);
  });

  it("keeps the number on a step not reached yet, even with nothing mandatory", () => {
    const states = stepperStates([...ids], { current: 1, maxVisited: 1, invalid: [], shownErrors: [] });
    expect(states[3]).toEqual({ state: "todo", complete: false });
  });

  it("shows errors that are showing, and an errored step is not complete", () => {
    const states = stepperStates([...ids], {
      current: 2,
      maxVisited: 2,
      invalid: ["customer"],
      shownErrors: ["customer"],
    });
    expect(states[1]).toEqual({ state: "error", complete: false });
  });

  it("the current step is complete when valid, so the line after it fills", () => {
    const states = stepperStates([...ids], { current: 0, maxVisited: 0, invalid: [], shownErrors: [] });
    expect(states[0]).toEqual({ state: "current", complete: true });
  });
});
