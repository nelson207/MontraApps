import { describe, expect, it } from "vitest";
import { pageRange, paginate, toggleChip } from "./resultsModel";

describe("toggleChip", () => {
  it("removes a selected value", () => {
    expect(toggleChip(["a", "b"], "a", false)).toEqual(["b"]);
  });

  it("adds an unselected value", () => {
    expect(toggleChip(["b"], "a", false)).toEqual(["b", "a"]);
  });

  it("selects only the value", () => {
    expect(toggleChip(["a", "b"], "b", true)).toEqual(["b"]);
  });

  it("can leave nothing selected", () => {
    expect(toggleChip(["a"], "a", false)).toEqual([]);
  });
});

describe("pageRange", () => {
  it("clamps a page beyond the last one", () => {
    expect(pageRange(5, 10, 23)).toEqual({ page: 3, pageCount: 3, first: 21, last: 23 });
  });

  it("has one empty page when there is nothing", () => {
    expect(pageRange(1, 10, 0)).toEqual({ page: 1, pageCount: 1, first: 0, last: 0 });
  });

  it("clamps pages below 1", () => {
    expect(pageRange(0, 10, 5)).toEqual({ page: 1, pageCount: 1, first: 1, last: 5 });
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 23 }, (_, i) => i + 1);

  it("returns the items of the page", () => {
    expect(paginate(items, 2, 10)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  });

  it("returns the last page when asked beyond it", () => {
    expect(paginate(items, 9, 10)).toEqual([21, 22, 23]);
  });
});
