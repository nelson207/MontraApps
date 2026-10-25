import { describe, expect, it } from "vitest";
import { fieldRule, requiredError } from "./fieldRules";

describe("server field rules", () => {
  it("no metadata → visible, optional, editable", () =>
    expect(fieldRule(null, "customerName")).toEqual({ visible: true, required: false, readOnly: false }));

  it("reads the matching jsonName", () =>
    expect(
      fieldRule([{ jsonName: "customerName", isRequired: true, isVisible: true, isReadOnly: false }], "customerName")
        .required,
    ).toBe(true));

  it("0 and false are values", () => {
    const rule = { visible: true, required: true, readOnly: false };
    expect(requiredError(rule, 0)).toBeNull();
    expect(requiredError(rule, false)).toBeNull();
    expect(requiredError(rule, "  ")).toBe("This field is required.");
  });

  it("hidden required field is never an error", () =>
    expect(requiredError({ visible: false, required: true, readOnly: false }, null)).toBeNull());
});
