import { useId, type ReactNode } from "react";
import { useDropdown } from "@platform/hooks/useDropdown";
import SearchBox, { type ToolbarSearch } from "./SearchBox";

// Line 1 of a results card: title + count, search, "Filters" popover, actions.
// Lines 2–3 (FilterChips, ActiveFilters) come as children.
function ResultsToolbar({
  title,
  titleSlot,
  count,
  search,
  filters,
  activeFilterCount = 0,
  isSample = false,
  actions,
  children,
}: {
  title?: string;
  /** Replaces the title (e.g. the dashboard's tabs) */
  titleSlot?: ReactNode;
  count?: number;
  search?: ToolbarSearch;
  /** Body of the "Filters" popover (the less-used filters); a function gets `close` (e.g. for Apply) */
  filters?: ReactNode | ((close: () => void) => ReactNode);
  activeFilterCount?: number;
  isSample?: boolean;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const popoverId = useId();
  const { ref, isOpen, toggle, close } = useDropdown();

  return (
    <div className="app-results-toolbar">
      <div className="app-results-toolbar-main">
        <div className="app-results-title">
          {titleSlot ?? (
            <h2 className="app-results-heading mb-0 text-truncate">
              {title}
              {count !== undefined && (
                <span className="app-results-count" aria-live="polite">
                  {count}
                </span>
              )}
            </h2>
          )}
          {isSample && (
            <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis border">Sample data</span>
          )}
        </div>

        <div className="app-results-tools">
          {search && <SearchBox {...search} />}
          {filters && (
            <div className="position-relative" ref={ref}>
              <button
                type="button"
                className={`btn btn-sm app-results-filters-btn ${activeFilterCount > 0 ? "is-active" : ""}`}
                aria-expanded={isOpen}
                aria-controls={popoverId}
                onClick={toggle}
              >
                <i className="bi bi-sliders2" aria-hidden="true" />
                <span className="d-none d-sm-inline ms-1">Filters</span>
                {activeFilterCount > 0 && <span className="app-results-filters-badge">{activeFilterCount}</span>}
              </button>
              {isOpen && (
                <div id={popoverId} className="app-results-popover shadow" role="group" aria-label="Filters">
                  {typeof filters === "function" ? filters(close) : filters}
                </div>
              )}
            </div>
          )}
          {actions}
        </div>
      </div>
      {children}
    </div>
  );
}

export default ResultsToolbar;
