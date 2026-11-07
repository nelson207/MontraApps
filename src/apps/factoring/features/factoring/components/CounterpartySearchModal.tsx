import { useEffect, useRef, useState } from "react";
import { useFactoringText } from "../factoringText";
import { isFinalAdd, type CounterpartyAdds } from "../hooks/useCounterpartyAdds";
import { useFactoringFormat } from "../model/format";
import { searchCounterparties, type Counterparty } from "../model/factoring";
import { factoringProblemMessage } from "../model/problems";
import { ApiMessages } from "./FactoringStates";

/** The agreement's debtors or suppliers, as the page loaded them */
export type CounterpartyList = {
  contractId: string;
  kind: "Debtor" | "Supplier";
  /** Active: these can be chosen */
  items: Counterparty[];
  /** Waiting for back-office activation: shown, but they can't be chosen yet */
  pending: Counterparty[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  adds: CounterpartyAdds;
};

type Props = {
  /** e.g. "Select the debtor" */
  title: string;
  selectedId?: string;
  list: CounterpartyList;
  onSelect: (counterparty: Counterparty) => void;
  onClose: () => void;
};

/** More than this is narrowed by typing */
const SHOWN_MAX = 50;

// Search the agreement's debtors or suppliers (client-side) and pick one. When the search finds
// nobody, an existing entity can be added by tax number. Focus starts in the search box and returns
// where it was on close; Esc closes; page scroll is locked while open.
function CounterpartySearchModal({ title, selectedId, list, onSelect, onClose }: Props) {
  const tx = useFactoringText();
  const { money } = useFactoringFormat();
  const [search, setSearch] = useState("");
  /** undefined: not edited, so what was searched when it looks like a tax number */
  const [editedTaxNumber, setEditedTaxNumber] = useState<string | undefined>(undefined);
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

  const found = searchCounterparties(list.items, search);
  const waiting = searchCounterparties(list.pending, search);
  const shown = found.slice(0, SHOWN_MAX);
  const debtors = list.kind === "Debtor";

  const taxNumber = (editedTaxNumber ?? (/\d/.test(search) ? search : "")).trim();
  const { adds, contractId } = list;
  const result = taxNumber ? adds.resultOf(contractId, taxNumber) : undefined;

  const addCounterparty = (e: React.FormEvent) => {
    e.preventDefault();
    // A fresh read afterwards: if it was saved, it now shows as waiting for activation
    if (taxNumber) void adds.add(contractId, taxNumber).then(list.refetch);
  };

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby="counterparty-search-title">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg app-entity-modal">
            <div className="modal-header">
              <h2 id="counterparty-search-title" className="modal-title h5">
                {title}
              </h2>
              <button type="button" className="btn-close" aria-label={tx("common.close", "Close")} onClick={onClose} />
            </div>

            <div className="modal-body pt-3">
              <label htmlFor="counterparty-search" className="visually-hidden">
                {tx("counterparty.search", "Search")}
              </label>
              <div className="input-group mb-3">
                <span className="input-group-text">
                  <i className="bi bi-search" aria-hidden="true" />
                </span>
                <input
                  ref={inputRef}
                  id="counterparty-search"
                  type="search"
                  className="form-control"
                  placeholder={tx("counterparty.searchPlaceholder", "Name, tax number or external number")}
                  autoComplete="off"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {list.isError ? (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-0" role="alert">
                  <span className="flex-grow-1">
                    {debtors
                      ? factoringProblemMessage(list.error, tx("counterparty.loadErrorDebtors", "The debtors couldn't be loaded."))
                      : factoringProblemMessage(list.error, tx("counterparty.loadErrorSuppliers", "The suppliers couldn't be loaded."))}
                  </span>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={list.refetch}>
                    {tx("common.retry", "Retry")}
                  </button>
                </div>
              ) : list.isLoading ? (
                <div className="text-center text-body-secondary py-4" role="status">
                  {tx("common.loading", "Loading…")}
                </div>
              ) : found.length > 0 || waiting.length > 0 ? (
                <>
                  <ul className="list-unstyled mb-0 d-flex flex-column gap-1" aria-label={title}>
                    {shown.map((counterparty) => {
                      const selected = counterparty.interventionId === selectedId;
                      const { availableAmount, totalAmount, withoutRecourseAvailableAmount, withoutRecourseTotalAmount } = counterparty;
                      return (
                        <li key={counterparty.interventionId}>
                          <button
                            type="button"
                            className={`app-entity-option ${selected ? "is-selected" : ""}`}
                            aria-pressed={selected}
                            onClick={() => onSelect(counterparty)}
                          >
                            <span className="app-entity-icon" aria-hidden="true">
                              <i className="bi bi-building" />
                            </span>
                            <span className="min-w-0 flex-grow-1">
                              <span className="d-block fw-semibold text-truncate">{counterparty.name ?? counterparty.taxNumber ?? tx("common.unavailable", "Unavailable")}</span>
                              {counterparty.taxNumber && <span className="d-block small text-body-secondary">{tx("counterparty.taxNumberOf", "Tax no. {{number}}", { number: counterparty.taxNumber })}</span>}
                              {totalAmount != null && (
                                <span className="d-block small text-body-secondary">
                                  {tx("counterparty.plafond", "{{available}} available of {{total}}", {
                                    available: money(availableAmount) ?? tx("common.unavailable", "Unavailable"),
                                    total: money(totalAmount) ?? "",
                                  })}
                                </span>
                              )}
                              {withoutRecourseTotalAmount != null && (
                                <span className="d-block small text-body-secondary">
                                  {tx("counterparty.plafondWithoutRecourse", "Without recourse: {{available}} available of {{total}}", {
                                    available: money(withoutRecourseAvailableAmount) ?? tx("common.unavailable", "Unavailable"),
                                    total: money(withoutRecourseTotalAmount) ?? "",
                                  })}
                                </span>
                              )}
                            </span>
                            {selected && <i className="bi bi-check-circle-fill text-primary" aria-hidden="true" />}
                          </button>
                        </li>
                      );
                    })}
                    {waiting.map((counterparty) => (
                      <li key={counterparty.interventionId} className="app-entity-option is-waiting">
                        <span className="app-entity-icon" aria-hidden="true">
                          <i className="bi bi-hourglass-split" />
                        </span>
                        <span className="min-w-0 flex-grow-1">
                          <span className="d-block fw-semibold text-truncate">{counterparty.name ?? counterparty.taxNumber ?? tx("common.unavailable", "Unavailable")}</span>
                          {counterparty.name && counterparty.taxNumber && <span className="d-block small text-body-secondary">{tx("counterparty.taxNumberOf", "Tax no. {{number}}", { number: counterparty.taxNumber })}</span>}
                          <span className="d-block small text-body-secondary">{tx("counterparty.waiting", "Waiting for back-office activation. It can't take invoices yet.")}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  {found.length > shown.length && (
                    <p className="small text-body-secondary text-center mt-3 mb-0">{tx("counterparty.narrow", "Showing {{shown}} of {{total}}. Type more to narrow the search.", { shown: shown.length, total: found.length })}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-center text-body-secondary py-2" role="status">
                    {debtors ? tx("counterparty.noneDebtors", "No debtor found on this agreement.") : tx("counterparty.noneSuppliers", "No supplier found on this agreement.")}
                  </p>
                  <form onSubmit={addCounterparty} noValidate>
                    <label htmlFor="counterparty-tax-number" className="form-label">
                      {tx("counterparty.addByTaxNumber", "Add an existing entity by its tax number")}
                    </label>
                    <div className="input-group mb-3">
                      <input
                        id="counterparty-tax-number"
                        className="form-control"
                        autoComplete="off"
                        value={editedTaxNumber ?? taxNumber}
                        onChange={(e) => setEditedTaxNumber(e.target.value)}
                      />
                      <button type="submit" className="btn btn-outline-primary" disabled={!taxNumber || adds.adding || isFinalAdd(result)}>
                        {adds.adding && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
                        {tx("counterparty.add", "Add to the agreement")}
                      </button>
                    </div>
                  </form>
                </>
              )}
              {/* Outside the branches: the new record can move this search from "nobody" to the list */}
              {!list.isError && result && (
                <div className="mt-3">
                  {result.kind === "added" && (
                    <div className="alert alert-success" role="status">
                      {tx("counterparty.added", "Tax number {{number}} was added. It waits for back-office activation, so it can't take invoices yet.", { number: taxNumber })}
                    </div>
                  )}
                  {result.kind === "uncertain" && (
                    <div className="alert alert-warning" role="alert">
                      {tx("counterparty.uncertain", "Tax number {{number}} may have been saved. Don't add it again: check with the back office or look for it here later.", { number: taxNumber })}
                    </div>
                  )}
                  {result.kind === "noAnswer" && (
                    <div className="alert alert-warning" role="alert">
                      {tx("counterparty.noAnswer", "There was no answer, so tax number {{number}} may have been saved. Don't add it again: check with the back office or look for it here later.", { number: taxNumber })}
                    </div>
                  )}
                  {result.kind === "tooMany" && (
                    <div className="alert alert-warning" role="alert">
                      {tx("counterparty.tooMany", "Too many tries. Wait a moment before trying again.")}
                    </div>
                  )}
                  {result.kind === "rejected" && (
                    <div className="alert alert-danger" role="alert">
                      {factoringProblemMessage(result.error, tx("counterparty.addError", "The entity couldn't be added."))}
                    </div>
                  )}
                  {"messages" in result && <ApiMessages messages={result.messages} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

export default CounterpartySearchModal;
