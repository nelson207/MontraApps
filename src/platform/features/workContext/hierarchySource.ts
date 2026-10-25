import {
  isNode,
  type CompleteSelection,
  type HierarchyLevel,
  type HierarchyNode,
  type OwnNode,
  type UserRole,
} from "./hierarchy";

// Where an app's working-context hierarchy comes from (WORK_CONTEXT.source): one request
// for the user's profile and one per level, plus how to read their answers.
// The platform does the paging, searching, caching and the development sample.

export type HierarchyRequest = { url: string; params?: Record<string, string | number> };

export type ListArg = { parentId: string | null; search: string; page: number; pageSize: number };

export type ListPage = { items: HierarchyNode[]; hasMore: boolean };

export type ProfileInfo = {
  role: UserRole;
  self: HierarchyNode | null;
  /** The user's own member nodes with their unit (none known: [] or absent) */
  ownNodes?: OwnNode[];
  /** The server's default context; when absent, it's built from single-option levels */
  defaults?: CompleteSelection;
};

export type HierarchySource = {
  /** One node by id, when the API has it: used to check that a saved context is still valid */
  node?: (id: string) => HierarchyRequest;
  profile: { request: HierarchyRequest; read: (data: unknown) => ProfileInfo | null };
  lists: Record<
    HierarchyLevel,
    { request: (arg: ListArg) => HierarchyRequest; read: (data: unknown, arg: ListArg) => ListPage | null }
  >;
};

/** Paging params, leaving an empty search out */
export const pageParams = ({ search, page, pageSize }: ListArg) => ({
  ...(search ? { search } : {}),
  page,
  pageSize,
});

const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** A page of a list the server returns whole (searched and paged here) */
export function localPage(nodes: HierarchyNode[], { search, page, pageSize }: ListArg): ListPage {
  const matches = search ? nodes.filter((n) => normalize(n.name).includes(normalize(search))) : nodes;
  const start = (page - 1) * pageSize;
  return { items: matches.slice(start, start + pageSize), hasMore: start + pageSize < matches.length };
}

const isNodeList = (value: unknown): value is HierarchyNode[] => Array.isArray(value) && value.every(isNode);

/**
 * The original placeholder contract (Lawyer, Stock, Factoring):
 *   GET {list url}?search=&page=1&pageSize=20  →  { items: [{ id, name }], hasMore }
 *   GET {me}                                   →  { role, self: { organization, unit, member } }
 * The server must scope results to the user's role (a member only gets their own nodes).
 */
export function pagedHierarchySource(urls: {
  me: string;
  organizations: string;
  units: (organizationId: string) => string;
  members: (unitId: string) => string;
}): HierarchySource {
  const readPage = (data: unknown): ListPage | null => {
    const page = data as ListPage | undefined;
    return page && isNodeList(page.items) && typeof page.hasMore === "boolean" ? page : null;
  };
  const list = (url: (parentId: string) => string) => ({
    request: (arg: ListArg) => ({ url: url(encodeURIComponent(arg.parentId ?? "")), params: pageParams(arg) }),
    read: readPage,
  });

  return {
    profile: {
      request: { url: urls.me },
      read: (data) => {
        const me = data as { role?: unknown; self?: Partial<CompleteSelection> } | undefined;
        const self = me?.self;
        if ((me?.role !== "supervisor" && me?.role !== "member") || !self) return null;
        if (!isNode(self.organization) || !isNode(self.unit) || !isNode(self.member)) return null;
        return {
          role: me.role,
          self: self.member,
          ownNodes: [{ ...self.member, unitId: self.unit.id }],
          defaults: self as CompleteSelection,
        };
      },
    },
    lists: {
      organization: list(() => urls.organizations),
      unit: list(urls.units),
      member: list(urls.members),
    },
  };
}
