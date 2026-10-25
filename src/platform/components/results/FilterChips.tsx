import type { MouseEvent } from "react";
import { toggleChip, type Tone } from "./resultsModel";

export type ChipOption = { value: string; label: string; count?: number; tone?: Tone };

export type ChipGroup = {
  label: string;
  options: ChipOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** One value at most: a click selects only it, clicking the active one clears it */
  single?: boolean;
};

// Line 2 of a results card: groups of toggle chips with counts.
// Click toggles; Alt-click (or double-click) keeps only that chip.
function FilterChips({ groups }: { groups: ChipGroup[] }) {
  const click = (group: ChipGroup, value: string) => (e: MouseEvent) => {
    if (group.single) {
      group.onChange(group.selected.includes(value) ? [] : [value]);
      return;
    }
    group.onChange(toggleChip(group.selected, value, e.altKey || e.detail === 2));
  };

  return (
    <div className="app-results-chips">
      {groups.map((group) => (
        <div className="app-results-chip-group" role="group" aria-label={group.label} key={group.label}>
          {group.options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`app-results-chip ${option.tone ? `tone-${option.tone}` : ""}`}
              aria-pressed={group.selected.includes(option.value)}
              title={group.single ? option.label : `${option.label} (Alt-click: only this one)`}
              onClick={click(group, option.value)}
            >
              {option.tone && <span className="app-results-dot" aria-hidden="true" />}
              <span className="text-truncate">{option.label}</span>
              {option.count !== undefined && <span className="app-results-chip-count">{option.count}</span>}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default FilterChips;
