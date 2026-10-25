import { describe, expect, it } from "vitest";
import { BUSINESSES } from "../model/business";
import { businessChoices } from "./businessChoices";

const ids = (list: { id: number }[]) => list.map((b) => b.id);
const all = BUSINESSES;
const [first, second] = BUSINESSES;

describe("businessChoices", () => {
  it("a quotation offers every available business", () => {
    expect(businessChoices(all, { stage: "quotation", op: {}, proposalBusinesses: [first.id] })).toEqual(all);
  });

  it("a new proposal offers only the businesses that can start in proposal", () => {
    expect(ids(businessChoices(all, { stage: "proposal", op: {}, proposalBusinesses: [second.id] }))).toEqual([second.id]);
  });

  it("nothing configured = no restriction", () => {
    expect(businessChoices(all, { stage: "proposal", op: {}, proposalBusinesses: [] })).toEqual(all);
  });

  it("a proposal converted from a quotation keeps its business (no restriction)", () => {
    const op = { credOperStep: 2 as const, quotationId: 41, aplBusinessId: first.id };
    expect(businessChoices(all, { stage: "proposal", op, proposalBusinesses: [second.id] })).toEqual(all);
  });

  it("an existing proposal always lists its own business", () => {
    const op = { aplBusinessId: first.id };
    expect(ids(businessChoices(all, { stage: "proposal", op, proposalBusinesses: [second.id] }))).toEqual([
      first.id,
      second.id,
    ]);
  });
});
