import { useMemo, useState } from "react";
import {
  useGetApiCompaniesCountriesQuery,
  useGetApiEntitiesActivityTypesQuery,
  useGetApiEntitiesGendersQuery,
  useGetApiEntitiesJuridicalTypesQuery,
  useGetApiEntitiesLegalDocTypesQuery,
  useGetApiEntitiesMaritalStatusesQuery,
  useGetApiEntitiesPhoneTypesQuery,
  useGetApiEntitiesProfessionsQuery,
  type ActivityTypeDto,
  type EntityOptionDto,
  type IntervEntityKind,
  type JuridicalTypeDto,
} from "@platform/api/generated/MontraPOSApi";
import { useDebouncedValue } from "@platform/hooks/useDebouncedValue";

// The lists of the person's form. Paged ones (legal forms, activities, genders…) are searched on the
// server and grow as they're scrolled; the others are one answer, shared by every field.

const PAGE_SIZE = 50;
const NO_ITEMS: never[] = [];

type PagedAnswer<T> = { items?: T[] | null; totalCount?: number };
type PagedArg = { search?: string; page?: number; pageSize?: number };

/** A generated paged list's hook, as this needs it */
export type PagedQuery<A, T> = (
  arg: A & PagedArg,
  options: { skip: boolean },
) => { currentData?: PagedAnswer<T>; isFetching: boolean; isError: boolean };

export type PagedList<T> = {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isError: boolean;
  hasMore: boolean;
  loadMore: () => void;
  setSearch: (search: string) => void;
};

/**
 * One paged list, with the search typed and the pages scrolled so far. `arg` null: not asked for
 * (e.g. activities before a legal form with activity).
 */
export function usePagedList<A extends object, T>(useQuery: PagedQuery<A, T>, arg: A | null): PagedList<T> {
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState<T[][]>([]);
  const [total, setTotal] = useState(0);

  // Another search or list starts over
  const listKey = JSON.stringify([arg, debounced]);
  const [seenKey, setSeenKey] = useState(listKey);
  if (seenKey !== listKey) {
    setSeenKey(listKey);
    setPage(1);
    setPages([]);
    setTotal(0);
  }

  const query = useQuery({ ...(arg as A), search: debounced || undefined, page, pageSize: PAGE_SIZE }, { skip: arg === null });

  // `currentData`: an answer to a previous search is never shown for the new one
  const answer = arg === null ? undefined : query.currentData;
  const received = answer ? (answer.items ?? NO_ITEMS) : undefined;
  if (received && seenKey === listKey && pages[page - 1] !== received) {
    const next = [...pages];
    next[page - 1] = received;
    setPages(next);
    setTotal(answer?.totalCount ?? 0);
  }

  const items = useMemo(() => pages.flat(), [pages]);
  const hasMore = items.length < total;
  return {
    items,
    isLoading: query.isFetching && items.length === 0,
    isLoadingMore: query.isFetching && items.length > 0,
    isError: query.isError,
    hasMore,
    loadMore: () => {
      if (hasMore && !query.isFetching) setPage((current) => current + 1);
    },
    setSearch,
  };
}

const useJuridicalTypesQuery: PagedQuery<{ kind: IntervEntityKind }, JuridicalTypeDto> = (arg, options) =>
  useGetApiEntitiesJuridicalTypesQuery(arg, options);
const useActivityTypesQuery: PagedQuery<{ contextId: number }, ActivityTypeDto> = (arg, options) => useGetApiEntitiesActivityTypesQuery(arg, options);
const useGendersQuery: PagedQuery<object, EntityOptionDto> = (arg, options) => useGetApiEntitiesGendersQuery(arg, options);
const useMaritalStatusesQuery: PagedQuery<object, EntityOptionDto> = (arg, options) => useGetApiEntitiesMaritalStatusesQuery(arg, options);
const useProfessionsQuery: PagedQuery<object, EntityOptionDto> = (arg, options) => useGetApiEntitiesProfessionsQuery(arg, options);
const useLegalDocTypesQuery: PagedQuery<object, EntityOptionDto> = (arg, options) => useGetApiEntitiesLegalDocTypesQuery(arg, options);

const NO_ARG = {};

/** Legal forms of this kind of entity (never by country) */
export const useJuridicalTypes = (kind: IntervEntityKind) => usePagedList(useJuridicalTypesQuery, useMemo(() => ({ kind }), [kind]));
/** Activities (CAE) of a legal form's context; null: its legal form has none */
export const useActivityTypes = (contextId: number | null) =>
  usePagedList(useActivityTypesQuery, useMemo(() => (contextId === null ? null : { contextId }), [contextId]));
export const useGenders = () => usePagedList(useGendersQuery, NO_ARG);
export const useMaritalStatuses = () => usePagedList(useMaritalStatusesQuery, NO_ARG);
export const useProfessions = () => usePagedList(useProfessionsQuery, NO_ARG);
export const useLegalDocTypes = () => usePagedList(useLegalDocTypesQuery, NO_ARG);

/** A list item's name: its description, or else its abbreviation */
export const optionLabel = (item: { description?: string | null; abbreviation?: string | null; id?: number | string | null }): string =>
  item.description?.trim() || item.abbreviation?.trim() || String(item.id ?? "");

/**
 * Every country field: the `id` of GET /api/companies/countries (e.g. PRT, never the alpha-2 code),
 * the same answer as the phone countries'.
 */
export function useCountryOptions() {
  const query = useGetApiCompaniesCountriesQuery(undefined, { refetchOnMountOrArgChange: false });
  const options = useMemo(
    () =>
      (query.data ?? []).flatMap((country) =>
        country.id ? [{ value: country.id, label: country.description?.trim() || country.abbreviation?.trim() || country.id }] : [],
      ),
    [query.data],
  );
  return { options, isLoading: query.isLoading };
}

/** The ids of the phone types, always from the API (GET /api/entities/phone-types). Only a mobile receives an SMS code */
export function usePhoneTypes() {
  const query = useGetApiEntitiesPhoneTypesQuery(undefined, { refetchOnMountOrArgChange: false });
  return useMemo(() => {
    const idOf = (kind: "Mobile" | "Landline") => query.data?.find((type) => type.kind === kind)?.phoneTypeId ?? null;
    return {
      mobileId: idOf("Mobile"),
      landlineId: idOf("Landline"),
      kindOf: (phoneTypeId: number | null | undefined) => query.data?.find((type) => type.phoneTypeId === phoneTypeId)?.kind ?? null,
      isReady: !!query.data,
      isError: query.isError,
      retry: query.refetch,
    };
  }, [query.data, query.isError, query.refetch]);
}
