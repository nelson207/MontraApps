import { describe, expect, it } from "vitest";
import { CREDIT_HIERARCHY } from "./hierarchySource";

const { profile, lists } = CREDIT_HIERARCHY;
const arg = (parentId: string | null, search = "", page = 1, pageSize = 20) => ({ parentId, search, page, pageSize });

describe("Credit hierarchy requests (api/struct-nodes)", () => {
  it("credit intermediaries (no empty search)", () => {
    expect(lists.organization.request(arg(null))).toEqual({
      url: "/api/struct-nodes/intermediaries",
      params: { page: 1, pageSize: 20 },
    });
    expect(lists.organization.request(arg(null, "auto", 2)).params).toEqual({ search: "auto", page: 2, pageSize: 20 });
  });

  it("suppliers of an intermediary, vendors of a supplier (struct node ids in the path)", () => {
    expect(lists.unit.request(arg("s7", "stand"))).toEqual({
      url: "/api/struct-nodes/intermediaries/s7/suppliers",
      params: { search: "stand", page: 1, pageSize: 20 },
    });
    expect(lists.member.request(arg("s10")).url).toBe("/api/struct-nodes/suppliers/s10/persons");
  });

  it("the profile: GET /api/struct-nodes/me", () => expect(profile.request.url).toBe("/api/struct-nodes/me"));
});

describe("Credit hierarchy answers", () => {
  it("a page of struct nodes, more while below totalCount", () => {
    const page = { items: [{ id: "s1", name: "Auto Crédito", typeId: 1, parentId: null, entityId: 55 }], page: 1, pageSize: 1, totalCount: 2 };
    expect(lists.organization.read(page, arg(null))).toEqual({ items: [{ id: "s1", name: "Auto Crédito" }], hasMore: true });
    expect(lists.member.read({ items: [{ id: "s3", name: "Ana" }], page: 1, pageSize: 20, totalCount: 1 }, arg("s10"))?.hasMore).toBe(false);
  });

  it("the node id is used, never entityId", () =>
    expect(lists.unit.read({ items: [{ id: "s10", name: "Stand Lisboa", entityId: 900 }], totalCount: 1 }, arg("s1"))?.items).toEqual([
      { id: "s10", name: "Stand Lisboa" },
    ]));

  it("isMine is kept: the user's own vendor, or a colleague's", () =>
    expect(
      lists.member.read({ items: [{ id: "s3", name: "Ana", isMine: true }, { id: "s4", name: "Rui", isMine: false }, { id: "s5", name: "Inês" }] }, arg("s10"))
        ?.items,
    ).toEqual([
      { id: "s3", name: "Ana", isMine: true },
      { id: "s4", name: "Rui", isMine: false },
      { id: "s5", name: "Inês" },
    ]));

  it("anything else is an unexpected answer", () => {
    expect(lists.organization.read({ error: "x" }, arg(null))).toBeNull();
    expect(lists.member.read(null, arg("s10"))).toBeNull();
  });

  it("profile: supervisor from isSupervisor; the user is their own node when they have exactly one", () => {
    const ana = { id: "s100", name: "Ana Silva", parentId: "s10" };
    expect(profile.read({ isSupervisor: true, ownNodes: [ana], anchors: ["s10"] })).toEqual({
      role: "supervisor",
      self: { id: "s100", name: "Ana Silva" },
      ownNodes: [{ id: "s100", name: "Ana Silva", isMine: true, unitId: "s10" }],
    });
    // Vendor nodes under two suppliers: "you" is known per supplier (parentId), not overall
    expect(profile.read({ isSupervisor: false, ownNodes: [ana, { ...ana, id: "s101", parentId: "s11" }] })).toEqual({
      role: "member",
      self: null,
      ownNodes: [
        { id: "s100", name: "Ana Silva", isMine: true, unitId: "s10" },
        { id: "s101", name: "Ana Silva", isMine: true, unitId: "s11" },
      ],
    });
    expect(profile.read({ isSupervisor: false, ownNodes: [] })).toEqual({ role: "member", self: null, ownNodes: [] });
    expect(profile.read(null)).toBeNull();
  });
});
