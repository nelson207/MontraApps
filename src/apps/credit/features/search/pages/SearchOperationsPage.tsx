import { useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { problemMessage } from "@platform/api/problemCode";
import ActiveFilters from "@platform/components/results/ActiveFilters";
import FilterChips from "@platform/components/results/FilterChips";
import { ResultList, ResultRow } from "@platform/components/results/ResultList";
import ResultsFooter from "@platform/components/results/ResultsFooter";
import ResultsPanel from "@platform/components/results/ResultsPanel";
import ResultsToolbar from "@platform/components/results/ResultsToolbar";
import { useUrlFilters } from "@platform/hooks/useUrlFilters";
import { useSearchCreditOperationsQuery } from "../api/creditOperationsSearchApi";
import {
  activeSearchFilters,
  CLEAR_FILTERS,
  fromSearchParams,
  isSearchableNumber,
  PAGE_SIZE,
  STEP_OPTIONS,
  stepLabel,
  toSearchArgs,
} from "../searchModel";

const amountFormat = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Credit → Search: the credit operations the user may see (GET /api/credit-operations/search;
// the API scopes them, nothing is filtered here), server-paged by totalCount. The number (search
// box), the step (chips), the state (Filters) and the page live in the URL, so Back and links
// bring the same results.
// TODO: rows open nothing yet: the API has no endpoint to load one operation for the wizard.
function SearchOperations() {
  const { get, set } = useUrlFilters();
  const filters = fromSearchParams({ get });
  const numberIsValid = isSearchableNumber(filters.number);
  const { currentData, isFetching, isError, error, refetch } = useSearchCreditOperationsQuery(
    numberIsValid ? toSearchArgs(filters) : skipToken,
  );
  /** What the Filters popover shows (applied with Apply) */
  const [stateDraft, setStateDraft] = useState(filters.stateId);

  const items = currentData?.items ?? [];
  const total = currentData?.totalCount ?? 0;
  const active = activeSearchFilters(filters);
  const hasFilters = !!(filters.number || filters.step || filters.stateId);

  const toolbar = (
    <ResultsToolbar
      title="Operations"
      count={currentData ? total : undefined}
      search={{
        value: filters.number,
        onChange: (value) => set({ number: value.trim() || null }),
        placeholder: "Operation number",
        label: "Search by operation number",
      }}
      activeFilterCount={active.length}
      filters={(close) => (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!isSearchableNumber(stateDraft)) return;
            set({ stateId: stateDraft.trim() || null });
            close();
          }}
        >
          <label htmlFor="ops-stateId" className="form-label">
            State
          </label>
          <input
            id="ops-stateId"
            type="text"
            inputMode="numeric"
            className={`form-control ${isSearchableNumber(stateDraft) ? "" : "is-invalid"}`}
            placeholder="Any"
            value={stateDraft}
            onChange={(e) => setStateDraft(e.target.value)}
          />
          <div className="invalid-feedback">Enter the state's number.</div>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setStateDraft("")}>
              Reset
            </button>
            <button type="submit" className="btn btn-sm btn-primary px-3">
              Apply
            </button>
          </div>
        </form>
      )}
    >
      <FilterChips
        groups={[
          {
            label: "Step",
            single: true,
            options: STEP_OPTIONS,
            selected: filters.step ? [filters.step] : [],
            onChange: (next) => set({ step: next[0] ?? null }),
          },
        ]}
      />
      <ActiveFilters
        items={active.map((filter) => ({
          ...filter,
          onRemove: () => {
            setStateDraft("");
            set({ [filter.key]: null });
          },
        }))}
        onClearAll={() => {
          setStateDraft("");
          set({ stateId: null });
        }}
      />
      {!numberIsValid && (
        <div className="small text-danger" role="alert">
          The operation number has digits only.
        </div>
      )}
    </ResultsToolbar>
  );

  return (
    <div className="py-4">
      <ResultsPanel
        toolbar={toolbar}
        status={{
          isLoading: isFetching && !currentData,
          isError,
          error,
          errorText: problemMessage(error) ?? "Couldn't search the operations.",
          onRetry: () => void refetch(),
          isEmpty: items.length === 0,
          empty: hasFilters
            ? {
                icon: "bi-folder2-open",
                text: "No operations match your search.",
                onClear: () => {
                  setStateDraft("");
                  set(CLEAR_FILTERS);
                },
              }
            : { icon: "bi-folder2-open", text: "There are no operations yet." },
        }}
        footer={
          <ResultsFooter
            page={filters.page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={(next) => set({ page: next > 1 ? String(next) : null })}
            label="Operation pages"
          />
        }
      >
        <ResultList label="Operations">
          {items.map((result, i) => {
            const step = stepLabel(result.step);
            const tone = result.step === 2 ? "info" : result.step === 1 ? "primary" : "secondary";
            return (
              <ResultRow
                key={result.id ?? `row-${i}`}
                accent={tone}
                accentLabel={step ?? undefined}
                title={result.entityName || result.descr || "No customer"}
                meta={[
                  result.number != null ? `No. ${result.number}` : "",
                  result.financialProductId != null ? `Product ${result.financialProductId}` : "",
                  result.beginDate?.slice(0, 10) ?? "",
                  result.amount != null ? `${amountFormat.format(result.amount)}${result.currencyId ? ` ${result.currencyId}` : ""}` : "",
                ]}
                trailing={
                  step && <span className={`badge rounded-pill bg-${tone}-subtle text-${tone}-emphasis`}>{step}</span>
                }
              />
            );
          })}
        </ResultList>
      </ResultsPanel>
    </div>
  );
}

export default SearchOperations;
