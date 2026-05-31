import React from "react";
import type { WizardHeaderProps } from "../../types/credoperTypes";

const WizardHeaderWithIcons: React.FC<WizardHeaderProps> = ({
  steps = [],
  currentStep = 1,
  onStepClick,
}) => {
  return (
    <div className="d-flex justify-content-between mb-3">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div key={index} className="flex-fill text-center position-relative">
            <button
              type="button"
              className={`btn mb-2  `}
              style={{ width: 100, height: 50, zIndex: 1 }}
              onClick={() => onStepClick?.(stepNumber)}
            >
              <i
                className={`bi ${step.icon} text-center fs-3 ${
                  isActive
                    ? "text-primary"
                    : isCompleted
                      ? "text-success"
                      : "text-muted"
                }`}
              />
              <div
                className={`small text-center ${
                  isActive
                    ? "fw-bold text-primary"
                    : isCompleted
                      ? "text-success"
                      : "text-muted"
                }`}
              >
                {step.label}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default WizardHeaderWithIcons;
