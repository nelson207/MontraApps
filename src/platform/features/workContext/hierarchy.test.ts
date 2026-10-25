import { describe, expect, it } from "vitest";
import {
  changeLevel,
  clearLevel,
  isActingAsOther,
  ownMemberIn,
  sanitizeSelection,
  singleOptionDefaults,
  type HierarchyLevel,
  type HierarchyNode,
  type WorkProfile,
} from "./hierarchy";

const org = { id: "n1", name: "Org" };
const unit = { id: "n101", name: "Unit" };
const self = { id: "n9", name: "Ana" };
const other = { id: "n7", name: "Rui" };
const supervisor: WorkProfile = {
  role: "supervisor",
  self,
  ownNodes: [{ ...self, unitId: unit.id }],
  defaults: { organization: org, unit, member: self },
};
const member: WorkProfile = { ...supervisor, role: "member" };
/** Credit: nobody's "self" is known and nothing is defaulted */
const anonymous: WorkProfile = {
  role: "supervisor",
  self: null,
  ownNodes: [],
  defaults: { organization: null, unit: null, member: null },
};

describe("changeLevel", () => {
  it("a new organization clears unit and member", () =>
    expect(changeLevel({ organization: org, unit, member: other }, "organization", { id: "n2", name: "B" }, supervisor)).toEqual({
      organization: { id: "n2", name: "B" },
      unit: null,
      member: null,
    }));

  it("a member (role) always acts as themselves", () => {
    expect(changeLevel({ organization: org, unit: null, member: null }, "unit", unit, member).member).toEqual({ ...self, isMine: true });
    expect(changeLevel({ organization: org, unit, member: self }, "member", other, member).member).toEqual({ ...self, isMine: true });
  });

  it("a supervisor may pick another member", () =>
    expect(changeLevel({ organization: org, unit, member: self }, "member", other, supervisor).member).toEqual(other));

  it("a member (role) whose own node isn't known picks it like anyone else", () =>
    expect(changeLevel({ organization: org, unit, member: null }, "member", other, { ...member, self: null, ownNodes: [] }).member).toEqual(other));
});

describe("clearLevel (filters: 'All …')", () => {
  it("clears the level and the ones below", () => {
    expect(clearLevel({ organization: org, unit, member: other }, "unit", supervisor)).toEqual({
      organization: org,
      unit: null,
      member: null,
    });
    expect(clearLevel({ organization: org, unit, member: other }, "organization", supervisor)).toEqual({
      organization: null,
      unit: null,
      member: null,
    });
  });

  it("a member (role) keeps themselves as member", () =>
    expect(clearLevel({ organization: org, unit, member: self }, "unit", member).member).toEqual(self));
});

describe("sanitizeSelection", () => {
  it("a context saved before ids were strings (numbers) is ignored: the defaults apply", () =>
    expect(
      sanitizeSelection(
        { organization: { id: 1, name: "Org" }, unit: { id: 101, name: "Unit" }, member: { id: 9, name: "Ana" } } as never,
        supervisor,
      ),
    ).toEqual(supervisor.defaults));

  it("falls back to the profile's defaults when incomplete or malformed", () => {
    expect(sanitizeSelection({ organization: org, unit: null, member: null }, supervisor)).toEqual(supervisor.defaults);
    expect(sanitizeSelection({ intermediary: org } as never, supervisor)).toEqual(supervisor.defaults);
  });

  it("the defaults may be partial (or empty)", () =>
    expect(sanitizeSelection(undefined, anonymous)).toEqual(anonymous.defaults));

  it("a member (role) can't act as someone else", () =>
    expect(sanitizeSelection({ organization: org, unit, member: other }, member)).toEqual(member.defaults));

  it("keeps a complete selection of a supervisor", () =>
    expect(sanitizeSelection({ organization: org, unit, member: other }, supervisor)).toEqual({
      organization: org,
      unit,
      member: other,
    }));
});

