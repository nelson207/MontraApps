import { describe, expect, it } from "vitest";
import {
  AUTO_INSURANCE_BUSINESS_ID,
  BUSINESSES,
  businessOf,
  changeBusiness,
  equipmentModeOf,
  hasEquipment,
  hasFinancing,
  productsOf,
  toAvailableBusinesses,
} from "./business";
import type { CarInsurance, CreditProtectionInsurance, CredOperDraft } from "./credOperDraft";

const car = (id: string, assetRef: string): CarInsurance => ({
  id,
  kind: "car",
  insuranceTypeId: 201,
  assetRef,
  driver: { licenseExpiryDate: "2030-01-01", mainDriverIsCustomer: true },
  protectionIds: [1],
});
const protection: CreditProtectionInsurance = { id: "p", kind: "creditProtection", insuranceTypeId: 101, interventionRef: "c1" };

const vehicle = (ref: string, extra = {}) => ({
  correlationID: ref,
  equipment: { equipmentTypeId: 3, licencePlate: "AA-11-BB", brand: "Peugeot", netAmount: 20_000, retakeAmount: 2_000, retakePercentage: 10, ...extra },
});

const op = (aplBusinessId: number | undefined, overrides: Partial<CredOperDraft> = {}): CredOperDraft => ({
  insurances: [],
  aplBusinessId,
  financialProduct: 7,
  assets: [vehicle("a1")],
  ...overrides,
});

describe("businesses", () => {
  it("the five businesses, in the order they're offered", () =>
    expect(BUSINESSES.map((b) => [b.id, b.label, b.equipment, b.financing])).toEqual([
      [4, "Auto credit", "single", true],
      [2, "Personal loan", "none", true],
      [1, "Financial leasing", "single", true],
      [13, "Renting", "multiple", true],
      [AUTO_INSURANCE_BUSINESS_ID, "Auto insurance", "single", false],
    ]));

  it("reads the operation's business", () => {
    expect(businessOf(op(13))?.label).toBe("Renting");
    expect(businessOf(op(undefined))).toBeNull();
    expect(equipmentModeOf(op(13))).toBe("multiple");
    expect(hasEquipment(op(2))).toBe(false);
    expect(hasEquipment(op(1))).toBe(true);
    expect(hasFinancing(op(AUTO_INSURANCE_BUSINESS_ID))).toBe(false);
    expect(hasFinancing(op(4))).toBe(true);
  });
});

describe("changeBusiness", () => {
  it("the first choice changes nothing else", () => {
    const { next, removed } = changeBusiness(op(undefined), 4);
    expect(next.aplBusinessId).toBe(4);
    expect(next.financialProduct).toBe(7);
    expect(removed).toEqual([]);
  });

  it("another business clears the financial product (products depend on the business)", () =>
    expect(changeBusiness(op(4), 1).next.financialProduct).toBeNull());

  it("to a personal loan: vehicle details and car insurances go, the amounts stay", () => {
    const { next, removed } = changeBusiness(op(4, { insurances: [car("c", "a1"), protection] }), 2);
    expect(next.assets).toEqual([{ correlationID: "a1", equipment: { netAmount: 20_000, retakeAmount: 2_000, retakePercentage: 10 } }]);
    expect(next.insurances).toEqual([protection]);
    expect(removed).toEqual(["the vehicle details", "1 car insurance"]);
  });

  it("from renting to one vehicle: the other vehicles and their car insurances go", () => {
    const renting = op(13, { assets: [vehicle("a1"), vehicle("a2"), vehicle("a3")], insurances: [car("c1", "a1"), car("c2", "a2")] });
    const { next, removed } = changeBusiness(renting, 4);
    expect(next.assets?.map((a) => a.correlationID)).toEqual(["a1"]);
    expect(next.insurances.map((i) => i.id)).toEqual(["c1"]);
    expect(removed).toEqual(["2 other vehicles", "1 car insurance"]);
  });

  it("to auto insurance: credit protections go (no credit to protect)", () => {
    const { next, removed } = changeBusiness(op(4, { insurances: [car("c", "a1"), protection] }), AUTO_INSURANCE_BUSINESS_ID);
    expect(next.insurances.map((i) => i.id)).toEqual(["c"]);
    expect(removed).toEqual(["1 credit protection"]);
  });

  it("a personal loan without vehicle data has nothing to remove", () =>
    expect(changeBusiness(op(4, { assets: [{ correlationID: "a1", equipment: { netAmount: 5 } }] }), 2).removed).toEqual([]));
});

describe("toAvailableBusinesses (GET /api/credit-operations/businesses)", () => {
  const credit = (companyId: number, products: number[]) => ({
    companyId,
    companyAbbreviation: `C${companyId}`,
    id: 4,
    abbreviation: "Auto credit",
    financialProducts: products.map((id) => ({ id, companyId, code: `P${id}` })),
  });

  it("one item per business and company: grouped by business, each company with its own products", () => {
    const [business] = toAvailableBusinesses([credit(1, [1041]), credit(2, [2041, 2042])]);
    expect(business.offers.map((o) => [o.companyId, o.companyLabel, o.financialProducts.map((p) => p.id)])).toEqual([
      [1, "C1", [1041]],
      [2, "C2", [2041, 2042]],
    ]);
    expect(productsOf(business, 2).map((p) => p.id)).toEqual([2041, 2042]);
    // No company yet: every company's, without repeats
    expect(productsOf(business, null).map((p) => p.id)).toEqual([1041, 2041, 2042]);
  });

  it("keeps the API's names, with the app's traits; unknown ids get defaults", () => {
    const [renting, other] = toAvailableBusinesses([
      { companyId: 1, companyAbbreviation: "Lisboa", id: 13, abbreviation: "Renting (API)", description: "Fleet", financialProducts: [] },
      { companyId: 1, id: 77, abbreviation: null, description: "Factoring", financialProducts: null },
      { abbreviation: "No id" },
    ]);
    expect(renting).toMatchObject({ id: 13, label: "Renting (API)", description: "Fleet", equipment: "multiple" });
    expect(other).toMatchObject({ id: 77, label: "Factoring", equipment: "none", financing: true });
    expect(other.offers).toEqual([{ companyId: 1, companyLabel: "Company 1", financialProducts: [] }]);
    // The operation stores the id only: its name is remembered for the header and the summary
    expect(businessOf(op(77))?.label).toBe("Factoring");
  });
});
