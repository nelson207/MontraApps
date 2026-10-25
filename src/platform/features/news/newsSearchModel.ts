// News search (/news): the state kept in the URL and the request it makes
// (GET /api/news/search?portal=&search=&newsTypeId=&page=&pageSize=).

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type NewsSearchState = {
  /** Text searched in the title / subtitle / body ("" = no search) */
  q: string;
  /** News type id; null = all types */
  typeId: number | null;
  /** 1-based */
  page: number;
};

export type NewsSearchParams = {
  portal: string;
  search?: string;
  newsTypeId?: number;
  page: number;
  pageSize: number;
};

const positiveInt = (value: unknown): number | null => {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * The request for `state`: empty filters are left out (never "newsTypeId="), and the values the
 * API would reject (400 validation_failed) are clamped: page ≥ 1, 1 ≤ pageSize ≤ 100.
 */
export function newsSearchParams(state: NewsSearchState, portal: string, pageSize = DEFAULT_PAGE_SIZE): NewsSearchParams {
  const params: NewsSearchParams = {
    portal,
    page: positiveInt(state.page) ?? 1,
    pageSize: Math.min(MAX_PAGE_SIZE, positiveInt(pageSize) ?? 1),
  };
  const search = state.q.trim();
  if (search) params.search = search;
  const typeId = positiveInt(state.typeId);
  if (typeId !== null) params.newsTypeId = typeId;
  return params;
}

/** The state in the URL (?q=&type=&page=); junk reads as the defaults */
export function newsSearchFromUrl(params: { get(key: string): string | null }): NewsSearchState {
  return {
    q: params.get("q") ?? "",
    typeId: positiveInt(params.get("type")),
    page: positiveInt(params.get("page")) ?? 1,
  };
}

/** URL changes for `state` (null removes a parameter); the defaults write nothing */
export function newsSearchToUrl(state: NewsSearchState): Record<string, string | null> {
  return {
    q: state.q || null,
    type: state.typeId ? String(state.typeId) : null,
    page: state.page > 1 ? String(state.page) : null,
  };
}

/** A new search text or type: back to page 1 */
export const withFilter = (state: NewsSearchState, change: Partial<Pick<NewsSearchState, "q" | "typeId">>): NewsSearchState => ({
  ...state,
  ...change,
  page: 1,
});
