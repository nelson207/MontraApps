import { describe, expect, it } from "vitest";
import {
  EMPTY_SETTINGS,
  isAdministrator,
  newCompanySetting,
  parseSettings,
  proposalBusinessIds,
  restrictTo,
  ROLE_CLAIM,
  sameSettings,
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
    companies: [{ companyId: 1, businesses: [4, 2], proposalBusinesses: [4, 13], equipmentTypes: [1], equipmentCategories: [11, 12] }],
    emailTypes: { personal: 1, work: 2 },
  };

  it("reads the typed configuration (proposal businesses kept among the available ones)", () =>
    expect(parseSettings(configuration)).toEqual({
      newsTypes: [1, 3],
      companies: [{ companyId: 1, businesses: [4, 2], proposalBusinesses: [4], equipmentTypes: [1], equipmentCategories: [11, 12], extra: undefined }],
      emailTypes: { personal: 1, work: 2 },
      extra: undefined,
    }));

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
