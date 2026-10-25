import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { emptySplitApi } from "@platform/api/emptyApi";
import { delay, shouldUseSample, unexpectedResponse } from "@platform/api/devFallback";
import { SAMPLE_INSURANCE_TYPES, SAMPLE_PROTECTIONS } from "./sampleInsurance";

// TODO: placeholder endpoints (spec §5, backend follow-up §8). Injected by hand
// instead of living in the generated MontraPOSApi.ts.
//   GET /api/Insurances/Types?kind=CreditProtection|Car   → InsuranceType[]
//   GET /api/Insurances/Types/{typeId}/Protections         → InsuranceProtection[]

export type InsuranceKind = "CreditProtection" | "Car";

export type InsuranceType = { id: number; name: string; description: string };

export type InsuranceProtection = { id: number; name: string; description: string; mandatory: boolean };

const isList = (value: unknown): value is { id: number; name: string }[] =>
  Array.isArray(value) && value.every((v) => typeof v?.id === "number" && typeof v?.name === "string");

const insuranceApi = emptySplitApi.injectEndpoints({
  endpoints: (build) => ({
    getInsuranceTypes: build.query<InsuranceType[], InsuranceKind>({
      queryFn: async (kind, _api, _extra, baseQuery) => {
        const result = await baseQuery({ url: "/api/Insurances/Types", params: { kind } });
        const error = result.error as FetchBaseQueryError | undefined;
        if (shouldUseSample(error)) {
          await delay(250);
          return { data: SAMPLE_INSURANCE_TYPES[kind] };
        }
        if (error) return { error };
        return isList(result.data)
          ? { data: result.data as InsuranceType[] }
          : { error: unexpectedResponse("insurance types") };
      },
    }),
    getInsuranceProtections: build.query<InsuranceProtection[], number>({
      queryFn: async (typeId, _api, _extra, baseQuery) => {
        const result = await baseQuery(`/api/Insurances/Types/${typeId}/Protections`);
        const error = result.error as FetchBaseQueryError | undefined;
        if (shouldUseSample(error)) {
          await delay(250);
          return { data: SAMPLE_PROTECTIONS[typeId] ?? [] };
        }
        if (error) return { error };
        return isList(result.data)
          ? { data: result.data as InsuranceProtection[] }
          : { error: unexpectedResponse("protections") };
      },
    }),
  }),
});

export const { useGetInsuranceTypesQuery, useGetInsuranceProtectionsQuery } = insuranceApi;
