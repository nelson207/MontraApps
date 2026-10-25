export type ActiveFilter = { key: string; label: string; onRemove: () => void };

// Line 3 of a results card (only when something is filtered): removable pills + "Clear all".
function ActiveFilters({ items, onClearAll }: { items: ActiveFilter[]; onClearAll: () => void }) {
  if (items.length === 0) return null;

  return (
    <div className="app-results-active">
      {items.map((item) => (
        <span className="app-results-pill" key={item.key}>
          <span className="text-truncate">{item.label}</span>
          <button type="button" aria-label={`Remove ${item.label}`} onClick={item.onRemove}>
            <i className="bi bi-x" aria-hidden="true" />
          </button>
        </span>
      ))}
      <button type="button" className="btn btn-link btn-sm p-0 ms-1" onClick={onClearAll}>
        Clear all
      </button>
    </div>
  );
}

export default ActiveFilters;
