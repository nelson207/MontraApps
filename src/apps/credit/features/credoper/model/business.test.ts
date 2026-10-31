import { describe, expect, it } from "vitest";
import {
  AUTO_INSURANCE_BUSINESS_ID,
  BUILDING_ASSET,
  BUSINESSES,
  EQUIPMENT_ASSET,
  amountLabel,
  assetTypeOf,
  assetTypesOf,
  changeAssetType,
  businessOf,
  changeBusiness,
  equipmentModeOf,
  hasEquipment,
  hasFinancing,
  productsOf,
  toAvailableBusinesses,
  withAssetAmount,
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
  assetTypeId: EQUIPMENT_ASSET,
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
    expect(hasFinancing(op(AUTO_INSURANCE_BUSINESS_ID))).toBe(false);
    expect(hasFinancing(op(4))).toBe(true);
  });

  it("the asset type decides the equipment; the business only whether there are several vehicles", () => {
    expect(hasEquipment(op(1))).toBe(true);
    expect(equipmentModeOf(op(1))).toBe("single");
    expect(equipmentModeOf(op(13, { assetTypeId: BUILDING_ASSET }))).toBe("none");
    expect(hasEquipment(op(4, { assetTypeId: null }))).toBe(false);
    // Equipment for a business the app thinks has none: one vehicle
    expect(equipmentModeOf(op(2))).toBe("single");
    expect([EQUIPMENT_ASSET, BUILDING_ASSET, null].map((a) => amountLabel(op(4, { assetTypeId: a })))).toEqual([
      "Equipment amount",
      "Building amount",
      "Loan amount",
    ]);
  });

  it("reads the asset type: chosen; else (opened) its first asset's, or its business's when saved before asset types", () => {
    const opened = (overrides: Partial<CredOperDraft>) => {
      const o = op(4, { id: "op1", ...overrides });
      delete o.assetTypeId;
      return o;
    };
    expect(assetTypeOf(opened({ assets: [{ assetType: BUILDING_ASSET }] }))).toBe(BUILDING_ASSET);
    expect(assetTypeOf(opened({ assets: [{}] }))).toBe(EQUIPMENT_ASSET);
    expect(assetTypeOf(opened({ aplBusinessId: 2, assets: [{}] }))).toBeNull();
    // New, not chosen yet; or to be chosen again
    expect(assetTypeOf(opened({ id: null, assets: [] }))).toBeUndefined();
    expect(assetTypeOf(op(4, { id: "op1", assetTypeId: undefined }))).toBeUndefined();
  });
});

describe("changeAssetType", () => {
  it("to no asset: vehicle details and car insurances go, the amounts stay on the first asset", () => {
    const { next, removed } = changeAssetType(op(4, { insurances: [car("c", "a1"), protection] }), null);
    expect(next.assetTypeId).toBeNull();
    expect(next.assets).toEqual([{ correlationID: "a1", assetType: null, equipment: { netAmount: 20_000, retakeAmount: 2_000, retakePercentage: 10 } }]);
    expect(next.insurances).toEqual([protection]);
    expect(removed).toEqual(["the vehicle details", "1 car insurance"]);
  });

  it("from a building: its details go", () => {
    const building = op(4, { assetTypeId: BUILDING_ASSET, assets: [{ correlationID: "a1", building: { descr: "Flat" } } as never] });
    const { next, removed } = changeAssetType(building, EQUIPMENT_ASSET);
    expect(next.assets).toEqual([{ correlationID: "a1", assetType: EQUIPMENT_ASSET }]);
    expect(removed).toEqual(["the building details"]);
  });

  it("the first choice of a blank operation gives it its first asset", () =>
    expect(changeAssetType(op(4, { assets: undefined }), BUILDING_ASSET)).toEqual({
      next: expect.objectContaining({ assetTypeId: BUILDING_ASSET, assets: [{ assetType: BUILDING_ASSET }] }),
      removed: [],
    }));
});

