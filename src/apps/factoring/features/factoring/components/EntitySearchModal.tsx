import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@platform/hooks/useDebouncedValue";
import { useSearchEntitiesQuery } from "../api/factoringApi";
import type { Entity } from "../model/factoring";

type Props = {
  /** e.g. "Select the debtor" */
  title: string;
  selectedId?: number;
  onSelect: (entity: Entity) => void;
  onClose: () => void;
};

// Search a company by name, tax number or city and pick one. Focus starts in the search box and
// returns where it was on close; Esc closes; page scroll is locked while open.
function EntitySearchModal({ title, selectedId, onSelect, onClose }: Props) {
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 300);
  const { currentData, isFetching, isError, refetch } = useSearchEntitiesQuery(debounced);
  const inputRef = useRef<HTMLInputElement>(null);
  // Latest onClose without re-running the setup (parents pass a new function each render)
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    document.body.classList.add("overflow-hidden");
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && !e.defaultPrevented && onCloseRef.current();
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("overflow-hidden");
      previouslyFocused?.focus();
    };
  }, []);

  const items = currentData?.items ?? [];
  const total = currentData?.total ?? 0;

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby="entity-search-title">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg app-entity-modal">
            <div className="modal-header">
              <h2 id="entity-search-title" className="modal-title h5">
                {title}
              </h2>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>

            <div className="modal-body pt-3">
              <label htmlFor="entity-search" className="visually-hidden">
                Search companies
              </label>
              <div className="input-group mb-3">
                <span className="input-group-text">
                  {isFetching ? (
                    <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                  ) : (
                    <i className="bi bi-search" aria-hidden="true" />
                  )}
                </span>
                <input
                  ref={inputRef}
                  id="entity-search"
                  type="search"
                  className="form-control"
                  placeholder="Name, tax number or city"
                  autoComplete="off"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {isError ? (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-0" role="alert">
                  <span className="flex-grow-1">The companies couldn't be searched.</span>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => refetch()}>
                    Retry
                  </button>
                </div>
              ) : !currentData ? (
                <div className="text-center text-body-secondary py-4" role="status">
                  Searching…
                </div>
              ) : items.length === 0 ? (
                <div className="text-center text-body-secondary py-4" role="status">
                  No companies match “{debounced}”.
                </div>
              ) : (
                <>
                  <ul className="list-unstyled mb-0 d-flex flex-column gap-1" aria-label="Companies">
                    {items.map((entity) => {
                      const selected = entity.id === selectedId;
                      return (
                        <li key={entity.id}>
                          <button
                            type="button"
                            className={`app-entity-option ${selected ? "is-selected" : ""}`}
                            aria-pressed={selected}
                            onClick={() => onSelect(entity)}
                          >
                            <span className="app-entity-icon" aria-hidden="true">
                              <i className="bi bi-building" />
                            </span>
                            <span className="min-w-0 flex-grow-1">
                              <span className="d-block fw-semibold text-truncate">{entity.name}</span>
                              <span className="d-block small text-body-secondary">
                                Tax no. {entity.taxNumber}
                                {entity.city ? ` · ${entity.city}` : ""}
                              </span>
                            </span>
                            {selected && <i className="bi bi-check-circle-fill text-primary" aria-hidden="true" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {total > items.length && (
                    <p className="small text-body-secondary text-center mt-3 mb-0">
                      Showing {items.length} of {total}. Type more to narrow the search.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

export default EntitySearchModal;
