import { useRef, type KeyboardEvent } from "react";
import type { WizardHeaderProps } from "../types/credoperTypes";

// The tabs of a person's form: a small icon beside the label, how many required fields it still
// misses, a tick when it's complete and a mark when it has errors to show.
function InterventionTabs({ steps = [], currentStep = 1, onStepClick }: WizardHeaderProps) {
  const list = useRef<HTMLDivElement>(null);

  // ← → move between the tabs
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const move = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!move) return;
    e.preventDefault();
    const next = ((currentStep - 1 + move + steps.length) % steps.length) + 1;
    onStepClick?.(next);
    list.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next - 1]?.focus();
  };

  return (
    <div ref={list} className="app-person-tabs" role="tablist" aria-label="Sections of this person" onKeyDown={onKeyDown}>
      {steps.map((step, index) => {
        const isActive = index + 1 === currentStep;
        const says = [step.label, step.missing ? `${step.missing} to fill` : step.complete ? "complete" : null, step.hasError ? "has errors" : null];
        return (
          <button
            key={step.label}
            type="button"
            role="tab"
            id={`person-tab-${index + 1}`}
            aria-selected={isActive}
            aria-controls="person-tab-panel"
            aria-label={says.filter(Boolean).join(", ")}
            tabIndex={isActive ? 0 : -1}
            className={`app-person-tab ${isActive ? "is-active" : ""}`}
            onClick={() => onStepClick?.(index + 1)}
          >
            <i className={`bi ${step.icon}`} aria-hidden="true" />
            <span>{step.label}</span>
            {!!step.missing && <span className="badge rounded-pill text-bg-warning app-person-tab-count">{step.missing}</span>}
            {!step.missing && step.complete && <i className="bi bi-check-lg text-success" aria-hidden="true" />}
            {step.hasError && <span className="app-person-tab-error" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

export default InterventionTabs;
