import { describe, expect, it } from "vitest";
import type { CredOperDto } from "@platform/api/legacy/legacyApi";
import { splitProductDefaults, withAcceptedDefaults } from "./productDefaults";

const op = (netAmount?: number | null, retakeAmount?: number | null, term?: number | null): CredOperDto => ({
  financialProduct: 1,
  assets: [{ equipment: { netAmount, retakeAmount, brand: "Seat" } }],
  conditions: [{ term, implicitRate: 5 }],
});

describe("splitProductDefaults", () => {
  it("fills blank values without asking", () => {
    const { silent, conflicts } = splitProductDefaults(op(null, undefined, null), op(20000, 2000, 60));
    expect(conflicts).toEqual([]);
    expect(silent.assets?.[0]?.equipment).toMatchObject({ netAmount: 20000, retakeAmount: 2000 });
    expect(silent.conditions?.[0]?.term).toBe(60);
  });

  it("asks about each value on screen the product would change, keeping it meanwhile", () => {
    const defaults = { ...op(20000, 2000, 60), amount: 18000 };
    const { silent, conflicts } = splitProductDefaults(op(15000, 2000, 48), defaults);
    expect(conflicts).toEqual([
      { field: "netAmount", current: 15000, proposed: 20000 },
      { field: "term", current: 48, proposed: 60 },
    ]);
    expect(silent.assets?.[0]?.equipment).toMatchObject({ netAmount: 15000, retakeAmount: 2000, brand: "Seat" });
    expect(silent.conditions?.[0]).toMatchObject({ term: 48, implicitRate: 5 });
    // What isn't on screen comes from the product
    expect(silent.amount).toBe(18000);
  });

  it("keeps a value the product has no default for, without asking", () => {
    const { silent, conflicts } = splitProductDefaults(op(15000, null, 48), op(null, null, null));
    expect(conflicts).toEqual([]);
    expect(silent.assets?.[0]?.equipment?.netAmount).toBe(15000);
    expect(silent.conditions?.[0]?.term).toBe(48);
  });
});

describe("withAcceptedDefaults", () => {
  it("applies only the accepted ones", () => {
    const out = withAcceptedDefaults(op(15000, 1000, 48), [{ field: "term", current: 48, proposed: 60 }]);
    expect(out.conditions?.[0]).toMatchObject({ term: 60, implicitRate: 5 });
    expect(out.assets?.[0]?.equipment).toMatchObject({ netAmount: 15000, brand: "Seat" });
  });
});
