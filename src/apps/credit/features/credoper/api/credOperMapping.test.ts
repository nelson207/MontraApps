import { describe, expect, it } from "vitest";
import type { CredOperDto as DraftDto } from "@platform/api/legacy/legacyApi";
import { assetKindOut, fromApiCredOper, stepNumber, toApiCredOper } from "./credOperMapping";

const draft = (): DraftDto => ({
  id: "AQ7c2L0xOper7",
  amount: 15000,
  aplBusinessId: 1,
  financialProduct: 1041,
  creditIntermediaryStructNode: "snInterm11",
  showRoomStructNode: "snSupplier22",
  salePersonStructNode: "snVendor33",
  credOperClassification: 4,
  description: "Golf for Ana",
  customerName: "Ana Silva",
  customerEmail: { email: "ana@example.com" },
  correlationID: "op-1",
  metadataResponse: [],
  conditions: [{ term: 60, annualRate: 7.5, correlationID: "c-1", flows: [{ amount: 300, correlationID: "f-1" }] }],
  assets: [
    {
      correlationID: "a-1",
      equipment: {
        brand: "VW",
        model: "Golf",
        version: "1.0 TSI",
        doors: 5,
        enginesize: 999,
        registrationDate: "2024-01-10",
        odometer: 12000,
        description: "Blue",
        netAmount: 15000,
        correlationID: "e-1",
      },
    },
  ],
  interventions: [
    { correlationID: "i-1", credOperIntervType: 1, person: { birthDate: "1990-05-01" }, entity: {} },
  ],
});

describe("toApiCredOper", () => {
  const api = toApiCredOper(draft());

  it("sends the initial entry as its amount only: the percentage is a helper", () => {
    const op = draft();
    op.assets![0].equipment = { ...op.assets![0].equipment, retakeAmount: 1500, retakePercentage: 10 };
    const equipment = toApiCredOper(op).assets?.[0]?.equipment as Record<string, unknown>;
    expect(equipment.retakeAmount).toBe(1500);
    expect(equipment).not.toHaveProperty("retakePercentage");
  });

  it("renames the operation fields the new API names differently", () => {
    expect(api).toMatchObject({
      id: "AQ7c2L0xOper7",
      amount: 15000,
      financialProductId: 1041,
      creditIntermediaryStructNodeId: "snInterm11",
      localStructNodeId: "snSupplier22",
      credOperClassificationId: 4,
      descr: "Golf for Ana",
      entityName: "Ana Silva",
    });
  });

  it("renames the vehicle fields", () => {
    expect(api.assets?.[0]?.equipment).toMatchObject({
      equipmentBrand: "VW",
      equipmentModel: "Golf",
      equipVersion: "1.0 TSI",
      numOfDoors: 5,
      engineSize: 999,
      licenceDate: "2024-01-10",
      descr: "Blue",
      netAmount: 15000,
    });
  });

  it("leaves out what only the app keeps", () => {
    const text = JSON.stringify(api);
    for (const key of ["correlationID", "metadataResponse", "customerEmail", "person", "salePersonStructNode", "odometer", "\"brand\""]) {
      expect(text).not.toContain(key);
    }
    expect(api.insurances).toBeUndefined();
  });
});

describe("fromApiCredOper", () => {
  it("brings the API's values back under the app's names", () => {
    const back = fromApiCredOper({ id: "AQ7c2L0xOper9", financialProductId: 2001, descr: "x", assets: [{ equipment: { equipmentBrand: "Seat" } }] });
    expect(back).toMatchObject({ id: "AQ7c2L0xOper9", financialProduct: 2001, description: "x" });
    expect(back.assets?.[0]?.equipment?.brand).toBe("Seat");
  });

  it("keeps what only the app has (customer, people, links) through a round trip", () => {
    const base = draft();
    const answered = { ...toApiCredOper(base), amount: 16000 };
    answered.conditions = [{ ...answered.conditions![0], flows: [{ amount: 310 }] }];
    const back = fromApiCredOper(answered, base);

    expect(back.amount).toBe(16000);
    expect(back.customerEmail).toEqual({ email: "ana@example.com" });
    expect(back.salePersonStructNode).toBe("snVendor33");
    expect(back.correlationID).toBe("op-1");
    expect(back.conditions?.[0]).toMatchObject({ annualRate: 7.5, correlationID: "c-1" });
    expect(back.conditions?.[0]?.flows?.[0]).toMatchObject({ amount: 310, correlationID: "f-1" });
    expect(back.assets?.[0]).toMatchObject({ correlationID: "a-1" });
    expect(back.assets?.[0]?.equipment).toMatchObject({ brand: "VW", odometer: 12000, correlationID: "e-1" });
    expect(back.interventions?.[0]).toMatchObject({ correlationID: "i-1", person: { birthDate: "1990-05-01" } });
  });
});

describe("the step: a number in the draft, a name in the new API", () => {
  it("is sent by name and read back as the number", () => {
    expect(toApiCredOper({ credOperStep: 2 }).credOperStep).toBe("Proposal");
    expect(fromApiCredOper({ credOperStep: "Quotation" }).credOperStep).toBe(1);
    expect(fromApiCredOper(toApiCredOper({ credOperStep: 13 })).credOperStep).toBe(13);
  });

  it("isn't added when the draft has none, and an answer without one keeps the draft's", () => {
    expect("credOperStep" in toApiCredOper({ amount: 1 })).toBe(false);
    expect(fromApiCredOper({ amount: 1 }, { credOperStep: 2 }).credOperStep).toBe(2);
  });

  it("every name has its number", () =>
    expect(["Quotation", "Proposal", "Contract", "MLAContract", "ExternalOperation"].map((s) => stepNumber(s as never))).toEqual([
      1, 2, 3, 13, 99,
    ]));
});

describe("the asset type: an id in the draft (1 = equipment, 2 = building), a kind in the new API", () => {
  it("is sent as the kind (none for no asset) and read back as the id", () => {
    const api = toApiCredOper({ assets: [{ assetType: 2 }, { assetType: 1 }, { assetType: null }] });
    expect(api.assets?.map((a) => a.assetType)).toEqual(["Building", "Equipment", undefined]);
    expect(fromApiCredOper(api).assets?.map((a) => a.assetType)).toEqual([2, 1, undefined]);
  });

  it("an answer without it keeps the draft's; the operation's choice stays in the app", () => {
    expect(fromApiCredOper({ assets: [{ amount: 1 }] }, { assets: [{ assetType: 2 }] }).assets?.[0]?.assetType).toBe(2);
    expect("assetTypeId" in toApiCredOper({ assetTypeId: 1 } as never)).toBe(false);
  });
});

describe("assetKindOut (new-credoper's asset type)", () => {
  it("equipment and building by kind; no asset: none sent", () =>
    expect([1, 2, null, undefined].map(assetKindOut)).toEqual(["Equipment", "Building", undefined, undefined]));
});

describe("assetItem: the asset's position, from 1", () => {
  it("is renumbered on every send, whatever the draft had (vehicles added and removed)", () =>
    expect(toApiCredOper({ assets: [{ assetItem: 2 }, {}, { assetItem: 1 }] }).assets?.map((a) => a.assetItem)).toEqual([1, 2, 3]));
});
