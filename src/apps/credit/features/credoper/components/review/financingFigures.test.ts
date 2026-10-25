import { describe, expect, it } from "vitest";
import type { CredOperDraft } from "../../model/credOperDraft";
import { financingFigures } from "./financingFigures";

const op = (overrides: Partial<CredOperDraft> = {}): CredOperDraft => ({
  insurances: [],
  aplBusinessId: 4,
  amount: 18_000,
  assets: [{ equipment: { netAmount: 20_000, retakeAmount: 2_000, retakePercentage: 10 } }],
  conditions: [{ term: 60, implicitRate: 7.9, annualRate: 9.42, flows: [{ amount: 372.18 }] }],
  ...overrides,
});

describe("financingFigures", () => {
  it("the calculated values, read as they are", () =>
    expect(financingFigures(op())).toEqual({
      calculated: true,
      monthly: 372.18,
      financed: 18_000,
      base: 20_000,
      baseLabel: "Equipment amount",
      initialEntry: 2_000,
      initialEntryPercentage: 10,
      term: 60,
      tan: 7.9,
      taeg: 9.42,
    }));

  it("not calculated yet: no monthly payment", () => {
    const figures = financingFigures(op({ conditions: [{ term: 60 }] }));
    expect(figures.calculated).toBe(false);
    expect(figures.monthly).toBeNull();
    expect(figures.term).toBe(60);
  });

  it("renting: the base is all the vehicles", () => {
    const renting = op({
      aplBusinessId: 13,
      assets: [{ equipment: { netAmount: 20_000, retakeAmount: 3_500 } }, { equipment: { netAmount: 15_000 } }],
    });
    expect(financingFigures(renting)).toMatchObject({ base: 35_000, baseLabel: "Total of the vehicles", initialEntry: 3_500 });
  });

  it("personal loan: the base is the loan", () =>
    expect(financingFigures(op({ aplBusinessId: 2 })).baseLabel).toBe("Loan amount"));
});
