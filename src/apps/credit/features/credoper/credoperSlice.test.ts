import { describe, expect, it } from "vitest";
import type { CreditProtectionInsurance } from "./model/credOperDraft";
import reducer, {
  addInsurance,
  addIntervention,
  presetBusiness,
  loadExisting,
  markSaved,
  patchCredoper,
  setCredoper,
  removeInsurance,
  startNew,
  startBlank,
  applyTemplate,
  updateInsurance,
  applyProductDefaults,
  presetAssetType,
  applyNewAsset,
  presetCustomer,
  presetCompany,
  startConverted,
} from "./credoperSlice";

const protection: CreditProtectionInsurance = {
  id: "p1",
  kind: "creditProtection",
  insuranceTypeId: 7,
  interventionRef: "c1",
};

const started = () => reducer(undefined, startNew({ customerName: "Ana" }));

describe("credoper slice lifecycle", () => {
  it("start and load are clean", () => {
    expect(started().isDirty).toBe(false);
    expect(reducer(undefined, loadExisting({ id: "op5" })).isDirty).toBe(false);
  });

  it("edits make it dirty, saving makes it clean", () => {
    const edited = reducer(started(), patchCredoper({ customerName: "Rui" }));
    expect(edited.isDirty).toBe(true);
    expect(reducer(edited, markSaved({ id: "op9", customerName: "Rui" })).isDirty).toBe(false);
  });

  it("edits made while saving stay, with the server's identity, number and state", () => {
    const sentAt = started().revision;
    const edited = reducer(started(), patchCredoper({ customerName: "Rui" }));
    const saved = reducer(
      edited,
      markSaved({ id: "op9", credOperNumber: 2026001, autUserStateId: 3, stateDate: "2026-11-03", customerName: "Ana" }, sentAt),
    );
    expect(saved.data).toMatchObject({ id: "op9", credOperNumber: 2026001, autUserStateId: 3, stateDate: "2026-11-03", customerName: "Rui" });
    expect(saved.isDirty).toBe(true);
  });

  it("edits made while saving: the next save is of the saved version (its rowVersion, the ids it gave)", () => {
    const start = reducer(undefined, startNew({ insurances: [], correlationId: "c-1", assets: [{ correlationID: "a1" }] }));
    const edited = reducer(start, patchCredoper({ customerName: "Rui" }));
    const saved = reducer(
      edited,
      markSaved({ id: "op9", rowVersion: "rv-1", correlationId: "c-1", entryMoment: "2026-11-04T10:00:00Z", assets: [{ id: "as1" }] }, start.revision),
    );
    expect(saved.data).toMatchObject({ id: "op9", rowVersion: "rv-1", correlationId: "c-1", entryMoment: "2026-11-04T10:00:00Z", customerName: "Rui" });
    expect(saved.data?.assets?.[0]).toMatchObject({ id: "as1", correlationID: "a1" });
  });

  it("a saved operation replaces the draft's identity: the new rowVersion, never the old one", () => {
    const opened = reducer(undefined, loadExisting({ id: "op9", rowVersion: "rv-1", correlationId: "c-1", insurances: [] }));
    const saved = reducer(opened, markSaved({ id: "op9", rowVersion: "rv-2", correlationId: "c-1" }, opened.revision));
    expect(saved.data).toMatchObject({ rowVersion: "rv-2", correlationId: "c-1" });
  });

  it("a save response without insurances keeps the user's insurances", () => {
    const withInsurance = reducer(started(), addInsurance(protection));
    const saved = reducer(withInsurance, markSaved({ id: "op9" }));
    expect(saved.data?.insurances).toEqual([protection]);
  });

  it("a save response with insurances replaces them", () => {
    const withInsurance = reducer(started(), addInsurance(protection));
    expect(reducer(withInsurance, markSaved({ id: "op9", insurances: [] })).data?.insurances).toEqual([]);
  });
});

describe("credoper slice insurances", () => {
  it("add, update and remove by id", () => {
    let state = reducer(started(), addInsurance(protection));
    expect(state.isDirty).toBe(true);
    state = reducer(state, updateInsurance({ id: "p1", changes: { insuranceTypeId: 8 } }));
    expect(state.data?.insurances[0]).toMatchObject({ id: "p1", insuranceTypeId: 8 });
    state = reducer(state, removeInsurance("p1"));
    expect(state.data?.insurances).toEqual([]);
  });
});

