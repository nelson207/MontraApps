import { describe, expect, it } from "vitest";
import type { CredOperDto } from "@platform/api/legacy/legacyApi";
import { demoCalculate, monthlyPayment } from "./demoCalculation";

const op = (changes: Partial<CredOperDto> = {}): CredOperDto => ({
  aplBusinessId: 4,
  financialProduct: 1041,
  conditions: [{ term: 60, implicitRate: 6, flows: [] }],
  assets: [{ equipment: { netAmount: 20_000, retakeAmount: 2_000 } }],
  ...changes,
});

describe("monthlyPayment (annuity)", () => {
  it("spreads the amount and the interest over the term", () => expect(monthlyPayment(18_000, 6, 60)).toBeCloseTo(347.99, 2));
  it("without interest it's a plain split", () => expect(monthlyPayment(12_000, 0, 12)).toBe(1_000));
  it("is 0 without an amount or a term", () => {
    expect(monthlyPayment(0, 6, 60)).toBe(0);
    expect(monthlyPayment(10_000, 6, 0)).toBe(0);
  });
});

describe("demoCalculate", () => {
  it("finances the equipment minus the initial entry, monthly payment in the first flow", () => {
    const result = demoCalculate(op());
    expect(result.amount).toBe(18_000);
    const condition = result.conditions![0];
    expect(condition.flows![0].amount).toBe(347.99);
    expect(condition.implicitRate).toBe(6);
    expect(condition.annualRate).toBeGreaterThan(6);
  });

  it("renting finances the total of the vehicles", () => {
    const result = demoCalculate(
      op({
        aplBusinessId: 13,
        assets: [{ equipment: { netAmount: 20_000, retakeAmount: 2_000 } }, { equipment: { netAmount: 15_000 } }],
      }),
    );
    expect(result.amount).toBe(33_000);
  });

  it("keeps the rest of the operation as it was", () => {
    const result = demoCalculate(op({ customerName: "Ana Silva" }));
    expect(result.customerName).toBe("Ana Silva");
    expect(result.assets).toEqual(op().assets);
  });
});