describe("changeBusiness", () => {
  it("the first choice changes nothing else", () => {
    const { next, removed } = changeBusiness(op(undefined, { assetTypeId: undefined }), 4);
    expect(next.aplBusinessId).toBe(4);
    expect(next.financialProduct).toBe(7);
    expect(removed).toEqual([]);
  });

  it("another business clears the financial product (products depend on the business)", () =>
    expect(changeBusiness(op(4), 1).next.financialProduct).toBeNull());

  it("to a business without the asset type (a personal loan): vehicle details and car insurances go, the amounts stay; the asset type is chosen again", () => {
    const { next, removed } = changeBusiness(op(4, { insurances: [car("c", "a1"), protection] }), 2, [null]);
    expect(next.assets).toEqual([{ correlationID: "a1", assetType: null, equipment: { netAmount: 20_000, retakeAmount: 2_000, retakePercentage: 10 } }]);
    expect(next.insurances).toEqual([protection]);
    expect("assetTypeId" in next && next.assetTypeId).toBeUndefined();
    expect(removed).toEqual(["the vehicle details", "1 car insurance"]);
  });

  it("a business that offers the asset type keeps it", () =>
    expect(changeBusiness(op(4), 1, [null, EQUIPMENT_ASSET]).next.assetTypeId).toBe(EQUIPMENT_ASSET));

  it("from renting to one vehicle: the other vehicles and their car insurances go", () => {
    const renting = op(13, { assets: [vehicle("a1"), vehicle("a2"), vehicle("a3")], insurances: [car("c1", "a1"), car("c2", "a2")] });
    const { next, removed } = changeBusiness(renting, 4, [EQUIPMENT_ASSET]);
    expect(next.assets?.map((a) => a.correlationID)).toEqual(["a1"]);
    expect(next.insurances.map((i) => i.id)).toEqual(["c1"]);
    expect(removed).toEqual(["2 other vehicles", "1 car insurance"]);
  });

  it("to auto insurance: credit protections go (no credit to protect)", () => {
    const { next, removed } = changeBusiness(op(4, { insurances: [car("c", "a1"), protection] }), AUTO_INSURANCE_BUSINESS_ID, [EQUIPMENT_ASSET]);
    expect(next.insurances.map((i) => i.id)).toEqual(["c"]);
    expect(removed).toEqual(["1 credit protection"]);
  });

  it("a personal loan without vehicle data has nothing to remove", () =>
    expect(changeBusiness(op(4, { assets: [{ correlationID: "a1", equipment: { netAmount: 5 } }] }), 2, [null]).removed).toEqual([]));
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

  it("each company's asset types (no asset = null), named by the API or the app", () => {
    const [business] = toAvailableBusinesses([
      { ...credit(1, []), assetTypes: [{ id: null, abbreviation: null }, { id: 1, abbreviation: "Cars" }] },
      { ...credit(2, []), assetTypes: [{ id: 2 }, { id: 1, abbreviation: "Cars" }] },
    ]);
    expect(assetTypesOf(business, 1)).toEqual([{ id: null, label: "No asset" }, { id: 1, label: "Cars" }]);
    expect(assetTypesOf(business, 2)).toEqual([{ id: 2, label: "Building" }, { id: 1, label: "Cars" }]);
    expect(assetTypesOf(business, null).map((a) => a.id)).toEqual([null, 1, 2]);
  });

  it("an asset type without an id is no asset", () => {
    const [business] = toAvailableBusinesses([{ ...credit(1, []), assetTypes: [{ abbreviation: "Sem bem" }, { id: 1 }] }]);
    expect(assetTypesOf(business, 1)).toEqual([{ id: null, label: "Sem bem" }, { id: 1, label: "Equipment" }]);
  });

  it("keeps the API's names, with the app's traits; unknown ids get defaults", () => {
    const [renting, other] = toAvailableBusinesses([
      { companyId: 1, companyAbbreviation: "Lisboa", id: 13, abbreviation: "Renting (API)", description: "Fleet", financialProducts: [] },
      { companyId: 1, id: 77, abbreviation: null, description: "Factoring", financialProducts: null },
      { abbreviation: "No id" },
    ]);
    expect(renting).toMatchObject({ id: 13, label: "Renting (API)", description: "Fleet", equipment: "multiple" });
    expect(other).toMatchObject({ id: 77, label: "Factoring", equipment: "none", financing: true });
    expect(other.offers).toEqual([{ companyId: 1, companyLabel: "Company 1", financialProducts: [], assetTypes: [] }]);
    // The operation stores the id only: its name is remembered for the header and the summary
    expect(businessOf(op(77))?.label).toBe("Factoring");
  });
});

describe("withAssetAmount", () => {
  const assets = [{ equipment: { netAmount: 1, quantity: 3 } }, { equipment: { netAmount: 2 } }];

  it.each([4, 1])("business %i: also the purchase amount, and the asset's amount and base amount × the quantity", (aplBusinessId) => {
    const next = withAssetAmount({ aplBusinessId, assets }, 0, 1000);
    expect(next[0]).toMatchObject({ amount: 3000, baseAmount: 3000, equipment: { netAmount: 1000, purchaseAmount: 1000, quantity: 3 } });
    expect(next[1]).toBe(assets[1]);
  });

  it("no quantity counts as one", () =>
    expect(withAssetAmount({ aplBusinessId: 4, assets }, 1, 500)[1]).toMatchObject({ amount: 500, baseAmount: 500 }));

  it("other businesses: only the net amount", () =>
    expect(withAssetAmount({ aplBusinessId: 13, assets }, 0, 1000)[0]).toEqual({ equipment: { netAmount: 1000, quantity: 3 } }));

  it("no asset yet: the first one is made", () =>
    expect(withAssetAmount({ aplBusinessId: 1 }, 0, 10)).toEqual([{ amount: 10, baseAmount: 10, equipment: { netAmount: 10, purchaseAmount: 10 } }]));
});
