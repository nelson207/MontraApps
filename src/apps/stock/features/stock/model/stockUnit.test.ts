import { describe, expect, it } from "vitest";
import type { StockContractDto } from "@platform/api/generated/MontraPOSApi";
import type { EquipmentValue } from "@platform/features/equipment/equipmentModel";
import { emptyStockUnit, supplierIdOf, toNewStockUnit, type StockUnitDraft } from "./stockUnit";
import { validateContractStep, validateInvoiceStep } from "./validation";

const TODAY = "2026-10-06";
const NEW = 0;
const USED = 1;

const CONTRACT: StockContractDto = {
  id: "AQ/contract",
  number: 50001,
  currencyId: "EUR",
  maxPerVehicle: 40_000,
  availableAmount: 30_000,
  suppliers: [{ interventionId: "AQ/supplier", name: "Importer" }],
  equipmentStateIds: [NEW, USED],
  equipmentTypeIds: [7],
  canAddStock: true,
};

const TWO_SUPPLIERS: StockContractDto = {
  ...CONTRACT,
  suppliers: [
    { interventionId: "AQ/a", name: "A" },
    { interventionId: "AQ/b", name: "B" },
  ],
};

const valid = (changes: Partial<StockUnitDraft> = {}, equipment: Partial<EquipmentValue> = {}): StockUnitDraft => ({
  ...emptyStockUnit(CONTRACT),
  amount: 25_000,
  invoiceNumber: "FT 2026/123",
  ...changes,
  equipment: {
    brand: "REN",
    model: "CLIO",
    version: "V1",
    equipmentCategoryId: 3,
    equipmentTypeId: 7,
    equipmentStateId: USED,
    vin: "VF1RJA00X12345678",
    equipYear: 2022,
    equipMonth: 3,
    ...equipment,
  },
});

describe("validateContractStep", () => {
  it("accepts a complete vehicle", () => expect(validateContractStep(valid(), TODAY)).toEqual({}));

  it("requires the whole vehicle, the category and the version too", () =>
    expect(
      Object.keys(validateContractStep(valid({}, { equipmentTypeId: null, equipmentCategoryId: null, equipmentStateId: null, brand: null, model: null, version: null, vin: null, equipYear: null, equipMonth: null }), TODAY)).sort(),
    ).toEqual([
      "equipment.brand",
      "equipment.equipYear",
      "equipment.equipmentCategoryId",
      "equipment.equipmentStateId",
      "equipment.equipmentTypeId",
      "equipment.model",
      "equipment.version",
      "equipment.vin",
    ]));

  it("the plate, description and usage are optional", () =>
    expect(validateContractStep(valid({}, { licencePlate: null, description: null, odometer: null, enginesize: null, doors: null }), TODAY)).toEqual({}));

  it("requires an agreement", () => expect(Object.keys(validateContractStep(valid({ contract: null }), TODAY))).toContain("contract"));

  describe("the amount", () => {
    it.each([null, 0, -1])("%s is refused: it must be above zero", (amount) =>
      expect(validateContractStep(valid({ amount }), TODAY).amount).toBe("Enter an amount above zero."),
    );

    it("can be exactly the limit per vehicle, not above it", () => {
      expect(validateContractStep(valid({ amount: 40_000 }), TODAY)).toEqual({});
      expect(validateContractStep(valid({ amount: 40_000.01 }), TODAY).amount).toBe("Up to €40,000.00 per vehicle on this agreement.");
    });

    it("isn't limited by what is available: the API decides", () => expect(validateContractStep(valid({ amount: 35_000 }), TODAY)).toEqual({}));
  });

  describe("the VIN", () => {
    it.each([["16 characters", "VF1RJA00X1234567"], ["18 characters", "VF1RJA00X123456789"], ["empty", ""], ["missing", null]])("refuses %s", (_, vin) =>
      expect(validateContractStep(valid({}, { vin }), TODAY)["equipment.vin"]).toBe("The VIN has exactly 17 characters."),
    );

    it("accepts any 17 characters", () => expect(validateContractStep(valid({}, { vin: "IOQIOQIOQIOQIOQIO" }), TODAY)).toEqual({}));
  });

  describe("what the contract finances", () => {
    it("refuses a state or type outside its lists", () => {
      const errors = validateContractStep(valid({}, { equipmentStateId: 3, equipmentTypeId: 8 }), TODAY);
      expect(Object.keys(errors).sort()).toEqual(["equipment.equipmentStateId", "equipment.equipmentTypeId"]);
    });

    it.each([[[]], [null]])("%j means no restriction", (none) =>
      expect(
        validateContractStep(valid({ contract: { ...CONTRACT, equipmentStateIds: none, equipmentTypeIds: none } }, { equipmentStateId: 3, equipmentTypeId: 8 }), TODAY),
      ).toEqual({}),
    );
  });

  describe("the year and the month", () => {
    const errorsOf = (equipment: Partial<EquipmentValue>) =>
      Object.keys(validateContractStep(valid({ contract: { ...CONTRACT, equipmentStateIds: [] } }, equipment), TODAY));

    it("new: the year is required, the month isn't", () => {
      expect(errorsOf({ equipmentStateId: NEW, equipMonth: null })).toEqual([]);
      expect(errorsOf({ equipmentStateId: NEW, equipYear: null, equipMonth: null })).toEqual(["equipment.equipYear"]);
    });

    it.each([[USED, "Usado"], [3, "Importado Usado"]])("used (%i, %s): both are required", (equipmentStateId) => {
      expect(errorsOf({ equipmentStateId })).toEqual([]);
      expect(errorsOf({ equipmentStateId, equipMonth: null })).toEqual(["equipment.equipMonth"]);
      expect(errorsOf({ equipmentStateId, equipYear: null, equipMonth: null }).sort()).toEqual(["equipment.equipMonth", "equipment.equipYear"]);
    });

    it("imported new only needs the year", () => expect(errorsOf({ equipmentStateId: 2, equipMonth: null })).toEqual([]));

    it.each([0, 13, 1.5])("month %d is refused", (equipMonth) => expect(errorsOf({ equipMonth })).toEqual(["equipment.equipMonth"]));

    it("a month given for a new vehicle is checked too", () => expect(errorsOf({ equipmentStateId: NEW, equipMonth: 13 })).toEqual(["equipment.equipMonth"]));

    it.each([1899, 2028, 2022.5])("year %d is refused", (equipYear) => expect(errorsOf({ equipYear })).toEqual(["equipment.equipYear"]));

    it("next year's model is fine", () => expect(errorsOf({ equipYear: 2027 })).toEqual([]));
  });
});

