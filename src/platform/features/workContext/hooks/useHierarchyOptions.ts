import { skipToken } from "@reduxjs/toolkit/query";
import { useDebouncedValue } from "@platform/hooks/useDebouncedValue";
import {
  useGetMembersInfiniteQuery,
  useGetOrganizationsInfiniteQuery,
  useGetUnitsInfiniteQuery,
  type HierarchyPage,
} from "../api/hierarchyApi";
import type { HierarchyNode } from "../hierarchy";

type InfiniteResult = {
  currentData?: { pages: HierarchyPage[] };
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isError: boolean;
  fetchNextPage: () => unknown;
};

export type PagedOptions = {
  items: HierarchyNode[];
  /** First page for the current search has arrived */
  isSettled: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  isError: boolean;
  loadMore: () => void;
};

// `currentData` (not `data`) so results from a previous search never show for the new one
function toPagedOptions(result: InfiniteResult): PagedOptions {
  const pages = result.currentData?.pages;
  return {
    items: pages?.flatMap((p) => p.items) ?? [],
    isSettled: !!pages,
    isLoading: !pages && result.isFetching,
    isLoadingMore: result.isFetchingNextPage,
    hasMore: result.hasNextPage,
    isError: result.isError,
    loadMore: () => {
      if (result.hasNextPage && !result.isFetchingNextPage) result.fetchNextPage();
    },
  };
}

/** Paged, server-searched options for one hierarchy level. `null` parent = not loaded. */
export function useOrganizationOptions(search: string) {
  const debounced = useDebouncedValue(search);
  return toPagedOptions(useGetOrganizationsInfiniteQuery({ search: debounced }));
}

export function useUnitOptions(organizationId: string | null, search: string) {
  const debounced = useDebouncedValue(search);
  return toPagedOptions(
    useGetUnitsInfiniteQuery(organizationId === null ? skipToken : { organizationId, search: debounced }),
  );
}

export function useMemberOptions(unitId: string | null, search: string) {
  const debounced = useDebouncedValue(search);
  return toPagedOptions(useGetMembersInfiniteQuery(unitId === null ? skipToken : { unitId, search: debounced }));
}
