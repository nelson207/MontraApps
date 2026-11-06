import { describe, expect, it } from "vitest";
import type { CredOperDraft } from "../../model/credOperDraft";
import { EQUIPMENT_ASSET } from "../../model/business";
import { dealSentence, financingFigures, paymentBreakdown } from "./financingFigures";

const op = (overrides: Partial<CredOperDraft> = {}): CredOperDraft => ({
  insurances: [],
  aplBusinessId: 4,
  assetTypeId: EQUIPMENT_ASSET,
  amount: 18_000,
  assets: [{ equipment: { netAmount: 20_000, retakeAmount: 2_000, retakePercentage: 10 } }],
  conditions: [{ term: 60, implicitRate: 7.9, annualRate: 9.42, flows: [{ amount: 372.18 }], totalAmountChargedToCustomer: 22_330.8 } as never],
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
      total: 22_330.8,
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
    expect(financingFigures(op({ aplBusinessId: 2, assetTypeId: null })).baseLabel).toBe("Loan amount"));
});

describe("paymentBreakdown", () => {
  it("the initial entry and the financed equipment make up its amount", () =>
    expect(paymentBreakdown(op())).toEqual({ entry: 2_000, asset: 18_000, costs: 0, total: 20_000 }));

  it("financed fees and insurance are what's financed beyond the equipment", () =>
    expect(paymentBreakdown(op({ amount: 18_750.5 }))).toEqual({ entry: 2_000, asset: 18_000, costs: 750.5, total: 20_750.5 }));

  it("no initial entry: all of it is financed", () =>
    expect(paymentBreakdown(op({ assets: [{ equipment: { netAmount: 20_000 } }], amount: 20_000 }))).toEqual({
      entry: 0,
      asset: 20_000,
      costs: 0,
      total: 20_000,
    }));

  it("isn't thrown off by cents that don't add up in binary", () =>
    expect(paymentBreakdown(op({ amount: 0.2, assets: [{ equipment: { netAmount: 0.3, retakeAmount: 0.1 } }] }))?.costs).toBe(0));

  it("nothing when the parts don't reach the equipment's amount", () =>
    expect(paymentBreakdown(op({ amount: 10_000 }))).toBeNull());

  it("nothing when the entry is above the equipment's amount", () =>
    expect(paymentBreakdown(op({ assets: [{ equipment: { netAmount: 1_000, retakeAmount: 2_000 } }] }))).toBeNull());

  it("nothing before there's an amount to split", () =>
    expect(paymentBreakdown(op({ amount: undefined }))).toBeNull());

  it("nothing for renting, where the entry is one vehicle's and the amount all of them", () =>
    expect(
      paymentBreakdown(op({ aplBusinessId: 13, assets: [{ equipment: { netAmount: 20_000, retakeAmount: 3_500 } }, { equipment: { netAmount: 15_000 } }] })),
    ).toBeNull());

  it("nothing for an operation without equipment", () =>
    expect(paymentBreakdown(op({ aplBusinessId: 2, assetTypeId: null, assets: [] }))).toBeNull());
});

describe("dealSentence", () => {
  const money = (value: number) => `${value} EUR`;

  it("says how much, for how long, what for and who for", () =>
    expect(dealSentence({ amount: 18_500, term: 96, thing: "Example Sample 1.5", customer: "Ana Silva" }, money)).toBe(
      "18500 EUR over 96 months to finance Example Sample 1.5 for Ana Silva.",
    ));

  it("leaves out what isn't known yet", () => {
    expect(dealSentence({ amount: 18_500, term: 96 }, money)).toBe("18500 EUR over 96 months.");
    expect(dealSentence({ amount: 18_500, thing: "a building" }, money)).toBe("18500 EUR to finance a building.");
    expect(dealSentence({ amount: 18_500, term: 96, customer: "Ana Silva" }, money)).toBe("18500 EUR over 96 months for Ana Silva.");
  });

  it("has nothing to say without an amount", () =>
    expect(dealSentence({ term: 96, customer: "Ana Silva" }, money)).toBeNull());
});
