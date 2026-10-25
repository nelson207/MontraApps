import { describe, expect, it } from "vitest";
import type { EquipmentValue } from "@platform/features/equipment/equipmentModel";
import { amountLimitOf, availableOf, emptyStockUnit, type Agreement, type StockUnitDraft } from "./stockUnit";
import { validateContractStep, validateInvoiceStep } from "./validation";

const TODAY = "2026-10-06";
const NEW = 1;
const USED = 2;

const AGREEMENT: Agreement = {
  id: 1,
  number: "STK-2026-001",
  financialCompany: "Banco Atlântico",
  creditLimit: 500_000,
  used: 470_000,
  maxPerUnit: 40_000,
  termDays: 180,
  rate: 4.5,
  equipmentStateIds: [NEW, USED],
};

const valid = (changes: Partial<StockUnitDraft> = {}, equipment: Partial<EquipmentValue> = {}): StockUnitDraft => ({
  ...emptyStockUnit(),
  agreementId: 1,
  amount: 25_000,
  supplier: { id: "s101", name: "Stand Lisboa 01" },
  invoiceNumber: "FT 2026/123",
  ...changes,
  equipment: {
    brand: "Renault",
    model: "Clio",
    version: "Clio 1.0 TCe",
    equipmentTypeId: 1,
    equipmentStateId: USED,
    vin: "VF1RJA00X12345678",
    licencePlate: "AA-00-BB",
    registrationDate: "2023-05-10",
    odometer: 42_000,
    ...equipment,
  },
});

describe("agreement limits", () => {
  it("available is what is left of the credit limit, never below zero", () => {
    expect(availableOf(AGREEMENT)).toBe(30_000);
    expect(availableOf({ ...AGREEMENT, used: 600_000 })).toBe(0);
  });

  it("a vehicle can take the smaller of the available amount and the per-vehicle limit", () => {
    expect(amountLimitOf(AGREEMENT)).toBe(30_000);
    expect(amountLimitOf({ ...AGREEMENT, used: 0 })).toBe(40_000);
  });
});

describe("validateContractStep (agreement, equipment detail, amount)", () => {
  it("accepts a complete vehicle", () => expect(validateContractStep(valid(), AGREEMENT, TODAY)).toEqual({}));

  it("the plate, registration, category, description and usage are optional", () =>
    expect(
      validateContractStep(
        valid({}, { licencePlate: null, registrationDate: null, version: null, odometer: null, description: null }),
        AGREEMENT,
        TODAY,
      ),
    ).toEqual({}));

  it("requires an agreement", () =>
    expect(validateContractStep(valid({ agreementId: null }), undefined, TODAY)).toMatchObject({
      agreement: "Select an agreement.",
    }));

  it("requires brand, model, type, state and a 17-character VIN without I, O or Q", () => {
    const errors = validateContractStep(
      valid({}, { brand: null, model: " ", equipmentTypeId: null, equipmentStateId: null, vin: "VF1RJA00X1234567O" }),
      AGREEMENT,
      TODAY,
    );
    expect(Object.keys(errors).sort()).toEqual([
      "equipment.brand",
      "equipment.equipmentStateId",
      "equipment.equipmentTypeId",
      "equipment.model",
      "equipment.vin",
    ]);
    expect(validateContractStep(valid({}, { vin: "vf1rja00x12345678" }), AGREEMENT, TODAY)).toEqual({});
  });

  it("the registration date can't be in the future", () =>
    expect(validateContractStep(valid({}, { registrationDate: "2026-10-07" }), AGREEMENT, TODAY)).toEqual({
      "equipment.registrationDate": "The registration date can't be in the future.",
    }));

  it("the agreement must finance the vehicle's state", () =>
    expect(validateContractStep(valid(), { ...AGREEMENT, equipmentStateIds: [NEW] }, TODAY)).toEqual({
      "equipment.equipmentStateId": "This agreement doesn't finance vehicles in this state.",
    }));

  it("requires an amount above zero, within the agreement's limits", () => {
    expect(validateContractStep(valid({ amount: null }), AGREEMENT, TODAY)).toEqual({ amount: "Enter the amount to finance." });
    expect(validateContractStep(valid({ amount: 0 }), AGREEMENT, TODAY)).toEqual({ amount: "Enter the amount to finance." });
    expect(validateContractStep(valid({ amount: 35_000 }), AGREEMENT, TODAY)).toEqual({
      amount: "Only €30,000 available on this agreement.",
    });
    expect(validateContractStep(valid({ amount: 45_000 }), { ...AGREEMENT, used: 0 }, TODAY)).toEqual({
      amount: "Up to €40,000 per vehicle on this agreement.",
    });
  });
});

describe("validateInvoiceStep (supplier, invoice)", () => {
  it("accepts a supplier and an invoice number", () => expect(validateInvoiceStep(valid())).toEqual({}));

  it("requires a supplier and an invoice number of up to 30 characters", () => {
    expect(validateInvoiceStep(valid({ supplier: null, invoiceNumber: "  " }))).toEqual({
      supplier: "Select the supplier.",
      invoiceNumber: "Enter the invoice number.",
    });
    expect(validateInvoiceStep(valid({ invoiceNumber: "X".repeat(31) }))).toEqual({
      invoiceNumber: "Up to 30 characters.",
    });
  });
});
