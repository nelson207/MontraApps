import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { emptySplitApi } from "@platform/api/emptyApi";
import { isMissingEndpoint, unexpectedResponse } from "@platform/api/devFallback";
import { SAMPLE_NEWS_TYPES } from "./sampleNews";

// The news types, for their names (NewsDto only carries newsTypeId) and for the choices of
// Settings → Application.
// TODO: placeholder endpoint (not in the API yet), injected by hand:
//   GET /api/news/types  →  [{ id, name }]
export const NEWS_TYPES_URL = "/api/news/types";

export type NewsType = { id: number; name: string };

const isTypeList = (value: unknown): value is NewsType[] =>
  Array.isArray(value) && value.every((t) => typeof t?.id === "number" && typeof t?.name === "string");

const newsTypesApi = emptySplitApi.injectEndpoints({
  endpoints: (build) => ({
    getNewsTypes: build.query<NewsType[], void>({
      queryFn: async (_arg, _api, _extra, baseQuery) => {
        const result = await baseQuery(NEWS_TYPES_URL);
        const error = result.error as FetchBaseQueryError | undefined;
        // Development: the sample while the endpoint is missing (or on 401 without a real sign-in)
        if (error && import.meta.env.DEV && (isMissingEndpoint(error) || error.status === 401)) {
          return { data: SAMPLE_NEWS_TYPES };
        }
        if (error) return { error };
        if (!isTypeList(result.data)) return { error: unexpectedResponse("news types") };
        return { data: result.data };
      },
      keepUnusedDataFor: 60 * 60,
    }),
  }),
});

export const { useGetNewsTypesQuery } = newsTypesApi;
