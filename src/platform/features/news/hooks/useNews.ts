import { useMemo } from "react";
import { useGetNewsFeedQuery } from "../api/newsApi";
import { useGetNewsTypesQuery } from "../api/newsTypesApi";
import { byNewest, toNewsItem, type NewsItem } from "../newsModel";

/**
 * The single source of news for every view (gallery, preview, search, article).
 * Data comes from the RTK Query cache, so all views share one request.
 */
export function useNews() {
  const feed = useGetNewsFeedQuery();
  // Names of the news types (NewsDto only has the id); without them a type shows as "Type n"
  const types = useGetNewsTypesQuery();
  const { data, isError, error, refetch } = feed;
  const isLoading = feed.isLoading || types.isLoading;

  const items = useMemo(() => {
    const now = new Date();
    const typeNames = new Map((types.data ?? []).map((t) => [t.id, t.name]));
    return (data?.items ?? [])
      .map((dto) => toNewsItem(dto, typeNames, now))
      .filter((item): item is NewsItem => item !== null)
      .sort(byNewest);
  }, [data, types.data]);

  const active = useMemo(() => items.filter((item) => item.status === "active"), [items]);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category))].sort((a, b) => a.localeCompare(b)),
    [items],
  );

  const getById = (id: string) => items.find((item) => item.id === id) ?? null;

  return {
    /** All news, newest first */
    items,
    /** Currently valid news (not scheduled, not expired) */
    active,
    categories,
    getById,
    isLoading,
    isError,
    error,
    refetch,
    /** Loaded fine, but there's no news at all */
    isEmpty: !isLoading && !isError && items.length === 0,
    /** Development sample data is being shown */
    isSample: !!data?.isSample,
  };
}
