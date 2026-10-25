import { describe, expect, it } from "vitest";
import { labelOfCode, toCodeList } from "./equipmentLists";

describe("toCodeList", () => {
  it("types and categories: the id is the code, as a string", () =>
    expect(toCodeList([{ id: 1, abbreviation: "Car", description: "Passenger car" }])).toEqual([
      { code: "1", abbreviation: "Car", description: "Passenger car" },
    ]));

  it("brands, models, versions: the code is kept as sent", () =>
    expect(toCodeList([{ code: "PEUG", abbreviation: "Peugeot", description: null }])).toEqual([
      { code: "PEUG", abbreviation: "Peugeot", description: null },
    ]));

  it("labelled by abbreviation, then description, then the code; items without a code dropped", () =>
    expect(toCodeList([{ code: 1, abbreviation: "Car" }, { code: "2", description: "Van" }, { code: "X" }, { abbreviation: "No code" }])).toEqual([
      { code: "1", abbreviation: "Car", description: null },
      { code: "2", abbreviation: "Van", description: "Van" },
      { code: "X", abbreviation: "X", description: null },
    ]));

  it("is null for anything that isn't a list", () => {
    expect(toCodeList({ items: [] })).toBeNull();
    expect(toCodeList("<html>")).toBeNull();
  });
});

describe("labelOfCode", () => {
  const list = [{ code: "1", abbreviation: "New", description: "New vehicle" }];
  it("finds the label of a numeric or string code", () => {
    expect(labelOfCode(list, 1)).toBe("New");
    expect(labelOfCode(list, "1")).toBe("New");
  });
  it("is null when unknown or empty", () => {
    expect(labelOfCode(list, 9)).toBeNull();
    expect(labelOfCode(undefined, null)).toBeNull();
  });
});