describe("credoper slice product defaults", () => {
  it("applies product-derived fields without marking the operation dirty", () => {
    const state = reducer(started(), applyProductDefaults({ aplCompanyId: 7, finProductVersion: 2 }));
    expect(state.data?.aplCompanyId).toBe(7);
    expect(state.data?.customerName).toBe("Ana");
    expect(state.isDirty).toBe(false);
  });

  it("merges product default conditions into the current first condition", () => {
    const withTerm = reducer(started(), loadExisting({ customerName: "Ana", conditions: [{ term: 48, rentTaxTypeId: 3 }] }));
    const state = reducer(withTerm, applyProductDefaults({ firstCondition: { term: 60 } }));
    expect(state.data?.conditions?.[0]).toMatchObject({ term: 60, rentTaxTypeId: 3 });
    expect(state.isDirty).toBe(false);
  });
});

describe("credoper slice responses vs newer edits", () => {
  it("a save response after newer edits keeps the edits, takes the server id, stays dirty", () => {
    const sentAt = reducer(started(), patchCredoper({ customerName: "Rui" }));
    const typedMore = reducer(sentAt, patchCredoper({ customerName: "Rui Costa" }));
    const saved = reducer(typedMore, markSaved({ id: "op9", credOperNumber: 9, customerName: "Rui" }, sentAt.revision));
    expect(saved.data?.customerName).toBe("Rui Costa");
    expect(saved.data?.id).toBe("op9");
    expect(saved.isDirty).toBe(true);
  });

  it("a save response with no newer edits is applied and clean", () => {
    const sentAt = reducer(started(), patchCredoper({ customerName: "Rui" }));
    const saved = reducer(sentAt, markSaved({ id: "op9", customerName: "Rui" }, sentAt.revision));
    expect(saved.isDirty).toBe(false);
    expect(saved.data?.id).toBe("op9");
  });

  it("a calculation response after newer edits is ignored", () => {
    const sentAt = started();
    const typedMore = reducer(sentAt, patchCredoper({ customerName: "Rui" }));
    expect(reducer(typedMore, setCredoper({ customerName: "Ana" }, sentAt.revision)).data?.customerName).toBe("Rui");
  });

  it("a save response without refs keeps the intervention refs (insurance links survive)", () => {
    const loaded = reducer(undefined, loadExisting({ interventions: [{ id: "iv1", correlationID: "p1" }] }));
    expect(reducer(loaded, markSaved({ id: "op9", interventions: [{ id: "iv1" }] })).data?.interventions?.[0].correlationID).toBe("p1");
  });
});

describe("credoper slice interventions", () => {
  it("addIntervention appends to the current list (keeps edits made while it loaded) and is an edit", () => {
    const loaded = reducer(undefined, loadExisting({ interventions: [{ correlationID: "c1", entity: { fullName: "Ana" } }] }));
    const edited = reducer(loaded, patchCredoper({ interventions: [{ correlationID: "c1", entity: { fullName: "Ana Silva" } }] }));
    const state = reducer(edited, addIntervention({ credOperIntervType: 2 }));
    expect(state.data?.interventions?.map((i) => i.entity?.fullName ?? i.credOperIntervType)).toEqual(["Ana Silva", 2]);
    expect(state.data?.interventions?.[1].correlationID).toBeTruthy();
    expect(state.isDirty).toBe(true);
  });
});

describe("credoper slice business", () => {
  it("presetBusiness: the only available business, chosen for the user, isn't an edit", () => {
    const state = reducer(started(), presetBusiness(4));
    expect(state.data?.aplBusinessId).toBe(4);
    expect(state.isDirty).toBe(false);
  });
});

describe("credoper slice template (new-credoper once the asset type is decided)", () => {
  const blank = () => reducer(undefined, startBlank({ credOperStep: 1, creditIntermediaryStructNode: "tok-org", insurances: [] }));
  const template = { aplBusinessId: null, financialProduct: null, aplCompanyId: 0, conditions: [{ term: 60 }], creditIntermediaryStructNode: null };

  it("a new operation starts blank, waiting for its template", () => {
    expect(blank().awaitingTemplate).toBe(true);
    expect(started().awaitingTemplate).toBe(false);
  });

  it("the template goes under what was chosen (business, product, work context) and isn't an edit", () => {
    let state = reducer(blank(), patchCredoper({ aplBusinessId: 4, financialProduct: 1041 }));
    state = reducer(state, applyTemplate(template as never));
    expect(state.awaitingTemplate).toBe(false);
    expect(state.data).toMatchObject({ aplBusinessId: 4, financialProduct: 1041, creditIntermediaryStructNode: "tok-org", conditions: [{ term: 60 }] });
    expect(state.isDirty).toBe(true); // from the business pick, not from the template
  });

  it("the only business, preset for the user, is a chosen business (the template can come) without an edit", () => {
    const state = reducer(blank(), presetBusiness(4));
    expect(state.data?.aplBusinessId).toBe(4);
    expect(state.awaitingTemplate).toBe(true);
    expect(state.isDirty).toBe(false);
    expect(reducer(state, applyTemplate(template as never)).data?.aplBusinessId).toBe(4);
  });

  it("a template arriving for an operation that doesn't wait for one is ignored", () => {
    expect(reducer(started(), applyTemplate(template as never)).data?.conditions).toBeUndefined();
  });
});

