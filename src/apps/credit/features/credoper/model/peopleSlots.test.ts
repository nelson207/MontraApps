import { describe, expect, it } from "vitest";
import type { CredOperDto, CredOperIntervDto } from "@platform/api/legacy/legacyApi";
import { COMPANY_ENTITY_TYPE_ID } from "./credOperDraft";
import { pageOfPerson, peopleSlots } from "./peopleSlots";

const CUSTOMER = 1;
const SECOND = 2;
const GUARANTOR = 4;
const op = (...types: number[]): CredOperDto => ({
  interventions: types.map((credOperIntervType, i): CredOperIntervDto => ({ correlationID: `p${i}`, credOperIntervType, entity: {} })),
});
const layout = (o: CredOperDto) =>
  peopleSlots(o).map((s) => (s.kind === "person" ? s.index : s.blocked ? `+${s.person}(blocked)` : `+${s.person}`));

describe("people of a proposal: places on the row", () => {
  it("customer alone: then the cards to add a second holder and a guarantor", () =>
    expect(layout(op(CUSTOMER))).toEqual([0, "+secondHolder", "+guarantor"]));

  it("guarantors start third, even without a second holder", () =>
    expect(layout(op(CUSTOMER, GUARANTOR))).toEqual([0, "+secondHolder", 1, "+guarantor"]));

  it("the second holder is next to the customer, whenever they were added", () =>
    expect(layout(op(CUSTOMER, GUARANTOR, SECOND))).toEqual([0, 2, 1, "+guarantor"]));

  it("a company customer: the second holder's place says why there's none", () => {
    const company = op(CUSTOMER, GUARANTOR);
    company.interventions![0].entity = { entityTypeId: COMPANY_ENTITY_TYPE_ID };
    expect(layout(company)).toEqual([0, "+secondHolder(blocked)", 1, "+guarantor"]);
  });

  it("the card to add a guarantor only in a free place: never a row of its own", () => {
    expect(layout(op(CUSTOMER, SECOND, GUARANTOR, GUARANTOR))).toEqual([0, 1, 2, 3]);
    expect(layout(op(CUSTOMER, SECOND, GUARANTOR, GUARANTOR, GUARANTOR))).toEqual([0, 1, 2, 3, 4, "+guarantor"]);
  });

  it("the page a person is on", () => {
    const slots = peopleSlots(op(CUSTOMER, GUARANTOR, GUARANTOR, GUARANTOR));
    expect(pageOfPerson(slots, 0)).toBe(0);
    // customer, +second holder, guarantor 1, guarantor 2 | guarantor 3
    expect(pageOfPerson(slots, 3)).toBe(1);
  });
});
