import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useDropdown } from "@platform/hooks/useDropdown";

export type SelectOption = {
  value: string | number;
  label: string;
  title?: string;
};

export type SearchableSelectProps = {
  id: string;
  value: string | number | null | undefined;
  options: SelectOption[];
  onChange: (value: string, option: SelectOption) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** First load in progress */
  isLoading?: boolean;
  /** Label for a selected value whose option isn't loaded (lazy lists) */
  selectedLabel?: string;
  /**
   * Server-side search. When provided, `options` are shown as-is (the server filters);
   * otherwise options are filtered locally.
   */
  onSearchChange?: (search: string) => void;
  /** Lazy loading: more options exist and `onLoadMore` fetches the next page */
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  "aria-describedby"?: string;
};

// Accent- and case-insensitive ("joao" matches "João")
const normalize = (text: string) =>
  text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/**
 * Searchable drop-down list styled with Bootstrap (.form-select + .dropdown-menu).
 * Keyboard: ↓/↑ move, Enter selects, Esc closes, Home/End jump.
 * ARIA: button + combobox search input + listbox (WAI-ARIA "select-only combobox" with filter).
 */
function SearchableSelect({
  id,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  invalid = false,
  isLoading = false,
  selectedLabel,
  onSearchChange,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  "aria-describedby": ariaDescribedBy,
}: SearchableSelectProps) {
  const { ref, isOpen, toggle, close } = useDropdown();
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const sentinelRef = useRef<HTMLLIElement>(null);
  const listId = `${useId()}-listbox`;

  const hasValue = value !== null && value !== undefined && value !== "";
  // "" is a real value when an option has it (e.g. "All levels")
  const selected =
    value === null || value === undefined
      ? undefined
      : options.find((o) => String(o.value) === String(value));
  const triggerText = selected?.label ?? (hasValue ? selectedLabel : undefined);

  const visible = onSearchChange
    ? options
    : options.filter((o) => normalize(o.label).includes(normalize(search)));

  const updateSearch = (text: string) => {
    setSearch(text);
    setActiveIndex(0);
    onSearchChange?.(text);
  };

  const open = () => {
    if (disabled) return;
    updateSearch("");
    // the search is reset, so position against the full list
    const index = options.findIndex((o) => String(o.value) === String(value));
    setActiveIndex(Math.max(index, 0));
    if (!isOpen) toggle();
  };

  const closeAndFocus = () => {
    close();
    triggerRef.current?.focus();
  };

  const choose = (option: SelectOption) => {
    onChange(String(option.value), option);
    closeAndFocus();
  };

  // Focus the search box when opening
  useEffect(() => {
    if (isOpen) searchRef.current?.focus();
  }, [isOpen]);

  // Keep the active option visible while navigating with the keyboard
  useEffect(() => {
    if (!isOpen) return;
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen]);

  // Lazy loading: fetch the next page when the end of the list scrolls into view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!isOpen || !hasMore || !onLoadMore || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingMore) onLoadMore();
      },
      { root: listRef.current, rootMargin: "0px 0px 48px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isOpen, hasMore, isLoadingMore, onLoadMore, visible.length]);

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      open();
    }
  };

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const last = visible.length - 1;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, last));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(last);
        break;
      case "Enter":
        // Never submit the surrounding form from here
        e.preventDefault();
        if (visible[activeIndex]) choose(visible[activeIndex]);
        break;
      case "Escape":
        e.preventDefault();
        closeAndFocus();
        break;
      case "Tab":
        close();
        break;
    }
  };

  const optionId = (index: number) => `${listId}-option-${index}`;

  return (
    <div ref={ref} className="dropdown app-combobox">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={`form-select text-start app-combobox-trigger ${invalid ? "is-invalid" : ""}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-describedby={ariaDescribedBy}
        aria-invalid={invalid ? true : undefined}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={`d-block text-truncate ${triggerText ? "" : "text-body-secondary"}`}>
          {isLoading && !triggerText ? "Loading…" : (triggerText ?? placeholder)}
        </span>
      </button>

      {isOpen && (
        <div className="dropdown-menu show w-100 p-0 shadow app-combobox-menu" data-bs-popper="static">
          <div className="p-2 border-bottom">
            <div className="position-relative">
              <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2 text-body-secondary small pe-none" />
              <input
                ref={searchRef}
                type="text"
                className="form-control form-control-sm app-combobox-search"
                placeholder="Search…"
                value={search}
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={visible[activeIndex] ? optionId(activeIndex) : undefined}
                aria-label="Search options"
                onChange={(e) => updateSearch(e.target.value)}
                onKeyDown={onSearchKeyDown}
              />
            </div>
          </div>

          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={id}
            className="list-unstyled mb-0 py-1 app-combobox-list"
          >
            {visible.map((option, index) => {
              const isSelected = String(option.value) === String(value);
              return (
                <li
                  key={option.value}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isSelected}
                  data-index={index}
                  title={option.title ?? option.label}
                  className={`dropdown-item d-flex align-items-center gap-2 app-combobox-option ${index === activeIndex ? "is-active" : ""} ${isSelected ? "fw-semibold" : ""}`}
                  onMouseMove={() => index !== activeIndex && setActiveIndex(index)}
                  onMouseDown={(e) => e.preventDefault()} // keep focus in the search box
                  onClick={() => choose(option)}
                >
                  <span className="text-truncate flex-grow-1">{option.label}</span>
                  {isSelected && <i className="bi bi-check2 text-primary" aria-hidden="true" />}
                </li>
              );
            })}

            {visible.length === 0 && !isLoading && (
              <li className="px-3 py-2 small text-body-secondary" role="presentation">
                No results{search ? ` for “${search}”` : ""}
              </li>
            )}

            {(isLoading || hasMore) && (
              <li
                ref={sentinelRef}
                className="px-3 py-2 small text-body-secondary d-flex align-items-center gap-2"
                role="presentation"
              >
                {(isLoading || isLoadingMore) && (
                  <>
                    <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                    Loading…
                  </>
                )}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