describe("credoper slice: what's typed before the template", () => {
  const blank = () => reducer(undefined, startBlank({ credOperStep: 2, insurances: [] }));

  it("the template goes under it item by item: typed values win, the template's rules and defaults fill the rest", () => {
    let state = reducer(blank(), presetAssetType(1));
    state = reducer(state, patchCredoper({ assets: [{ ...state.data!.assets![0], equipment: { brand: "Seat", netAmount: 20000 } }] }));
    const ref = state.data!.assets![0].correlationID;
    state = reducer(
      state,
      applyTemplate({
        assets: [{ amount: 0, equipment: { brand: null, netAmount: 0, metadataResponse: [{ jsonName: "brand" }] } }],
        conditions: [{ term: 60 }],
      } as never),
    );
    expect(state.data?.assets).toEqual([
      { correlationID: ref, assetType: 1, amount: 0, equipment: { brand: "Seat", netAmount: 20000, metadataResponse: [{ jsonName: "brand" }] } },
    ]);
    expect(state.data?.conditions).toEqual([{ term: 60 }]);
  });

  it("presetAssetType: decided for the user, not an edit; the first asset carries it", () => {
    const state = reducer(blank(), presetAssetType(null));
    expect(state.data).toMatchObject({ assetTypeId: null, assets: [{ assetType: null }] });
    expect(state.isDirty).toBe(false);
  });

  it("presetCustomer: a blank proposal's customer, before its template, not an edit (once)", () => {
    let state = reducer(blank(), presetCustomer({ credOperIntervType: 1 }));
    expect(state.data?.interventions).toEqual([{ credOperIntervType: 1, correlationID: expect.any(String) }]);
    expect(state.isDirty).toBe(false);
    state = reducer(state, presetCustomer({ credOperIntervType: 9 }));
    expect(state.data?.interventions).toHaveLength(1);
  });

  it("presetCustomer: with only a guarantor there, the customer comes first and the guarantor stays", () => {
    const guarantor = { credOperIntervType: 4, correlationID: "g1" };
    const state = reducer(reducer(blank(), startBlank({ insurances: [], interventions: [guarantor] })), presetCustomer({ credOperIntervType: 1 }));
    expect(state.data?.interventions?.map((i) => i.credOperIntervType)).toEqual([1, 4]);
  });
});

describe("credoper slice: the new asset of the asset type chosen", () => {
  const blank = () => reducer(undefined, startBlank({ credOperStep: 1, insurances: [] }));

  it("the whole asset goes under the first one (what it has wins: its ref, the asset type, typed values), without an edit", () => {
    let state = reducer(blank(), presetAssetType(1));
    state = reducer(state, patchCredoper({ assets: [{ ...state.data!.assets![0], equipment: { netAmount: 20000 } }] }));
    const ref = state.data!.assets![0].correlationID;
    const dirty = state.isDirty;
    const asset = { assetType: 1, amount: 0, currencyId: "EUR", equipment: { netAmount: 0, currencyId: "EUR" } };
    state = reducer(state, applyNewAsset({ assetType: 1, asset: asset as never }));
    expect(state.data?.assets?.[0]).toEqual({
      correlationID: ref,
      assetType: 1,
      amount: 0,
      currencyId: "EUR",
      equipment: { netAmount: 20000, currencyId: "EUR" },
    });
    expect(state.isDirty).toBe(dirty);
  });

  it("a building asset brings its building", () => {
    const asset = { assetType: 2, currencyId: "EUR", building: { currencyId: "EUR" } };
    const state = reducer(reducer(blank(), presetAssetType(2)), applyNewAsset({ assetType: 2, asset: asset as never }));
    expect(state.data?.assets?.[0]).toMatchObject({ assetType: 2, currencyId: "EUR", building: { currencyId: "EUR" } });
  });

  it("is dropped when the asset type changed meanwhile", () => {
    const asset = { assetType: 1, equipment: { currencyId: "EUR" } };
    const state = reducer(reducer(blank(), presetAssetType(null)), applyNewAsset({ assetType: 1, asset: asset as never }));
    expect(state.data?.assets?.[0]?.equipment).toBeUndefined();
  });
});

