import { describe, expect, it } from "vitest";
import reducer, { presetAssetType, presetBusiness, presetCompany, startBlank } from "../credoperSlice";
import { newAssetKey, templateRequest } from "./useCredOperTemplate";

const blank = () => reducer(undefined, startBlank({ credOperStep: 1, insurances: [] }));

describe("templateRequest (when new-credoper is asked for)", () => {
  it("not before the business, the company and the asset type are all decided", () => {
    let state = reducer(blank(), presetBusiness(4));
    expect(templateRequest(state.data!)).toBeNull();
    state = reducer(state, presetCompany(1));
    expect(templateRequest(state.data!)).toBeNull();
  });

  it("an asset type set for the user (the only one offered) counts as decided", () => {
    const state = reducer(reducer(reducer(blank(), presetBusiness(4)), presetCompany(1)), presetAssetType(1));
    expect(templateRequest(state.data!)).toEqual({ businessId: 4, companyId: 1, assetType: 1 });
  });

  it("no asset (a personal loan) is decided too: null", () => {
    const state = reducer(reducer(reducer(blank(), presetBusiness(2)), presetCompany(1)), presetAssetType(null));
    expect(templateRequest(state.data!)).toEqual({ businessId: 2, companyId: 1, assetType: null });
  });

  it("the financial product isn't needed", () => {
    const state = reducer(reducer(reducer(blank(), presetBusiness(4)), presetCompany(1)), presetAssetType(2));
    expect(state.data?.financialProduct).toBeUndefined();
    expect(templateRequest(state.data!)).not.toBeNull();
  });
});

describe("newAssetKey (which new equipment or building the operation needs)", () => {
  it("equipment or building, of the business in the company; none for no asset or while undecided", () => {
    expect(newAssetKey(1, 4, 2)).toBe("1|4|2");
    expect(newAssetKey(2, 4, 2)).toBe("2|4|2");
    expect(newAssetKey(null, 4, 2)).toBeNull();
    expect(newAssetKey(undefined, 4, 2)).toBeNull();
    expect(newAssetKey(1, 4, null)).toBeNull();
  });
});
