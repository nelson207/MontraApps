import { describe, expect, it } from "vitest";
import type { CarInsurance } from "./credOperDraft";
import { carryRefs, convertedFromQuotation, ensureRefs, secondHolderBlock, interventionName, interventionRole, stageOf } from "./credOperDraft";

const car: CarInsurance = {
  id: "i1",
  kind: "car",
  insuranceTypeId: 1,
  assetRef: "a",
  driver: { licenseExpiryDate: "2030-01-01", mainDriverIsCustomer: true },
  protectionIds: [1],
};

describe("ensureRefs", () => {
  it("keeps an existing correlationID", () =>
    expect(ensureRefs({ interventions: [{ correlationID: "keep" }] }).interventions?.[0].correlationID).toBe("keep"));

  it("gives distinct refs to interventions and assets without one", () => {
    const op = ensureRefs({ interventions: [{ correlationID: "" }, {}], assets: [{ correlationID: "" }] });
    const refs = [op.interventions![0].correlationID, op.interventions![1].correlationID, op.assets![0].correlationID];
    refs.forEach((ref) => expect(ref).toBeTruthy());
    expect(new Set(refs).size).toBe(3);
  });

  it("adds insurances: [] when missing and keeps them when present", () => {
    expect(ensureRefs({}).insurances).toEqual([]);
    expect(ensureRefs({ insurances: [car] }).insurances).toEqual([car]);
  });
});

describe("intervention helpers", () => {
  it("roles from credOperIntervType", () => {
    expect(interventionRole({ credOperIntervType: 4 })).toBe("guarantor");
    expect(interventionRole({ credOperIntervType: 2 })).toBe("secondHolder");
    expect(interventionRole({ credOperIntervType: null })).toBe("customer");
  });

  it("name fallbacks", () => {
    expect(interventionName({ entity: { fullName: "Ana Silva" } })).toBe("Ana Silva");
    expect(interventionName({ person: { firstName: "Rui", lastName: "Costa" } })).toBe("Rui Costa");
    expect(interventionName({})).toBe("Unnamed");
  });

  it("stage from credOperStep", () => {
    expect(stageOf({ credOperStep: 2 })).toBe("proposal");
    expect(stageOf({ credOperStep: 1 })).toBe("quotation");
  });
});

describe("carryRefs", () => {
  const previous = {
    interventions: [{ id: "iv1", correlationID: "p1" }, { id: "iv2", correlationID: "p2" }],
    assets: [{ correlationID: "a1" }],
  };

  it("keeps the previous refs when the response has none (matched by id, then by position)", () => {
    const next = carryRefs(previous, { interventions: [{ id: "iv2" }, { id: "iv1", correlationID: "" }], assets: [{}] });
    expect(next.interventions?.map((i) => i.correlationID)).toEqual(["p2", "p1"]);
    expect(next.assets?.[0].correlationID).toBe("a1");
  });

  it("keeps a ref the response sends", () =>
    expect(carryRefs(previous, { interventions: [{ id: "iv1", correlationID: "server" }] }).interventions?.[0].correlationID).toBe("server"));

  it("leaves new items without a ref for ensureRefs", () =>
    expect(carryRefs(previous, { interventions: [{ id: "iv1" }, { id: "iv2" }, { id: "iv3" }] }).interventions?.[2].correlationID).toBeUndefined());
});

describe("secondHolderBlock", () => {
  const person = { credOperIntervType: 1, entity: { entityTypeId: 1 } };
  const company = { credOperIntervType: 1, entity: { entityTypeId: 2 } };
  const second = { credOperIntervType: 2 };

  it("allows a second holder for a person customer without one", () =>
    expect(secondHolderBlock({ interventions: [person] })).toBeNull());

  it("blocks it when the first holder is a company", () =>
    expect(secondHolderBlock({ interventions: [company] })).toBe("The first holder is a company."));

  it("blocks a second one", () =>
    expect(secondHolderBlock({ interventions: [person, second] })).toBe("There is already a second holder."));

  it("blocks it without a first holder", () =>
    expect(secondHolderBlock({ interventions: [] })).toBe("Add the first holder first."));
});

describe("business rules", () => {
  it("a proposal with a quotationId was converted from that quotation", () => {
    expect(convertedFromQuotation({ credOperStep: 2, quotationId: "AQ7c2L0xQuote" } as never)).toBe(true);
    expect(convertedFromQuotation({ credOperStep: 2, quotationId: null } as never)).toBe(false);
    expect(convertedFromQuotation({ credOperStep: 2 })).toBe(false);
    expect(convertedFromQuotation({ credOperStep: 1, quotationId: "AQ7c2L0xQuote" } as never)).toBe(false);
  });
});
