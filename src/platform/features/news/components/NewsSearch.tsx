import { useMemo } from "react";
import { APP_SETTINGS } from "@app/appSettings";
import FilterChips from "@platform/components/results/FilterChips";
import { ResultList, ResultRow } from "@platform/components/results/ResultList";
import ResultsFooter from "@platform/components/results/ResultsFooter";
import ResultsPanel from "@platform/components/results/ResultsPanel";
import ResultsToolbar from "@platform/components/results/ResultsToolbar";
import ActiveFilters from "@platform/components/results/ActiveFilters";
import { useUrlFilters } from "@platform/hooks/useUrlFilters";
import { useSearchNewsQuery } from "../api/newsApi";
import { useGetNewsTypesQuery } from "../api/newsTypesApi";
import {
  DEFAULT_PAGE_SIZE,
  newsSearchFromUrl,
  newsSearchParams,
  newsSearchToUrl,
  withFilter,
  type NewsSearchState,
} from "../newsSearchModel";
import { categoryIcon, formatNewsDate, matchRanges, snippetAround, toNewsItem, type NewsItem } from "../newsModel";
import Highlight from "./Highlight";
import { NewsStatusBadge } from "./NewsBadges";
import NewsImage from "./NewsImage";
import { useModuleLabel } from "@platform/features/layout/hooks/useModuleLabel";

/** When the match is only in the body (not shown in the list), show where it matched. */
const bodySnippet = (item: NewsItem, query: string) =>
  query.trim() && matchRanges(`${item.title} ${item.subtitle}`, query).length === 0
    ? snippetAround(item.body, query)
    : null;

// /news: every news (valid now or not), searched, filtered by type and paged by the server
// (GET /api/news/search). State lives in the URL (?q=&type=&page=) so it survives Back and can
// be shared. Only the answer to the latest request is shown (currentData), so a slow older
// answer never replaces a newer one.
function NewsSearch() {
  const moduleLabel = useModuleLabel();
  const { get, set } = useUrlFilters();
  const state = newsSearchFromUrl({ get: (key) => get(key) || null });
  const params = newsSearchParams(state, APP_SETTINGS.identifier, DEFAULT_PAGE_SIZE);
  const { currentData, isFetching, isError, error, refetch } = useSearchNewsQuery(params);
  const types = useGetNewsTypesQuery();

  const update = (next: NewsSearchState) => set(newsSearchToUrl(next));
  const clear = () => update({ q: "", typeId: null, page: 1 });

  const typeNames = useMemo(() => new Map((types.data ?? []).map((t) => [t.id, t.name])), [types.data]);
  const items = useMemo(() => {
    const now = new Date();
    return (currentData?.items ?? []).flatMap((dto) => {
      const item = toNewsItem(dto, typeNames, now);
      return item ? [{ item, dto }] : [];
    });
  }, [currentData, typeNames]);

  const total = currentData?.totalCount ?? 0;
  const hasFilters = !!state.q.trim() || state.typeId !== null;
  const typeName = state.typeId !== null ? (typeNames.get(state.typeId) ?? `Type ${state.typeId}`) : null;

  const toolbar = (
    <ResultsToolbar
      title={moduleLabel({ label: "News" })}
      count={currentData ? total : undefined}
      isSample={currentData?.isSample}
      search={{
        value: state.q,
        onChange: (value) => update(withFilter(state, { q: value })),
        placeholder: "Search news",
        label: "Search news",
      }}
    >
      {(types.data?.length ?? 0) > 1 && (
        <FilterChips
          groups={[
            {
              label: "Type",
              single: true,
              options: (types.data ?? []).map((t) => ({ value: String(t.id), label: t.name })),
              selected: state.typeId !== null ? [String(state.typeId)] : [],
              onChange: (next) => update(withFilter(state, { typeId: next[0] ? Number(next[0]) : null })),
            },
          ]}
        />
      )}
      <ActiveFilters
        items={[
          ...(state.q.trim()
            ? [{ key: "q", label: `“${state.q.trim()}”`, onRemove: () => update(withFilter(state, { q: "" })) }]
            : []),
          ...(typeName ? [{ key: "type", label: typeName, onRemove: () => update(withFilter(state, { typeId: null })) }] : []),
        ]}
        onClearAll={clear}
      />
    </ResultsToolbar>
  );

  return (
    <ResultsPanel
      toolbar={toolbar}
      status={{
        isLoading: !currentData && isFetching,
        isError,
        error,
        errorText: "Couldn't load the news.",
        onRetry: () => refetch(),
        isEmpty: !!currentData && items.length === 0,
        empty: hasFilters
          ? { icon: "bi-search", text: "No news matches your search.", onClear: clear }
          : { icon: "bi-newspaper", text: "No news yet. When news is published for your network, it will appear here." },
      }}
      skeletonRows={4}
      footer={
        <ResultsFooter
          page={params.page}
          pageSize={params.pageSize}
          total={total}
          onPageChange={(next) => {
            update({ ...state, page: next });
            window.scrollTo({ top: 0 });
          }}
          label="News pages"
        />
      }
    >
      <ResultList label={moduleLabel({ label: "News" })}>
        {items.map(({ item, dto }) => {
          const snippet = bodySnippet(item, state.q);
          return (
            <ResultRow
              key={item.id}
              to={`/news/${item.id}`}
              // The article page reads it when the news isn't in the dashboard feed (not valid now)
              state={{ news: dto }}
              accent={item.status === "active" ? "primary" : "secondary"}
              leading={
                <span className="app-results-thumb">
                  <NewsImage item={item} />
                </span>
              }
              title={<Highlight text={item.title} query={state.q} />}
              secondary={
                snippet ? (
                  <span className="fst-italic">
                    <Highlight text={snippet} query={state.q} />
                  </span>
                ) : (
                  item.subtitle && <Highlight text={item.subtitle} query={state.q} />
                )
              }
              meta={[
                <span title={item.category}>
                  <i className={`bi ${categoryIcon(item.category)} me-1`} aria-hidden="true" />
                  {item.category}
                </span>,
                formatNewsDate(item.publishedAt),
              ]}
              trailing={<NewsStatusBadge status={item.status} />}
            />
          );
        })}
      </ResultList>
    </ResultsPanel>
  );
}

export default NewsSearch;
