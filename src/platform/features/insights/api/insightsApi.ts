import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { INSIGHTS } from "@app/insights";
import { delay, shouldUseSample, unexpectedResponse } from "@platform/api/devFallback";
import { emptySplitApi } from "@platform/api/emptyApi";
import type { InsightsData, InsightsFilters } from "../insightsModel";
import { sampleTools } from "./sampleTools";

// TODO: placeholder endpoint (not exposed by the backend yet), the app's (INSIGHTS.url):
//   GET {url}?organizationId=&unitId=&memberId=&period=  →  InsightsData (see insightsModel.ts)
// The server scopes it to the user (a member only gets their own figures).

export type InsightsResult = InsightsData & { isSample: boolean };

const isInsights = (value: unknown): value is InsightsData => {
  const data = value as InsightsData | undefined;
  return (
    Array.isArray(data?.kpis) &&
    Array.isArray(data?.breakdowns) &&
    Array.isArray(data?.trend?.labels) &&
    Array.isArray(data?.trend?.series)
  );
};

const insightsApi = emptySplitApi.injectEndpoints({
  endpoints: (build) => ({
    getInsights: build.query<InsightsResult, InsightsFilters>({
      queryFn: async (filters, _api, _extra, baseQuery) => {
        const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== null));
        const result = await baseQuery({ url: INSIGHTS.url, params });
        const error = result.error as FetchBaseQueryError | undefined;
        if (shouldUseSample(error)) {
          await delay(350);
          return { data: { ...INSIGHTS.sample(filters, sampleTools(filters)), isSample: true } };
        }
        if (error) return { error };
        return isInsights(result.data)
          ? { data: { ...result.data, isSample: false } }
          : { error: unexpectedResponse("dashboard data") };
      },
    }),
  }),
});

export const { useGetInsightsQuery } = insightsApi;
