import { useTranslation } from "react-i18next";
import type { WizardStep } from "./useWizard";
import { stepperStates } from "./stepperStates";

type Props<Id extends string> = {
  steps: readonly WizardStep<Id>[];
  current: number;
  /** Highest step index reached; steps up to it can be clicked */
  maxVisited: number;
  /** Steps whose mandatory fields aren't all valid (no ✓ for them) */
  incomplete: readonly Id[];
  /** Steps whose errors are showing */
  invalid: readonly Id[];
  onSelect: (index: number) => void;
};

// Numbered steps with state (desktop); "Step n of N" + progress bar (mobile). Every Montra wizard's.
function WizardStepper<Id extends string>({ steps, current, maxVisited, incomplete, invalid, onSelect }: Props<Id>) {
  const { t } = useTranslation();
  const step = steps[current];
  const percent = Math.round(((current + 1) / steps.length) * 100);
  const states = stepperStates(
    steps.map((s) => s.id),
    { current, maxVisited, invalid: incomplete, shownErrors: invalid },
  );
  const hasErrors = t("wizard.hasErrors", { defaultValue: "Has errors" });

  return (
    <nav aria-label={t("wizard.steps", { defaultValue: "Steps" })}>
      <ol className="app-stepper d-none d-md-flex list-unstyled mb-0">
        {steps.map((s, index) => {
          const showsErrors = invalid.includes(s.id);
          const { state, complete } = states[index];
          return (
            <li
              key={s.id}
              className={`app-stepper-item is-${state} ${showsErrors ? "has-errors" : ""} ${complete ? "is-complete" : ""}`}
            >
              <button
                type="button"
                className="app-stepper-button"
                disabled={index > maxVisited}
                aria-current={index === current ? "step" : undefined}
                onClick={() => onSelect(index)}
              >
                <span className="app-stepper-marker" aria-hidden="true">
                  {state === "error" ? (
                    <i className="bi bi-exclamation-lg" />
                  ) : state === "done" ? (
                    <i className="bi bi-check-lg" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="app-stepper-label">
                  {s.icon && <i className={`bi ${s.icon} me-1 d-none d-lg-inline`} aria-hidden="true" />}
                  {s.label}
                  {showsErrors && <span className="visually-hidden"> ({t("wizard.hasErrorsInline", { defaultValue: "has errors" })})</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="d-md-none">
        <div className="d-flex justify-content-between small mb-1">
          <span className="fw-semibold">
            {t("wizard.stepOf", { defaultValue: "Step {{current}} of {{total}}", current: current + 1, total: steps.length })} · {step.label}
          </span>
          {invalid.includes(step.id) && <span className="text-danger">{hasErrors}</span>}
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-label={t("wizard.progress", { defaultValue: "Progress" })}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ height: 6 }}
        >
          <div className="progress-bar" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </nav>
  );
}

export default WizardStepper;
