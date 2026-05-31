import React from "react";
import type { WizardHeaderProps } from "../../types/credoperTypes";

const WizardHeader: React.FC<WizardHeaderProps> = ({
  steps = [],
  currentStep = 1,
  onStepClick,
}) => {
  return (
    <div className="row g-3 align-items-end my-2">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div className="col" key={index}>
            <button
              type="button"
              className={`btn btn-outline-primary w-100 d-flex align-items-center text-start mb-3
                ${isActive ? "active" : ""} 
                ${isCompleted ? "completed" : ""}`}
              onClick={() => onStepClick?.(stepNumber)}
            >
              <span>{stepNumber}.</span>
              <span className="ms-2">{step.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default WizardHeader;
