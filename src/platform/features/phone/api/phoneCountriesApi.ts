import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { emptySplitApi } from "@platform/api/emptyApi";
import { shouldUseSample, unexpectedResponse } from "@platform/api/devFallback";
import type { PhoneCountry } from "../phoneModel";
import { SAMPLE_PHONE_COUNTRIES } from "./samplePhoneCountries";

// TODO: placeholder endpoint (not exposed by the backend yet), injected by hand instead of
// living in the generated MontraPOSApi.ts. Same for every Montra app; the first country is the
// default of new phone fields.
//   GET /api/Countries/Phone  →  PhoneCountry[]
//   (PhoneCountry: code, name, dialCode, groups: number[], minDigits, maxDigits,
//    examples: { mobile, landline })
export const PHONE_COUNTRIES_URL = "/api/Countries/Phone";

const isCountryList = (value: unknown): value is PhoneCountry[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(
    (c) =>
      typeof c?.code === "string" &&
      typeof c?.dialCode === "string" &&
      Array.isArray(c?.groups) &&
      typeof c?.minDigits === "number" &&
      typeof c?.maxDigits === "number",
  );

const phoneCountriesApi = emptySplitApi.injectEndpoints({
  endpoints: (build) => ({
    getPhoneCountries: build.query<PhoneCountry[], void>({
      queryFn: async (_arg, _api, _extra, baseQuery) => {
        const result = await baseQuery({ url: PHONE_COUNTRIES_URL });
        const error = result.error as FetchBaseQueryError | undefined;
        if (shouldUseSample(error)) return { data: SAMPLE_PHONE_COUNTRIES };
        if (error) return { error };
        if (!isCountryList(result.data)) return { error: unexpectedResponse("phone countries") };
        // Examples are optional on the wire
        const data = result.data.map((c) => ({
          ...c,
          name: c.name ?? c.code,
          examples: { mobile: c.examples?.mobile ?? "", landline: c.examples?.landline ?? "" },
        }));
        return { data };
      },
      // The list hardly changes: keep it for the whole session
      keepUnusedDataFor: 24 * 60 * 60,
    }),
  }),
});

export const { useGetPhoneCountriesQuery } = phoneCountriesApi;
