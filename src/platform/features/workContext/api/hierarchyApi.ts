import type { UnknownAction } from "@reduxjs/toolkit";
import type { FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { WORK_CONTEXT } from "@app/workContext";
import { emptySplitApi } from "@platform/api/emptyApi";
import { shouldUseSample, unexpectedResponse } from "@platform/api/devFallback";
import { isNode, singleOptionDefaults, type HierarchyLevel, type HierarchyNode, type WorkProfile } from "../hierarchy";
import type { ListArg } from "../hierarchySource";
import { rememberNodes } from "../nodeLabels";
import { forgetWorkContext, type StoredWorkContext } from "../workContextSlice";
import { isInvalidId } from "@platform/api/problemCode";
import { SAMPLE_PROFILE, sampleHierarchyPage } from "./sampleHierarchy";

// The working-context hierarchy, from the app's source (WORK_CONTEXT.source: which endpoints
// and how to read them, see hierarchySource.ts). Lists are paged and searched; the profile
// says the user's role and default context.

export const HIERARCHY_PAGE_SIZE = 20;

export type HierarchyPage = {
  items: HierarchyNode[];
  hasMore: boolean;
  /** Served by the development sample, not the real API */
  isSample?: boolean;
};

type SearchArg = { search: string };
type Result<T> = { data: T } | { error: FetchBaseQueryError };
/** The bound baseQuery a queryFn receives */
type BaseQuery = (arg: string | FetchArgs) => PromiseLike<{ data?: unknown; error?: unknown }> | { data?: unknown; error?: unknown };

const nextPage = {
  initialPageParam: 1,
  getNextPageParam: (last: HierarchyPage, _all: HierarchyPage[], lastPage: number) =>
    last.hasMore ? lastPage + 1 : undefined,
};

const { source } = WORK_CONTEXT;

/** One page of a level (the development sample when the endpoint isn't there) */
async function loadPage(
  baseQuery: BaseQuery,
  level: HierarchyLevel,
  arg: ListArg,
  dispatch: (action: UnknownAction) => unknown,
): Promise<Result<HierarchyPage>> {
  const list = source.lists[level];
  const result = await baseQuery(list.request(arg));
  const error = result.error as FetchBaseQueryError | undefined;

  if (shouldUseSample(error)) {
    const page = await sampleHierarchyPage(level, arg.parentId, arg.search, arg.page, arg.pageSize);
    rememberNodes(level, page.items);
    return { data: page };
  }
  // The parent id came from a saved context the server no longer recognises: forget that context
  if (arg.parentId && isInvalidId(error)) dispatch(forgetWorkContext());
  if (error) return { error };
  const page = list.read(result.data, arg);
  if (!page) return { error: unexpectedResponse(`${level} list`) };

  rememberNodes(level, page.items);
  return { data: page };
}

const hierarchyApi = emptySplitApi.injectEndpoints({
  endpoints: (build) => {
    const pagedLevel = <Arg extends SearchArg>(level: HierarchyLevel, parentId: (arg: Arg) => string | null) =>
      build.infiniteQuery<HierarchyPage, Arg, number>({
        infiniteQueryOptions: nextPage,
        queryFn: ({ queryArg, pageParam }, api, _extra, baseQuery) =>
          loadPage(
            baseQuery,
            level,
            { parentId: parentId(queryArg), search: queryArg.search, page: pageParam, pageSize: HIERARCHY_PAGE_SIZE },
            api.dispatch,
          ),
      });

    return {
      getWorkProfile: build.query<WorkProfile & { isSample?: boolean }, void>({
        queryFn: async (_arg, api, _extra, baseQuery) => {
          const result = await baseQuery(source.profile.request);
          const error = result.error as FetchBaseQueryError | undefined;
          if (shouldUseSample(error)) return { data: { ...SAMPLE_PROFILE, isSample: true } };
          if (error) return { error };
          const info = source.profile.read(result.data);
          if (!info) return { error: unexpectedResponse("profile") };

          // Without a default from the server, pick the levels that have a single option
          // (2 is enough to tell; a list that fails just leaves its level empty)
          const defaults =
            info.defaults ??
            (await singleOptionDefaults(async (level, parentId) => {
              const page = await loadPage(baseQuery, level, { parentId, search: "", page: 1, pageSize: 2 }, api.dispatch);
              return "data" in page ? page.data : null;
            }));
          rememberNodes("organization", [defaults.organization]);
          rememberNodes("unit", [defaults.unit]);
          rememberNodes("member", [defaults.member]);

          // A saved context the server no longer accepts (its ids changed, or the node is no longer
          // the user's): forget it, so the defaults apply
          const stored = (api.getState() as { workContext: { stored?: StoredWorkContext } }).workContext.stored;
          const savedMember = stored?.origin === "live" ? stored.selection.member : undefined;
          if (source.node && isNode(savedMember)) {
            const check = await baseQuery(source.node(savedMember.id));
            const status = (check.error as { status?: unknown } | undefined)?.status;
            if (isInvalidId(check.error) || status === 403 || status === 404) api.dispatch(forgetWorkContext());
          }

          return { data: { role: info.role, self: info.self, ownNodes: info.ownNodes ?? [], defaults } };
        },
      }),
      getOrganizations: pagedLevel<SearchArg>("organization", () => null),
      getUnits: pagedLevel<SearchArg & { organizationId: string }>("unit", (arg) => arg.organizationId),
      getMembers: pagedLevel<SearchArg & { unitId: string }>("member", (arg) => arg.unitId),
    };
  },
});

export const {
  useGetWorkProfileQuery,
  useGetOrganizationsInfiniteQuery,
  useGetUnitsInfiniteQuery,
  useGetMembersInfiniteQuery,
} = hierarchyApi;

/** The endpoints themselves (tests dispatch them without React) */
export const hierarchyApiForTests = hierarchyApi;
