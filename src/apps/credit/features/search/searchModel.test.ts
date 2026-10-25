import { describe, expect, it } from "vitest";
import { activeSearchFilters, fromSearchParams, isSearchableNumber, PAGE_SIZE, stepLabel, toSearchArgs } from "./searchModel";

const params = (query: string) => new URLSearchParams(query);

describe("search filters", () => {
  it("are read from the URL (page 1 by default)", () => {
    expect(fromSearchParams(params("number=2026001&step=Proposal&page=3"))).toEqual({
      number: "2026001",
      step: "Proposal",
      stateId: "",
      page: 3,
    });
    expect(fromSearchParams(params("page=-2")).page).toBe(1);
  });

  it("send the step by name, numbers as numbers, blanks left out", () => {
    expect(toSearchArgs(fromSearchParams(params("number=42&step=Quotation&stateId=7&page=2")))).toEqual({
      number: 42,
      step: "Quotation",
      stateId: 7,
      page: 2,
      pageSize: PAGE_SIZE,
    });
    expect(toSearchArgs(fromSearchParams(params("")))).toEqual({
      number: undefined,
      step: undefined,
      stateId: undefined,
      page: 1,
      pageSize: PAGE_SIZE,
    });
  });

  it("a number that isn't whole isn't sent (and is flagged)", () => {
    expect(toSearchArgs(fromSearchParams(params("number=12a"))).number).toBeUndefined();
    expect(isSearchableNumber("12a")).toBe(false);
    expect(isSearchableNumber(" 12 ")).toBe(true);
    expect(isSearchableNumber("")).toBe(true);
  });

  it("the state shows as a pill", () => {
    expect(activeSearchFilters(fromSearchParams(params("stateId=5")))).toEqual([{ key: "stateId", label: "State: 5" }]);
    expect(activeSearchFilters(fromSearchParams(params("step=Proposal")))).toEqual([]);
  });

  it("labels the steps it knows", () => {
    expect(stepLabel(1)).toBe("Quotation");
    expect(stepLabel(2)).toBe("Proposal");
    expect(stepLabel(12)).toBe("Step 12");
    expect(stepLabel(null)).toBeNull();
  });
});
