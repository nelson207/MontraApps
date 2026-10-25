import type { CreditOperationsSearchArgs } from "./api/creditOperationsSearchApi";

// Credit operations search: the filters (in the URL), what is sent, what is shown.

export const PAGE_SIZE = 50;

/** The filters as kept in the URL ("" = any) */
export type SearchFilters = { number: string; step: string; stateId: string; page: number };

/** Steps searched by name (the API's CreditOperationStep names) */
export const STEP_OPTIONS: { value: string; label: string }[] = [
  { value: "Quotation", label: "Quotation" },
  { value: "Proposal", label: "Proposal" },
  { value: "Contract", label: "Contract" },
];

/** The step numbers the app knows (see stageOf: 1 quotation, 2 proposal) */
const STEP_NAMES: Record<number, string> = { 1: "Quotation", 2: "Proposal" };

/** A result's step (a number in the answer) as a label */
export const stepLabel = (step: number | null | undefined): string | null =>
  step == null ? null : (STEP_NAMES[step] ?? `Step ${step}`);

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

export function toSearchArgs(filters: SearchFilters): CreditOperationsSearchArgs {
  return {
    number: wholeNumber(filters.number),
    step: filters.step || undefined,
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
