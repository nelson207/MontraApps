import { describe, expect, it } from "vitest";
import type { CredOperDraft } from "../model/credOperDraft";
import { resolveEntry } from "./resolveEntry";

const stored: CredOperDraft = { id: "op5", insurances: [] };

describe("resolveEntry", () => {
  it("new over unsaved work asks first", () =>
    expect(resolveEntry({ intent: "new", stage: "quotation", stored, isDirty: true })).toBe("promptDiscard"));

  it("new otherwise starts a fresh operation", () => {
    expect(resolveEntry({ intent: "new", stage: "quotation", stored, isDirty: false })).toBe("startNew");
    expect(resolveEntry({ intent: "new", stage: "quotation", stored: null, isDirty: false })).toBe("startNew");
  });

  it("open / continue use the stored operation", () => {
    expect(resolveEntry({ intent: "open", stage: "quotation", stored, isDirty: false })).toBe("useStored");
    expect(resolveEntry({ intent: "continue", stage: "quotation", stored, isDirty: true })).toBe("useStored");
  });

  it("open / continue with nothing stored fall back to new", () => {
    expect(resolveEntry({ intent: "open", stage: "quotation", stored: null, isDirty: false })).toBe("fallbackNew");
    expect(resolveEntry({ intent: "continue", stage: "quotation", stored: null, isDirty: false })).toBe("fallbackNew");
  });

  it("a stored operation of the other stage is redirected to its own screen", () => {
    const proposal: CredOperDraft = { id: "op5", credOperStep: 2, insurances: [] };
    expect(resolveEntry({ intent: "open", stage: "quotation", stored: proposal, isDirty: false })).toBe("redirect");
    expect(resolveEntry({ intent: "continue", stage: "proposal", stored, isDirty: true })).toBe("redirect");
  });
});
