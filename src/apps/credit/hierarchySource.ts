import type { StructNodeDto, StructScopeDto } from "@platform/api/generated/MontraPOSApi";
import type { HierarchyNode } from "@platform/features/workContext/hierarchy";
import { UNNAMED } from "@platform/features/workContext/nodeLabels";
import {
  pageParams,
  type HierarchySource,
  type ListArg,
  type ListPage,
} from "@platform/features/workContext/hierarchySource";

// Montra Credit's hierarchy: struct nodes, scoped to the signed-in user by the API (ids are
// struct node ids, as CredOperDto stores them):
//   Credit intermediary  GET /api/struct-nodes/intermediaries?search=&page=&pageSize=
//   Supplier             GET /api/struct-nodes/intermediaries/{id}/suppliers?…
//   Vendor               GET /api/struct-nodes/suppliers/{id}/persons?…
//   Profile              GET /api/struct-nodes/me → isSupervisor, ownNodes (the user's own leaf nodes)
// No default context comes from the server: levels with a single option are picked
// (see singleOptionDefaults).

const BASE = "/api/struct-nodes";

const toNode = (dto: StructNodeDto): HierarchyNode | null =>
  typeof dto?.id === "string" && dto.id
    ? {
        id: dto.id,
        name: dto.name || UNNAMED,
        // Whether it's the user's own node (a vendor that isn't means acting on a colleague's behalf)
        ...(typeof dto.isMine === "boolean" ? { isMine: dto.isMine } : {}),
      }
    : null;

const nodes = (items: StructNodeDto[] | null | undefined) =>
  (items ?? []).map(toNode).filter((n): n is HierarchyNode => !!n);

type PagedResult = { items?: StructNodeDto[] | null; page?: number; pageSize?: number; totalCount?: number };

/** A server page: more when the pages so far don't reach totalCount */
function serverPage(data: unknown, arg: ListArg): ListPage | null {
  const result = data as PagedResult | undefined;
  if (!result || !Array.isArray(result.items)) return null;
  const page = result.page ?? arg.page;
  const pageSize = result.pageSize ?? arg.pageSize;
  const hasMore =
    typeof result.totalCount === "number" ? page * pageSize < result.totalCount : result.items.length >= pageSize;
  return { items: nodes(result.items), hasMore };
}

const list = (url: (arg: ListArg) => string) => ({
  request: (arg: ListArg) => ({ url: url(arg), params: pageParams(arg) }),
  read: serverPage,
});

export const CREDIT_HIERARCHY: HierarchySource = {
  // One node (used to check a saved context: an id the API no longer knows answers 400 invalid_id)
  node: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
  profile: {
    request: { url: `${BASE}/me` },
    read: (data) => {
      const scope = data as StructScopeDto | undefined;
      if (!scope || typeof scope !== "object") return null;
      // The user's own vendor nodes (leaves), each under its supplier (parentId)
      const ownNodes = (scope.ownNodes ?? []).flatMap((dto) => {
        const node = toNode(dto);
        return node ? [{ ...node, isMine: true, unitId: dto.parentId ?? null }] : [];
      });
      const self = new Set(ownNodes.map((n) => n.id)).size === 1 ? { id: ownNodes[0].id, name: ownNodes[0].name } : null;
      return { role: scope.isSupervisor ? "supervisor" : "member", self, ownNodes };
    },
  },
  lists: {
    organization: list(() => `${BASE}/intermediaries`),
    unit: list((arg) => `${BASE}/intermediaries/${encodeURIComponent(arg.parentId ?? "")}/suppliers`),
    member: list((arg) => `${BASE}/suppliers/${encodeURIComponent(arg.parentId ?? "")}/persons`),
  },
};
