import type { CreditOperationStep, GetApiCreditOperationsSearchApiArg } from "@platform/api/generated/MontraPOSApi";

// Credit operations search (GET /api/credit-operations/search): the filters (in the URL), what
// is sent, what is shown.

export const PAGE_SIZE = 50;

/** The filters as kept in the URL ("" = any) */
export type SearchFilters = { number: string; step: string; stateId: string; page: number };

/** The steps searched (CreditOperationStep names) */
export const STEP_OPTIONS: { value: CreditOperationStep; label: string }[] = [
  { value: "Quotation", label: "Quotation" },
  { value: "Proposal", label: "Proposal" },
  { value: "Contract", label: "Contract" },
];

/** Labels of the other steps a result may have */
const STEP_LABELS: Partial<Record<CreditOperationStep, string>> = {
  MLAProposal: "MLA proposal",
  MLAContract: "MLA contract",
  ExternalOperation: "External operation",
};

/** A result's step (its CreditOperationStep name) as a label */
export const stepLabel = (step: CreditOperationStep | null | undefined): string | null =>
  step ? (STEP_OPTIONS.find((o) => o.value === step)?.label ?? STEP_LABELS[step] ?? step) : null;

/** The URL's step, if it's one that can be searched */
const searchedStep = (step: string) => STEP_OPTIONS.find((o) => o.value === step)?.value;

const FILTER_KEYS = ["number", "step", "stateId"] as const;

export function fromSearchParams(params: { get(key: string): string | null }): SearchFilters {
  return {
    number: params.get("number") ?? "",
    step: params.get("step") ?? "",
    stateId: params.get("stateId") ?? "",
    page: Math.max(1, Number(params.get("page")) || 1),
  };
}

/** Digits only, as a number; undefined when blank or not a whole number */
const wholeNumber = (value: string): number | undefined => (/^\d+$/.test(value.trim()) ? Number(value.trim()) : undefined);

/** Whether a typed operation number / state can be searched ("" counts: it means any) */
export const isSearchableNumber = (value: string) => value.trim() === "" || wholeNumber(value) !== undefined;

export function toSearchArgs(filters: SearchFilters): GetApiCreditOperationsSearchApiArg {
  return {
    number: wholeNumber(filters.number),
    step: searchedStep(filters.step),
    stateId: wholeNumber(filters.stateId),
    page: filters.page,
    pageSize: PAGE_SIZE,
  };
}

/** The popover's filters as pills ("State: 12"); the number is in the search box, the step in chips */
export function activeSearchFilters(filters: SearchFilters): { key: (typeof FILTER_KEYS)[number]; label: string }[] {
  return filters.stateId.trim() ? [{ key: "stateId", label: `State: ${filters.stateId.trim()}` }] : [];
}

/** URL changes that clear every filter */
export const CLEAR_FILTERS: Record<string, null> = Object.fromEntries(FILTER_KEYS.map((key) => [key, null]));
