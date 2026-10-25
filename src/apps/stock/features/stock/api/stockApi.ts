import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { delay, shouldUseSample, unexpectedResponse } from "@platform/api/devFallback";
import { emptySplitApi } from "@platform/api/emptyApi";
import type { HierarchyNode } from "@platform/features/workContext/hierarchy";
import type { Agreement, StockUnitDraft } from "../model/stockUnit";
import { sampleAgreements, sampleCreateStockUnit, sampleStockUnits } from "./sampleStock";

// Stock credit endpoints.
// TODO: placeholder endpoints (not exposed by the backend yet), injected by hand:
//   GET  /api/StockCredit/Agreements?intermediaryId=   →  Agreement[]
//   GET  /api/StockCredit/Units?intermediaryId=        →  StockUnit[]
//   POST /api/StockCredit/Units  { intermediaryId, vendorId, agreementId, equipment, amount, supplierId, invoiceNumber }  →  StockUnit
//        (equipment: the shared equipment detail, EquipmentDto fields + vin)
const AGREEMENTS_URL = "/api/StockCredit/Agreements";
const UNITS_URL = "/api/StockCredit/Units";

export type StockUnitStatus = "submitted" | "approved" | "funded" | "overdue" | "settled";

export const STATUS_LABELS: Record<StockUnitStatus, string> = {
  submitted: "Submitted",
  approved: "Approved",
  funded: "Funded",
  overdue: "Overdue",
  settled: "Settled",
};

/** A financed vehicle, as listed */
export type StockUnit = {
  id: number;
  reference: string;
  /** Brand, model and version */
  vehicle: string;
  vin: string;
  licencePlate: string | null;
  supplier: HierarchyNode;
  agreementNumber: string;
  financialCompany: string;
  amount: number;
  invoiceNumber: string;
  /** yyyy-mm-dd; null until funded */
  fundedOn: string | null;
  /** End of the agreement's term; null until funded */
  dueOn: string | null;
  status: StockUnitStatus;
};

export type CreateStockUnit = {
  intermediaryId: string;
  vendorId: string;
  draft: StockUnitDraft;
  agreement: Agreement;
};

const stockApi = emptySplitApi.enhanceEndpoints({ addTagTypes: ["StockUnit"] }).injectEndpoints({
  endpoints: (build) => ({
    getAgreements: build.query<Agreement[], string>({
      queryFn: async (intermediaryId, _api, _extra, baseQuery) => {
        const result = await baseQuery({ url: AGREEMENTS_URL, params: { intermediaryId } });
        const error = result.error as FetchBaseQueryError | undefined;
        if (shouldUseSample(error)) {
          await delay(200);
          return { data: sampleAgreements(intermediaryId) };
        }
        if (error) return { error };
        return Array.isArray(result.data) ? { data: result.data as Agreement[] } : { error: unexpectedResponse("agreements") };
      },
    }),

    getStockUnits: build.query<StockUnit[], string>({
      queryFn: async (intermediaryId, _api, _extra, baseQuery) => {
        const result = await baseQuery({ url: UNITS_URL, params: { intermediaryId } });
        const error = result.error as FetchBaseQueryError | undefined;
        if (shouldUseSample(error)) return { data: await sampleStockUnits(intermediaryId) };
        if (error) return { error };
        return Array.isArray(result.data) ? { data: result.data as StockUnit[] } : { error: unexpectedResponse("stock units") };
      },
      providesTags: [{ type: "StockUnit", id: "LIST" }],
    }),

    createStockUnit: build.mutation<StockUnit, CreateStockUnit>({
      queryFn: async ({ intermediaryId, vendorId, draft, agreement }, _api, _extra, baseQuery) => {
        const { supplier, equipment, ...rest } = draft;
        const body = {
          intermediaryId,
          vendorId,
          ...rest,
          equipment: { ...equipment, vin: equipment.vin?.trim().toUpperCase() ?? null },
          supplierId: supplier?.id ?? null,
          invoiceNumber: draft.invoiceNumber.trim(),
        };
        const result = await baseQuery({ url: UNITS_URL, method: "POST", body });
        const error = result.error as FetchBaseQueryError | undefined;
        if (shouldUseSample(error)) return { data: await sampleCreateStockUnit(intermediaryId, draft, agreement) };
        if (error) return { error };
        const unit = result.data as StockUnit | undefined;
        return unit && typeof unit.reference === "string" ? { data: unit } : { error: unexpectedResponse("stock unit") };
      },
      invalidatesTags: [{ type: "StockUnit", id: "LIST" }],
    }),
  }),
});

export const { useGetAgreementsQuery, useGetStockUnitsQuery, useCreateStockUnitMutation } = stockApi;
