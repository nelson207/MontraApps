import type { StepDef, StepId } from "../../wizard/steps";
import { stepperStates } from "../../wizard/stepperStates";

type Props = {
  steps: StepDef[];
  current: number;
  /** Highest step index reached; steps up to it can be clicked */
  maxVisited: number;
  /** Steps whose mandatory fields aren't all valid (no ✓ for them) */
  incomplete: StepId[];
  /** Steps whose errors are showing */
  invalid: StepId[];
  onSelect: (index: number) => void;
};

// Numbered steps with state (desktop); "Step n of N" + progress bar (mobile).
function Stepper({ steps, current, maxVisited, incomplete, invalid, onSelect }: Props) {
  const step = steps[current];
  const percent = Math.round(((current + 1) / steps.length) * 100);
  const states = stepperStates(
    steps.map((s) => s.id),
    { current, maxVisited, invalid: incomplete, shownErrors: invalid },
  );

  return (
    <nav aria-label="Steps">
      <ol className="app-stepper d-none d-md-flex list-unstyled mb-0">
        {steps.map((s, index) => {
          const hasErrors = invalid.includes(s.id);
          const { state, complete } = states[index];
          return (
            <li
              key={s.id}
              className={`app-stepper-item is-${state} ${hasErrors ? "has-errors" : ""} ${complete ? "is-complete" : ""}`}
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
                  <i className={`bi ${s.icon} me-1 d-none d-lg-inline`} aria-hidden="true" />
                  {s.label}
                  {hasErrors && <span className="visually-hidden"> (has errors)</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="d-md-none">
        <div className="d-flex justify-content-between small mb-1">
          <span className="fw-semibold">
            Step {current + 1} of {steps.length} · {step.label}
          </span>
          {invalid.includes(step.id) && <span className="text-danger">Has errors</span>}
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-label="Progress"
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

export default Stepper;
