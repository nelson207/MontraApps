import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { emptySplitApi } from "@platform/api/emptyApi";
import { isMissingEndpoint, unexpectedResponse } from "@platform/api/devFallback";
import { isInvalidId } from "@platform/api/problemCode";
import { APP_SETTINGS } from "@app/appSettings";
import type { NewsDto, NewsDtoPagedResult } from "@platform/api/generated/MontraPOSApi";
import type { NewsSearchParams } from "../newsSearchModel";
import { cachedNewsImage, rememberNewsImage } from "./newsImageCache";
import { SAMPLE_NEWS, sampleNewsSearch } from "./sampleNews";

// The news of MontraAPI, with a development fallback. The portal is the app's identifier
// (MONTRA_APPLICATION_CREDIT…); the backend returns only the news this portal shows.
//   GET /api/news?portal=                    → NewsDto[] valid now, newest first ([] = no news)
//   GET /api/news/search?portal=&search=&newsTypeId=&page=&pageSize=  → { items, page, pageSize, totalCount }
//   GET /api/news/{id}/image                 → image bytes, or 404 (no picture); needs the bearer token
// In development the sample is also used on 401, because sign-in is bypassed locally;
// production builds always show the real data or the real error.

const shouldUseSampleNews = (error: FetchBaseQueryError) =>
  import.meta.env.DEV && (isMissingEndpoint(error) || error.status === 401);

export type NewsFeed = { items: (NewsDto & { image?: string | null })[]; isSample: boolean };

export type NewsSearchResult = {
  items: (NewsDto & { image?: string | null })[];
  page: number;
  pageSize: number;
  totalCount: number;
  isSample: boolean;
};

const newsApi = emptySplitApi.injectEndpoints({
  endpoints: (build) => ({
    getNewsFeed: build.query<NewsFeed, void>({
      queryFn: async (_arg, _api, _extra, baseQuery) => {
        const result = await baseQuery({ url: "/api/news", params: { portal: APP_SETTINGS.identifier } });
        const error = result.error as FetchBaseQueryError | undefined;
        if (error) {
          return shouldUseSampleNews(error) ? { data: { items: SAMPLE_NEWS, isSample: true } } : { error };
        }
        // An empty list is valid ("no news at all"); anything that isn't a list is not
        if (!Array.isArray(result.data)) return { error: unexpectedResponse("news") };
        return { data: { items: result.data as NewsDto[], isSample: false } };
      },
    }),
    /** Every news (valid now or not), searched and paged by the server; empty params are left out */
    searchNews: build.query<NewsSearchResult, NewsSearchParams>({
      queryFn: async (params, _api, _extra, baseQuery) => {
        const result = await baseQuery({ url: "/api/news/search", params });
        const error = result.error as FetchBaseQueryError | undefined;
        if (error) {
          return shouldUseSampleNews(error) ? { data: { ...sampleNewsSearch(params), isSample: true } } : { error };
        }
        const page = result.data as NewsDtoPagedResult | null;
        if (!page || !Array.isArray(page.items)) return { error: unexpectedResponse("news search") };
        return {
          data: {
            items: page.items,
            page: page.page ?? params.page,
            pageSize: page.pageSize ?? params.pageSize,
            totalCount: page.totalCount ?? page.items.length,
            isSample: false,
          },
        };
      },
    }),
    /**
     * Whether a news has a picture (GET /api/news/{id}/image, with the bearer token): the Blob
     * goes to the session cache (newsImageCache), which also remembers a 404 so it isn't asked again.
     */
    getNewsImage: build.query<boolean, string>({
      queryFn: async (id, _api, _extra, baseQuery) => {
        const cached = cachedNewsImage(id);
        if (cached !== undefined) return { data: cached !== null };
        const result = await baseQuery({
          url: `/api/news/${encodeURIComponent(id)}/image`,
          responseHandler: (response) => (response.ok ? response.blob() : response.text()),
        });
        const error = result.error as FetchBaseQueryError | undefined;
        // No picture (404), or an id the API no longer recognises (400 invalid_id): the placeholder
        if (error?.status === 404 || isInvalidId(error)) {
          rememberNewsImage(id, null);
          return { data: false };
        }
        // Other failures aren't remembered (a later visit may succeed); the placeholder is shown
        if (error) return { error };
        const blob = result.data as Blob | null;
        const image = blob && blob.size > 0 ? blob : null;
        rememberNewsImage(id, image);
        return { data: image !== null };
      },
      // The session cache keeps the pictures; this only says whether there is one
      keepUnusedDataFor: 60 * 60,
    }),
  }),
});

export const { useGetNewsFeedQuery, useSearchNewsQuery, useGetNewsImageQuery } = newsApi;
export { newsApi };
