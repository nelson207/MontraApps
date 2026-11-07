// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useWizard, type WizardStep } from "./useWizard";

type Id = "a" | "b" | "c";
const step = (id: Id): WizardStep<Id> => ({ id, label: id });
const ALL = [step("a"), step("b"), step("c")];

type Props = { steps?: WizardStep<Id>[]; invalid?: Id[]; first?: Id; whenGone?: (id: Id) => Id | undefined };

const setup = (initial: Props = {}) =>
  renderHook((props: Props) => useWizard<Id>({ steps: props.steps ?? ALL, invalid: props.invalid ?? [], first: props.first, whenGone: props.whenGone }), { initialProps: initial });

afterEach(cleanup);

describe("useWizard", () => {
  it("Next moves on when the step is valid", () => {
    const { result } = setup();
    act(() => result.current.next());
    expect(result.current.step.id).toBe("b");
    expect(result.current.isFirst).toBe(false);
  });

  it("Next on an invalid step stays, and only then shows its errors", () => {
    const { result } = setup({ invalid: ["a"] });
    expect(result.current.showsErrors("a")).toBe(false);
    act(() => result.current.next());
    expect(result.current.step.id).toBe("a");
    expect(result.current.showsErrors("a")).toBe(true);
    expect(result.current.stepper.invalid).toEqual(["a"]);
  });

  it("what a step waits for keeps it there", () => {
    const { result } = setup();
    act(() => result.current.next(() => false));
    expect(result.current.step.id).toBe("a");
  });

  it("advance moves on once the choice is applied, not before", () => {
    const { result, rerender } = setup({ invalid: ["a"] });
    act(() => {
      result.current.advance();
      rerender({ invalid: [] });
    });
    expect(result.current.step.id).toBe("b");
  });

  it("advance stays when the choice leaves the step invalid", () => {
    const { result } = setup({ invalid: ["a"] });
    act(() => result.current.advance());
    expect(result.current.step.id).toBe("a");
    expect(result.current.showsErrors("a")).toBe(false);
  });

  it("goes back without losing the steps already reached", () => {
    const { result } = setup();
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.goTo("a"));
    expect(result.current.stepper.maxVisited).toBe(2);
    expect(result.current.index).toBe(0);
  });

  it("can start further on, with the earlier steps reachable", () => {
    const { result } = setup({ first: "b" });
    expect(result.current.step.id).toBe("b");
    act(() => result.current.back());
    expect(result.current.step.id).toBe("a");
  });

  it("a step that went away falls back as told, and comes back with it", () => {
    const { result, rerender } = setup({ first: "b", whenGone: () => "c" });
    rerender({ first: "b", whenGone: () => "c", steps: [step("a"), step("c")] });
    expect(result.current.step.id).toBe("c");
    rerender({ first: "b", whenGone: () => "c", steps: ALL });
    expect(result.current.step.id).toBe("b");
  });

  it("the final check shows every error and goes to the first problem", () => {
    const { result } = setup({ first: "c", invalid: ["b", "c"] });
    let valid = true;
    act(() => {
      valid = result.current.validateAll();
    });
    expect(valid).toBe(false);
    expect(result.current.step.id).toBe("b");
    expect(result.current.showsErrors("c")).toBe(true);
  });

  it("the final check passes when everything is valid", () => {
    const { result } = setup({ first: "c" });
    let valid = false;
    act(() => {
      valid = result.current.validateAll();
    });
    expect(valid).toBe(true);
    expect(result.current.step.id).toBe("c");
  });
});
