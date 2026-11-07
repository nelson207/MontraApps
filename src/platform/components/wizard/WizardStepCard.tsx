import type { ReactNode } from "react";
import StepTransition from "@platform/components/ui/StepTransition";
import type { WizardStep } from "./useWizard";

// The current step: its card, title and icon, moving in when the step changes.
function WizardStepCard({ index, step, children }: { index: number; step: WizardStep; children: ReactNode }) {
  return (
    <section className="card border-0 shadow-sm" aria-labelledby="step-title">
      <div className="card-body">
        <StepTransition id={step.id} index={index}>
          <h3 id="step-title" className="h5 fw-semibold mb-3">
            {step.icon && <i className={`bi ${step.icon} me-2 text-primary`} aria-hidden="true" />}
            {step.label}
          </h3>
          {children}
        </StepTransition>
      </div>
    </section>
  );
}

export default WizardStepCard;
