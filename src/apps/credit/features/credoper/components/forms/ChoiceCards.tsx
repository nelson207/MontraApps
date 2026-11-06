export type Choice = { key: string; title: string; detail?: string | null; selected: boolean; onSelect: () => void };

/** One of what the entity has on file, or a new one: the selected one is what the intervention uses */
export default function ChoiceCards({ label, choices }: { label: string; choices: Choice[] }) {
  return (
    <div className="app-choice-grid mb-3" role="group" aria-label={label}>
      {choices.map((choice) => (
        <button
          key={choice.key}
          type="button"
          className={`app-choice ${choice.selected ? "is-selected" : ""}`}
          aria-pressed={choice.selected}
          onClick={choice.onSelect}
        >
          <span className="d-block text-truncate" title={choice.title}>
            {choice.title}
          </span>
          {choice.detail && <small className="d-block text-body-secondary">{choice.detail}</small>}
        </button>
      ))}
    </div>
  );
}
