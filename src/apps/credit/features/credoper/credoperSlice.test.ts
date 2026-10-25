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

describe("credoper slice template (new-credoper only once the business is chosen)", () => {
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
