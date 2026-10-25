import { describe, expect, it } from "vitest";
import type { CredOperDto as DraftDto } from "@platform/api/legacy/legacyApi";
import { fromApiCredOper, toApiCredOper } from "./credOperMapping";

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