describe("credoper slice: the template's asset is the first one", () => {
  const blank = () => reducer(undefined, startBlank({ credOperStep: 1, insurances: [] }));
  const template = { assets: [{ assetType: 1, equipment: { currencyId: "EUR", equipmentTypeId: 3 } }] };

  it("of the asset type chosen: taken (what the user typed still wins)", () => {
    let state = reducer(blank(), presetAssetType(1));
    state = reducer(state, patchCredoper({ assets: [{ ...state.data!.assets![0], equipment: { equipmentTypeId: 9 } }] }));
    state = reducer(state, applyTemplate(template as never));
    expect(state.data?.assets?.[0]?.equipment).toEqual({ equipmentTypeId: 9, currencyId: "EUR" });
  });

  it("of another asset type (changed while it was coming): left out", () => {
    const state = reducer(reducer(blank(), presetAssetType(2)), applyTemplate(template as never));
    expect(state.data?.assets?.[0]).toMatchObject({ assetType: 2 });
    expect(state.data?.assets?.[0]?.equipment).toBeUndefined();
  });
});

describe("the financial product's version", () => {
  const withVersion = () => reducer(undefined, loadExisting({ financialProduct: 1041, finProductVersion: 3 }));

  it("is cleared when the product changes (also to none)", () => {
    expect(reducer(withVersion(), patchCredoper({ financialProduct: 1021 })).data?.finProductVersion).toBeNull();
    expect(reducer(withVersion(), patchCredoper({ financialProduct: null })).data?.finProductVersion).toBeNull();
  });

  it("stays when the product is the same or not part of the edit", () => {
    expect(reducer(withVersion(), patchCredoper({ financialProduct: 1041 })).data?.finProductVersion).toBe(3);
    expect(reducer(withVersion(), patchCredoper({ customerName: "Rui" })).data?.finProductVersion).toBe(3);
  });
});

describe("a proposal made from a quotation", () => {
  const LOCKED = { aplCompanyId: 1, aplBusinessId: 3, credOperTypeId: 300 };
  const converted = () =>
    reducer(undefined, startConverted({ credOperStep: 2, sourceCredOperId: "AQquote", correlationId: "c-9", ...LOCKED }));

  it("starts as unsaved work (it isn't saved yet), as the API returned it", () => {
    const state = converted();
    expect(state.isDirty).toBe(true);
    expect(state.data?.id).toBeUndefined();
    expect(state.data).toMatchObject({ correlationId: "c-9", sourceCredOperId: "AQquote", ...LOCKED });
  });

  it("keeps the quotation's company, business and operation type whatever else changes", () => {
    let state = converted();
    state = reducer(state, patchCredoper({ aplCompanyId: 2, aplBusinessId: 4, credOperTypeId: 301, amount: 9000 }));
    state = reducer(state, presetBusiness(5));
    state = reducer(state, presetCompany(6));
    // A new product's defaults, a calculation
    state = reducer(state, applyProductDefaults({ credOperTypeId: 302 }));
    state = reducer(state, setCredoper({ ...state.data!, credOperTypeId: 303, aplCompanyId: 7 }));
    // …nor is the link to the quotation lost
    state = reducer(state, patchCredoper({ sourceCredOperId: null }));
    expect(state.data).toMatchObject({ ...LOCKED, sourceCredOperId: "AQquote", amount: 9000 });
  });

  it("reopened after its first save: still locked", () => {
    const reopened = reducer(undefined, loadExisting({ id: "APtoken", credOperStep: 2, sourceCredOperId: "AQquote", ...LOCKED }));
    expect(reducer(reopened, patchCredoper({ aplBusinessId: 4 })).data?.aplBusinessId).toBe(3);
  });

  it("another operation, or the saved version, sets them", () => {
    const state = reducer(converted(), loadExisting({ id: "op5", aplCompanyId: 2 }));
    expect(state.data?.aplCompanyId).toBe(2);
    expect(reducer(converted(), markSaved({ id: "APtoken", sourceCredOperId: "AQquote", ...LOCKED, credOperTypeId: 310 })).data?.credOperTypeId).toBe(310);
  });

  it("an operation not made from a quotation changes them freely", () =>
    expect(reducer(started(), patchCredoper({ aplCompanyId: 2 })).data?.aplCompanyId).toBe(2));
});
