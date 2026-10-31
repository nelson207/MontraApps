import { describe, expect, it } from "vitest";
import {
  assetTypesOf,
  classificationsOf,
  EMPTY_SETTINGS,
  isAdministrator,
  newCompanySetting,
  parseSettings,
  proposalBusinessIds,
  restrictTo,
  ROLE_CLAIM,
  sameSettings,
  setAssetType,
  setBusiness,
  setClassification,
  setClassifications,
  setEquipmentCategory,
  setEquipmentType,
  setProposalBusiness,
  toConfiguration,
} from "./appSettingsModel";

describe("isAdministrator", () => {
  it("reads the standard role claim, one value or a list, any case", () => {
    expect(isAdministrator({ [ROLE_CLAIM]: "Administrator" })).toBe(true);
    expect(isAdministrator({ [ROLE_CLAIM]: ["User", "administrator"] })).toBe(true);
    expect(isAdministrator({ role: "ADMINISTRATOR" })).toBe(true);
  });

  it("is false without the role", () => {
    expect(isAdministrator({ [ROLE_CLAIM]: "User" })).toBe(false);
    expect(isAdministrator({})).toBe(false);
    expect(isAdministrator(null)).toBe(false);
  });
});

describe("parseSettings (ScreenCustomizationConfigurationDto)", () => {
  const configuration = {
    newsTypes: [1, 3],
    companies: [
      {
        companyId: 1,
        businesses: [4, 2],
        proposalBusinesses: [4, 13],
        businessSettings: [
          { businessId: 4, classifications: [1, 3], assetTypes: [null, 1, 1, "x"] },
          { businessId: 4, classifications: [2] },
          { businessId: 13, classifications: [1] },
          { classifications: [1] },
        ],
        equipmentTypes: [1],
        equipmentCategories: [11, 12],
      },
    ],
    emailTypes: { personal: 1, work: 2 },
  };

  it("reads the typed configuration (proposal and classified businesses kept among the available ones, one entry each)", () =>
    expect(parseSettings(configuration)).toEqual({
      newsTypes: [1, 3],
      companies: [
        {
          companyId: 1,
          businesses: [4, 2],
          proposalBusinesses: [4],
          businessSettings: [{ businessId: 4, classifications: [1, 3], assetTypes: [null, 1], extra: undefined }],
          equipmentTypes: [1],
          equipmentCategories: [11, 12],
          extra: undefined,
        },
      ],
      emailTypes: { personal: 1, work: 2 },
      extra: undefined,
    }));

  it("saves the business settings typed, keeping keys it doesn't know", () => {
    const settings = parseSettings({
      companies: [{ companyId: 1, businesses: [4], businessSettings: [{ businessId: 4, classifications: [2], assetTypes: [2], futureKey: 1 }] }],
    });
    expect(toConfiguration(settings).companies?.[0].businessSettings).toEqual([{ businessId: 4, classifications: [2], assetTypes: [2], futureKey: 1 }]);
  });

  it("reads the earlier businessClassifications, saved again as businessSettings", () => {
    const settings = parseSettings({ companies: [{ companyId: 1, businesses: [4], businessClassifications: [{ businessId: 4, classifications: [2] }] }] });
    const saved = toConfiguration(settings).companies?.[0];
    expect(saved?.businessSettings).toEqual([{ businessId: 4, classifications: [2], assetTypes: [] }]);
    expect(saved).not.toHaveProperty("businessClassifications");
  });

  it("reads an older JSON text too; missing lists are empty", () =>
    expect(parseSettings('{"companies":[{"companyId":2}]}').companies).toEqual([newCompanySetting(2)].map((c) => ({ ...c, extra: undefined }))));

  it("gives no settings for empty or unreadable values (never locks anyone out)", () => {
    expect(parseSettings(null)).toEqual(EMPTY_SETTINGS);
    expect(parseSettings("{not json")).toEqual(EMPTY_SETTINGS);
    expect(parseSettings([1, 2])).toEqual(EMPTY_SETTINGS);
    expect(parseSettings({ companies: [{ businesses: [1] }, "x"], emailTypes: { personal: "a" } })).toMatchObject({
      companies: [],
      emailTypes: { personal: null, work: null },
    });
  });

  it("keeps keys it doesn't know when saved again", () => {
    const settings = parseSettings({ ...configuration, futureKey: true, companies: [{ companyId: 1, futureCompanyKey: "x" }] });
    expect(toConfiguration(settings)).toMatchObject({ futureKey: true, companies: [{ companyId: 1, futureCompanyKey: "x" }] });
  });

  it("round-trips", () => expect(sameSettings(parseSettings(toConfiguration(parseSettings(configuration))), parseSettings(configuration))).toBe(true));
});

describe("sameSettings", () => {
  it("ignores the order of the lists", () => {
    const a = { ...EMPTY_SETTINGS, newsTypes: [1, 2], companies: [{ ...newCompanySetting(1), equipmentTypes: [3, 1] }] };
    const b = { ...EMPTY_SETTINGS, newsTypes: [2, 1], companies: [{ ...newCompanySetting(1), equipmentTypes: [1, 3] }] };
    expect(sameSettings(a, b)).toBe(true);
    expect(sameSettings(a, { ...b, emailTypes: { personal: 1, work: null } })).toBe(false);
  });

  it("compares each business's classifications, whatever their order", () => {
    const company = (...entries: [number, number[], (number | null)[]?][]) => ({
      ...EMPTY_SETTINGS,
      companies: [{ ...newCompanySetting(1), businesses: [4, 2], businessSettings: entries.map(([businessId, classifications, assetTypes = []]) => ({ businessId, classifications, assetTypes })) }],
    });
    expect(sameSettings(company([4, [1, 2]], [2, [3]]), company([2, [3]], [4, [2, 1]]))).toBe(true);
    expect(sameSettings(company([4, [1, 2]]), company([4, [1]]))).toBe(false);
    expect(sameSettings(company([4, [], [1, null]]), company([4, [], [null, 1]]))).toBe(true);
    expect(sameSettings(company([4, [], [1, null]]), company([4, [], [1]]))).toBe(false);
  });
});

