import { useMemo } from "react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { APP_SETTINGS } from "@app/appSettings";
import { isMissingEndpoint } from "@platform/api/devFallback";
import { useGetApiNewsTypesQuery, type NewsTypeDto } from "@platform/api/generated/MontraPOSApi";
import { SAMPLE_NEWS_TYPES } from "./sampleNews";

// The news types this app's portal shows, for their names (NewsDto only carries newsTypeId) and
// the news search's type filter. Only the valid types the app's settings list ([] = the app isn't
// configured for news). Settings → Application reads the whole catalog instead.
//   GET /api/news/types?portal=  →  NewsTypeDto[] { id, abbreviation, description, isValid }

export type NewsType = { id: number; name: string };

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

/**
 * The types with an id, named by abbreviation (the short name; the description is a sentence such
 * as "Noticias relativas a Campanhas"), then description
 */
export const toNewsTypes = (types: NewsTypeDto[]): NewsType[] =>
  types.flatMap((t) =>
    typeof t?.id === "number" ? [{ id: t.id, name: text(t.abbreviation) ?? text(t.description) ?? `Type ${t.id}` }] : [],
  );

/** Development: the sample while the endpoint is missing (or on 401 without a real sign-in) */
const useSample = (error: unknown) =>
  import.meta.env.DEV && !!error && (isMissingEndpoint(error as FetchBaseQueryError) || (error as FetchBaseQueryError).status === 401);

export function useNewsTypes() {
  const query = useGetApiNewsTypesQuery({ portal: APP_SETTINGS.identifier }, { refetchOnMountOrArgChange: false });
  const sample = useSample(query.error);
  const data = useMemo(
    () => (sample ? SAMPLE_NEWS_TYPES : query.currentData ? toNewsTypes(query.currentData) : undefined),
    [sample, query.currentData],
  );
  return { ...query, data, isError: query.isError && !sample };
}
