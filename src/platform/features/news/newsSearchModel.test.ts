import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  newsSearchFromUrl,
  newsSearchParams,
  newsSearchToUrl,
  withFilter,
  type NewsSearchState,
} from "./newsSearchModel";

const PORTAL = "MONTRA_APPLICATION_CREDIT";
const urlOf = (state: NewsSearchState) => {
  const params = new URLSearchParams();
  Object.entries(newsSearchToUrl(state)).forEach(([key, value]) => value && params.set(key, value));
  return params;
};

describe("newsSearchParams", () => {
  it("leaves out empty filters (no blank search, no 'all types')", () => {
    expect(newsSearchParams({ q: "  ", typeId: null, page: 1 }, PORTAL)).toEqual({
      portal: PORTAL,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });

  it("sends the trimmed search and the type", () => {
    expect(newsSearchParams({ q: " rates ", typeId: 4, page: 2 }, PORTAL)).toEqual({
      portal: PORTAL,
      search: "rates",
      newsTypeId: 4,
      page: 2,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });

  it("clamps what the API would reject (page ≥ 1, 1 ≤ pageSize ≤ 100, positive type id)", () => {
    expect(newsSearchParams({ q: "", typeId: 0, page: 0 }, PORTAL, 500)).toEqual({ portal: PORTAL, page: 1, pageSize: MAX_PAGE_SIZE });
    expect(newsSearchParams({ q: "", typeId: -3, page: 2.7 }, PORTAL, 0)).toEqual({ portal: PORTAL, page: 2, pageSize: 1 });
    expect(newsSearchParams({ q: "", typeId: Number.NaN, page: Number.NaN }, PORTAL).page).toBe(1);
  });
});

describe("URL state", () => {
  it("round-trips", () => {
    const state: NewsSearchState = { q: "new rates", typeId: 4, page: 3 };
    expect(newsSearchFromUrl(urlOf(state))).toEqual(state);
  });

  it("the default state writes nothing to the URL", () => {
    expect(urlOf({ q: "", typeId: null, page: 1 }).toString()).toBe("");
  });

  it("reads junk as the defaults", () => {
    expect(newsSearchFromUrl(new URLSearchParams("type=abc&page=-2"))).toEqual({ q: "", typeId: null, page: 1 });
  });
});

describe("withFilter", () => {
  it("changing the search or the type goes back to page 1", () => {
    const state: NewsSearchState = { q: "a", typeId: null, page: 4 };
    expect(withFilter(state, { q: "ab" })).toEqual({ q: "ab", typeId: null, page: 1 });
    expect(withFilter(state, { typeId: 2 })).toEqual({ q: "a", typeId: 2, page: 1 });
  });
});