describe("isActingAsOther", () => {
  it("the API's isMine decides, even when the user's own node isn't known", () => {
    expect(isActingAsOther({ organization: org, unit, member: { ...other, isMine: false } }, anonymous)).toBe(true);
    expect(isActingAsOther({ organization: org, unit, member: { ...other, isMine: true } }, anonymous)).toBe(false);
    // isMine wins over the id comparison
    expect(isActingAsOther({ organization: org, unit, member: { ...self, isMine: false } }, supervisor)).toBe(true);
  });

  it("without isMine: only when the user's own node is known", () => {
    expect(isActingAsOther({ organization: org, unit, member: other }, supervisor)).toBe(true);
    expect(isActingAsOther({ organization: org, unit, member: self }, supervisor)).toBe(false);
    expect(isActingAsOther({ organization: org, unit, member: other }, anonymous)).toBe(false);
  });
});

describe("singleOptionDefaults (default context)", () => {
  const n = (id: number): HierarchyNode => ({ id: `n${id}`, name: `Node ${id}` });
  /** Options per level, by parent id (organizations under "top") */
  const tree = (lists: Partial<Record<HierarchyLevel, Record<string, HierarchyNode[]>>>) =>
    singleOptionDefaults(async (level, parentId) => {
      const items = lists[level]?.[parentId ?? "top"];
      return items ? { items, hasMore: false } : null;
    });

  it("1 intermediary, 1 supplier, 1 vendor: all set", async () =>
    expect(await tree({ organization: { top: [n(1)] }, unit: { n1: [n(10)] }, member: { n10: [n(100)] } })).toEqual({
      organization: n(1),
      unit: n(10),
      member: n(100),
    }));

  it("2 intermediaries: everything left to choose", async () =>
    expect(await tree({ organization: { top: [n(1), n(2)] }, unit: { n1: [n(10)] } })).toEqual({
      organization: null,
      unit: null,
      member: null,
    }));

  it("1 intermediary with 2 suppliers: only the intermediary", async () =>
    expect(await tree({ organization: { top: [n(1)] }, unit: { n1: [n(10), n(11)] } })).toEqual({
      organization: n(1),
      unit: null,
      member: null,
    }));

  it("a single option on the first page with more pages is not the only one", async () => {
    const defaults = await singleOptionDefaults(async () => ({ items: [n(1)], hasMore: true }));
    expect(defaults.organization).toBeNull();
  });

  it("a list that fails stops the walk", async () =>
    expect(await tree({ organization: { top: [n(1)] } })).toEqual({ organization: n(1), unit: null, member: null }));
});

describe("the user's own node per supplier (vendor nodes under several suppliers)", () => {
  const otherUnit = { id: "n102", name: "Unit B" };
  const otherUnitSelf = { id: "n19", name: "Ana" };
  const twoSuppliers: WorkProfile = {
    role: "supervisor",
    self: null,
    ownNodes: [
      { ...self, unitId: unit.id },
      { ...otherUnitSelf, unitId: otherUnit.id },
    ],
    defaults: { organization: null, unit: null, member: null },
  };

  it("'you' on a supplier is the own node under it, none elsewhere", () => {
    expect(ownMemberIn(twoSuppliers, unit.id)).toEqual({ ...self, isMine: true });
    expect(ownMemberIn(twoSuppliers, otherUnit.id)).toEqual({ ...otherUnitSelf, isMine: true });
    expect(ownMemberIn(twoSuppliers, "n999")).toBeNull();
    expect(ownMemberIn(twoSuppliers, null)).toBeNull();
  });

  it("acting as someone else compares with the own node of that supplier", () => {
    expect(isActingAsOther({ organization: org, unit: otherUnit, member: otherUnitSelf }, twoSuppliers)).toBe(false);
    expect(isActingAsOther({ organization: org, unit: otherUnit, member: self }, twoSuppliers)).toBe(true);
  });

  it("a member (role) gets their own node of the supplier they pick", () => {
    const member2: WorkProfile = { ...twoSuppliers, role: "member" };
    expect(changeLevel({ organization: org, unit: null, member: null }, "unit", otherUnit, member2).member).toEqual({
      ...otherUnitSelf,
      isMine: true,
    });
  });
});
