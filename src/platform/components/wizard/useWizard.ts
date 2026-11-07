import { useState } from "react";

export type WizardStep<Id extends string = string> = {
  id: Id;
  label: string;
  /** Bootstrap Icons class */
  icon?: string;
};

type Options<Id extends string> = {
  /** The steps as they are now: they can come and go with what has been chosen */
  steps: readonly WizardStep<Id>[];
  /** Steps whose mandatory fields aren't all valid */
  invalid: readonly Id[];
  /** Where it starts, when it isn't the first step */
  first?: Id;
  /** Where to be when the current step went away (by default the first step) */
  whenGone?: (id: Id) => Id | undefined;
};

/** Focus the first invalid field once React has rendered the errors */
export const focusFirstInvalid = () => requestAnimationFrame(() => document.querySelector<HTMLElement>("main [aria-invalid=true]")?.focus());

// The rules of every Montra wizard:
// - The position is kept by step id, as steps come and go. Steps already reached can be revisited.
// - Next is never disabled for invalid data: it shows the step's errors and focuses the first one.
//   A step's errors only show after that, and then stay live while it is corrected.
// - A step that is only a choice moves on when the choice is made (advance), the same choice too.
//   One option leaves nothing to choose: the page leaves that step out, and selects it.
// - The final action checks every step, and goes to the first with a problem (validateAll).
export function useWizard<Id extends string>({ steps, invalid, first, whenGone }: Options<Id>) {
  const [currentId, setCurrentId] = useState<Id>(() => first ?? steps[0].id);
  const [visited, setVisited] = useState<Id[]>(() => [first ?? steps[0].id]);
  const [shownFor, setShownFor] = useState<Id[]>([]);
  const [advancing, setAdvancing] = useState(false);

  const position = (id: Id | undefined) => steps.findIndex((s) => s.id === id);
  const found = position(currentId);
  const index = found !== -1 ? found : Math.max(0, position(whenGone?.(currentId)));
  const step = steps[index];
  const maxVisited = Math.max(index, ...visited.map(position));
  const isLast = index === steps.length - 1;

  const goTo = (id: Id) => {
    if (position(id) === -1) return;
    if (id !== step.id) window.scrollTo?.({ top: 0, behavior: "smooth" });
    setCurrentId(id);
    setVisited((v) => (v.includes(id) ? v : [...v, id]));
  };

  // Done here, once the choice is applied: the new steps exist, and the step validates
  if (advancing) {
    setAdvancing(false);
    if (!invalid.includes(step.id) && !isLast) goTo(steps[index + 1].id);
  }

  return {
    step,
    index,
    isFirst: index === 0,
    isLast,
    goTo,
    back: () => goTo(steps[Math.max(0, index - 1)].id),
    /** `canLeave`: something else the step waits for, once it is valid (it says what itself) */
    next: (canLeave?: () => boolean) => {
      setShownFor((s) => [...new Set([...s, step.id])]);
      if (invalid.includes(step.id)) return void focusFirstInvalid();
      if (canLeave && !canLeave()) return;
      if (!isLast) goTo(steps[index + 1].id);
    },
    /** A choice was made on this step: moves on as soon as it is applied */
    advance: () => setAdvancing(true),
    /** Shows every error. False (and at the first step with a problem) when something is invalid. */
    validateAll: () => {
      setShownFor(steps.map((s) => s.id));
      const firstInvalid = steps.find((s) => invalid.includes(s.id));
      if (!firstInvalid) return true;
      goTo(firstInvalid.id);
      focusFirstInvalid();
      return false;
    },
    /** Are this step's errors showing? */
    showsErrors: (id: Id) => shownFor.includes(id),
    /** For WizardStepper */
    stepper: {
      steps,
      current: index,
      maxVisited,
      incomplete: invalid,
      invalid: invalid.filter((id) => shownFor.includes(id)),
      onSelect: (i: number) => goTo(steps[i].id),
    },
  };
}