describe("validateInvoiceStep", () => {
  it("requires an invoice number of up to 30 characters", () => {
    expect(validateInvoiceStep(valid({ invoiceNumber: "  " })).invoiceNumber).toBe("Enter the invoice number.");
    expect(validateInvoiceStep(valid({ invoiceNumber: "X".repeat(30) }))).toEqual({});
    expect(validateInvoiceStep(valid({ invoiceNumber: "X".repeat(31) })).invoiceNumber).toBe("Up to 30 characters.");
  });

  it("with one supplier nothing has to be chosen: it is preselected", () => {
    expect(validateInvoiceStep(valid())).toEqual({});
    expect(supplierIdOf(valid())).toBe("AQ/supplier");
  });

  it("with more than one, one must be chosen", () => {
    expect(validateInvoiceStep(valid({ contract: TWO_SUPPLIERS })).supplier).toBe("Select the supplier.");
    expect(validateInvoiceStep(valid({ contract: TWO_SUPPLIERS, supplierInterventionId: "AQ/b" }))).toEqual({});
  });
});

describe("toNewStockUnit", () => {
  it("is the API's body (EquipmentDto, like Credit's): its field names, the supplier's opaque id, a clean invoice", () =>
    expect(
      toNewStockUnit(
        valid({ invoiceNumber: " FT 1 " }, { odometer: 100, enginesize: 1200, doors: 5, licencePlate: " ", version: "V1", equipmentCategoryId: 3 }),
        "uuid",
      ),
    ).toEqual({
      correlationId: "uuid",
      supplierInterventionId: "AQ/supplier",
      amount: 25_000,
      invoiceNumber: "FT 1",
      km: 100,
      equipment: {
        equipmentTypeId: 7,
        equipmentCategoryId: 3,
        equipmentStateId: USED,
        equipmentBrand: "REN",
        equipmentModel: "CLIO",
        equipVersion: "V1",
        serialNumber: "VF1RJA00X12345678",
        licencePlate: null,
        equipYear: 2022,
        equipMonth: 3,
        descr: null,
        engineSize: 1200,
        numOfDoors: 5,
      },
    }));

  it("a month not given stays empty", () =>
    expect(toNewStockUnit(valid({}, { equipMonth: null }), "uuid").equipment?.equipMonth).toBeNull());
});
