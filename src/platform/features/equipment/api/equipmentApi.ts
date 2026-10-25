import type { FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { APP_SETTINGS } from "@app/appSettings";
import { emptySplitApi } from "@platform/api/emptyApi";
import { delay, shouldUseSample, unexpectedResponse } from "@platform/api/devFallback";
import { toCodeList, type CodeItem } from "./equipmentLists";
import {
  SAMPLE_BRANDS,
  SAMPLE_STATES,
  SAMPLE_TYPES,
  sampleCategories,
  sampleModels,
  sampleVersions,
} from "./sampleEquipment";

// The lists of the shared equipment detail (every app that finances vehicles), in the order they
// are chosen: type → category → brand → model → version (+ the state). Wrapped as cached
// queries returning code items (and dev sample lists while the API can't be reached; an error the
// API answers, e.g. 502 backend_unavailable, is returned as is).
//   GET /api/equipments/types?application=&companyId=
//   GET /api/equipments/categories?application=&companyId=&equipmentTypeId=
//   GET /api/equipments/brands?equipmentTypeId=&categoryId=
//   GET /api/equipments/models?equipmentTypeId=&categoryId=&brand=          (brand code)
//   GET /api/equipments/versions?equipmentTypeId=&categoryId=&brand=&model= (model code)

type BaseQuery = (arg: FetchArgs) => unknown;

/** Types and categories are listed for the application and, when known, the company */
export type EquipmentScope = { companyId?: number | null };

const scopeParams = ({ companyId }: EquipmentScope) => ({ application: APP_SETTINGS.identifier, companyId: companyId || undefined });

const fetchList = async (args: FetchArgs, what: string, sample: () => unknown[], baseQuery: BaseQuery) => {
  const result = (await baseQuery(args)) as { data?: unknown; error?: FetchBaseQueryError };
  let data = result.data;
  if (shouldUseSample(result.error)) {
    await delay(200);
    data = sample();
  } else if (result.error) return { error: result.error };
  const list = toCodeList(data);
  return list ? { data: list } : { error: unexpectedResponse(what) };
};

const equipmentApi = emptySplitApi.injectEndpoints({
  endpoints: (build) => ({
    getEquipmentTypes: build.query<CodeItem[], EquipmentScope>({
      queryFn: (scope, _api, _extra, baseQuery) =>
        fetchList({ url: "/api/equipments/types", params: scopeParams(scope) }, "equipment types", () => SAMPLE_TYPES, baseQuery as BaseQuery),
    }),
    getEquipmentCategories: build.query<CodeItem[], EquipmentScope & { equipmentTypeId: number }>({
      queryFn: ({ equipmentTypeId, ...scope }, _api, _extra, baseQuery) =>
        fetchList(
          { url: "/api/equipments/categories", params: { ...scopeParams(scope), equipmentTypeId } },
          "equipment categories",
          () => sampleCategories(equipmentTypeId),
          baseQuery as BaseQuery,
        ),
    }),
    getEquipmentBrands: build.query<CodeItem[], { equipmentTypeId: number; categoryId: number }>({
      queryFn: (params, _api, _extra, baseQuery) =>
        fetchList({ url: "/api/equipments/brands", params }, "brands", () => SAMPLE_BRANDS, baseQuery as BaseQuery),
    }),
    getEquipmentModels: build.query<CodeItem[], { equipmentTypeId: number; categoryId: number; brand: string }>({
      queryFn: (params, _api, _extra, baseQuery) =>
        fetchList({ url: "/api/equipments/models", params }, "models", () => sampleModels(params.brand), baseQuery as BaseQuery),
    }),
    getEquipmentVersions: build.query<CodeItem[], { equipmentTypeId: number; categoryId: number; brand: string; model: string }>({
      queryFn: (params, _api, _extra, baseQuery) =>
        fetchList({ url: "/api/equipments/versions", params }, "versions", () => sampleVersions(params.model), baseQuery as BaseQuery),
    }),
    // TODO: placeholder endpoint (not in the new API yet)
    getEquipmentStates: build.query<CodeItem[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        fetchList(
          { url: "/api/BasicLists/FetchEquipmentState", method: "POST", body: {} },
          "equipment states",
          () => SAMPLE_STATES,
          baseQuery as BaseQuery,
        ),
    }),
  }),
});

export const {
  useGetEquipmentBrandsQuery,
  useGetEquipmentModelsQuery,
  useGetEquipmentVersionsQuery,
  useGetEquipmentTypesQuery,
  useGetEquipmentStatesQuery,
  useGetEquipmentCategoriesQuery,
} = equipmentApi;
