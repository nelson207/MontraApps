type Step = { label: string };

type Props = {
  steps: readonly Step[];
  current: number;
  /** Steps before the current one can be revisited; later ones can't be skipped to */
  onSelect: (index: number) => void;
};

// A short wizard's steps in one row: numbered markers, a line between them (only the current
// step's label on narrow screens). For longer wizards with errors per step, see Credit's Stepper.
function StepsNav({ steps, current, onSelect }: Props) {
  return (
    <nav aria-label="Steps">
      <ol className="app-steps list-unstyled mb-0">
        {steps.map((step, index) => {
          const state = index === current ? "current" : index < current ? "done" : "todo";
          return (
            <li key={step.label} className={`app-step is-${state}`}>
              <button
                type="button"
                className="app-step-button"
                disabled={index > current}
                aria-current={index === current ? "step" : undefined}
                onClick={() => onSelect(index)}
              >
                <span className="app-step-marker" aria-hidden="true">
                  {state === "done" ? <i className="bi bi-check-lg" /> : index + 1}
                </span>
                <span className="app-step-label">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default StepsNav;
