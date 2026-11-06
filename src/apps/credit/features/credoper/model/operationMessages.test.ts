import { describe, expect, it } from "vitest";
import { countsLabel, hasCalculationError, messagesBySeverity, operationMessages } from "./operationMessages";

describe("operationMessages", () => {
  it("reads the API's severities, whatever their case", () => {
    const messages = operationMessages({
      save: [
        { severity: "ERROR", text: "a" },
        { severity: "Warning", text: "b" },
        { severity: "information", text: "c" },
        { severity: "Informative", text: "d" },
        { severity: "Info", text: "e" },
      ],
    });
    expect(messages.map((m) => m.severity)).toEqual(["error", "warning", "info", "info", "info"]);
  });

  it("treats a missing or unknown severity as a warning, so nothing is hidden", () => {
    const messages = operationMessages({ save: [{ severity: null, text: "a" }, { severity: "Notice", text: "b" }] });
    expect(messages.map((m) => m.severity)).toEqual(["warning", "warning"]);
  });

  it("skips messages without text and trims the rest", () => {
    const messages = operationMessages({ save: [{ severity: "Error", text: "  " }, { severity: "Error", text: null }, { severity: "Error", text: " a " }] });
    expect(messages.map((m) => m.text)).toEqual(["a"]);
  });

  it("puts errors first, then warnings, then information, keeping the API's order within each", () => {
    const messages = operationMessages({
      save: [{ severity: "Info", text: "i" }, { severity: "Warning", text: "w1" }],
      calculation: [{ severity: "Warning", text: "w2" }, { severity: "Error", text: "e" }],
    });
    expect(messages.map((m) => m.text)).toEqual(["e", "w1", "w2", "i"]);
  });

  it("says where each message came from", () => {
    const messages = operationMessages({ save: [{ severity: "Error", text: "s" }], calculation: [{ severity: "Warning", text: "c" }] });
    expect(messages).toEqual([
      { severity: "error", text: "s", source: "save" },
      { severity: "warning", text: "c", source: "calculation" },
    ]);
  });

  it("shows the same text once, at its most severe", () => {
    const messages = operationMessages({ save: [{ severity: "Warning", text: "same" }], calculation: [{ severity: "Error", text: "same" }] });
    expect(messages).toEqual([{ severity: "error", text: "same", source: "calculation" }]);
  });

  it("takes missing lists", () => {
    expect(operationMessages({ save: null })).toEqual([]);
  });
});

describe("messagesBySeverity", () => {
  it("splits the messages by level", () => {
    const groups = messagesBySeverity(operationMessages({ save: [{ severity: "Error", text: "e" }, { severity: "Info", text: "i" }] }));
    expect(groups.error.map((m) => m.text)).toEqual(["e"]);
    expect(groups.warning).toEqual([]);
    expect(groups.info.map((m) => m.text)).toEqual(["i"]);
  });
});

describe("countsLabel", () => {
  const label = (...severities: string[]) => countsLabel(operationMessages({ save: severities.map((severity, i) => ({ severity, text: `m${i}` })) }));

  it("counts errors and warnings", () => {
    expect(label("Error", "Error", "Warning")).toBe("2 errors, 1 warning");
  });

  it("leaves notes out when there is something more pressing", () => {
    expect(label("Warning", "Info")).toBe("1 warning");
  });

  it("counts notes when they are all there is", () => {
    expect(label("Info", "Info")).toBe("2 notes");
  });
});

describe("hasCalculationError", () => {
  it("is about errors from calculating only", () => {
    expect(hasCalculationError(operationMessages({ calculation: [{ severity: "Error", text: "c" }] }))).toBe(true);
    expect(hasCalculationError(operationMessages({ calculation: [{ severity: "Warning", text: "c" }] }))).toBe(false);
    expect(hasCalculationError(operationMessages({ save: [{ severity: "Error", text: "s" }] }))).toBe(false);
  });
});