describe("proposalBusinessIds", () => {
  it("nothing configured, or a company allowing all: no restriction", () => {
    expect(proposalBusinessIds([])).toBeUndefined();
    expect(proposalBusinessIds([newCompanySetting(1)])).toBeUndefined();
  });

  it("a business allowed in any company (its available ones when it has no proposal list)", () => {
    expect(
      proposalBusinessIds([
        { ...newCompanySetting(1), businesses: [4, 2], proposalBusinesses: [4] },
        { ...newCompanySetting(2), businesses: [13] },
      ]),
    ).toEqual([4, 13]);
  });
});

describe("restrictTo", () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 4 }];

  it("keeps the chosen ones; an empty or missing choice means no restriction", () => {
    expect(restrictTo(items, [2, 4], (i) => i.id)).toEqual([{ id: 2 }, { id: 4 }]);
    expect(restrictTo(items, [], (i) => i.id)).toEqual(items);
    expect(restrictTo(items, undefined, (i) => i.id)).toEqual(items);
  });
});

describe("ticking in a company", () => {
  const company = { ...newCompanySetting(1), businesses: [4], proposalBusinesses: [4], equipmentTypes: [9], equipmentCategories: [91] };

  it("a type comes with its categories, and leaves with all of them", () => {
    const on = setEquipmentType(company, 3, true, { categoryIds: [31, 32], allCategoryIds: [31, 32, 33] });
    expect(on).toMatchObject({ equipmentTypes: [9, 3], equipmentCategories: [91, 31, 32] });
    const off = setEquipmentType({ ...on, equipmentCategories: [...on.equipmentCategories, 33] }, 3, false, {
      categoryIds: [31, 32],
      allCategoryIds: [31, 32, 33],
    });
    expect(off).toMatchObject({ equipmentTypes: [9], equipmentCategories: [91] });
  });

  it("a category ticks its type; unticking it keeps the type", () => {
    const on = setEquipmentCategory(company, 3, 31, true);
    expect(on).toMatchObject({ equipmentTypes: [9, 3], equipmentCategories: [91, 31] });
    expect(setEquipmentCategory(on, 3, 31, false)).toMatchObject({ equipmentTypes: [9, 3], equipmentCategories: [91] });
  });

  it("an unavailable business can't start in proposal; starting in proposal makes it available", () => {
    expect(setBusiness(company, 4, false)).toMatchObject({ businesses: [], proposalBusinesses: [] });
    expect(setProposalBusiness(company, 7, true)).toMatchObject({ businesses: [4, 7], proposalBusinesses: [4, 7] });
    expect(setProposalBusiness(company, 4, false)).toMatchObject({ businesses: [4], proposalBusinesses: [] });
  });

  it("a business made available comes with the given classifications, unless it already lists some", () => {
    expect(classificationsOf(setBusiness(company, 7, true, { classificationIds: [1, 2] }), 7)).toEqual([1, 2]);
    const listed = setClassifications(company, 4, [3]);
    expect(classificationsOf(setBusiness(listed, 4, true, { classificationIds: [1, 2] }), 4)).toEqual([3]);
    expect(classificationsOf(setProposalBusiness(company, 7, true, { classificationIds: [1] }), 7)).toEqual([1]);
  });

  it("an unavailable business leaves with its classifications; ticking one makes the business available", () => {
    const listed = setClassifications(company, 4, [1, 2]);
    expect(setBusiness(listed, 4, false).businessSettings).toEqual([]);
    const on = setClassification(company, 7, 2, true);
    expect(on).toMatchObject({ businesses: [4, 7], businessSettings: [{ businessId: 7, classifications: [2] }] });
    expect(classificationsOf(setClassification(on, 7, 2, false), 7)).toEqual([]);
  });

  it("asset types: ticking one (no asset too) makes the business available; a new business comes with the given ones", () => {
    const on = setAssetType(company, 7, null, true);
    expect(on).toMatchObject({ businesses: [4, 7], businessSettings: [{ businessId: 7, assetTypes: [null] }] });
    expect(assetTypesOf(setAssetType(on, 7, 1, true), 7)).toEqual([null, 1]);
    expect(assetTypesOf(setAssetType(on, 7, null, false), 7)).toEqual([]);
    expect(assetTypesOf(setBusiness(company, 8, true, { assetTypeIds: [2] }), 8)).toEqual([2]);
    // Its classifications stay when its asset types change
    expect(classificationsOf(setAssetType(setClassifications(company, 4, [3]), 4, 1, true), 4)).toEqual([3]);
  });

  it("proposal businesses outside the available ones are dropped when read", () =>
    expect(parseSettings({ companies: [{ companyId: 1, proposalBusinesses: [4] }] }).companies[0].proposalBusinesses).toEqual([]));
});
