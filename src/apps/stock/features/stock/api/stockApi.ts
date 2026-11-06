import {
  MontraPOSApi,
  useGetApiStockContractsByIdCashFlowQuery,
  useGetApiStockContractsByIdNettingAccountsQuery,
  useGetApiStockContractsByIdPaymentEndReasonsQuery,
  useGetApiStockContractsQuery,
  useGetApiStockUnitsByIdCashFlowQuery,
  useGetApiStockUnitsByIdQuery,
  useGetApiStockUnitsQuery,
  type NewStockPaymentDto,
  type NewStockUnitDto,
  type StockPaymentResultDto,
  type StockPaymentStatusDto,
  type StockUnitSaveResultDto,
} from "@platform/api/generated/MontraPOSApi";

// MontraAPI's /api/stock, on the generated client. Two things are added to it:
// - Record ids are opaque tokens that can hold "/" or "+", so they are encoded in paths.
// - The two POSTs and the payment status have a timeout. Without an answer a request would keep the
//   screen waiting for good; a timeout is treated like a network error (same correlationId).
// There is deliberately no shouldUseSample fallback here: it would turn a network error on a payment
// into a sample "success". Development without the API uses Demo access (demo/stockDemoBackend.ts).

export const POST_TIMEOUT_MS = 60_000;
export const STATUS_TIMEOUT_MS = 15_000;

const pathId = (id: string) => encodeURIComponent(id);

export const stockApi = MontraPOSApi.injectEndpoints({
  endpoints: (build) => ({
    addStockUnit: build.mutation<StockUnitSaveResultDto, { contractId: string; body: NewStockUnitDto }>({
      query: ({ contractId, body }) => ({
        url: `/api/stock/contracts/${pathId(contractId)}/units`,
        method: "POST",
        body,
        timeout: POST_TIMEOUT_MS,
      }),
    }),
    payStocks: build.mutation<StockPaymentResultDto, NewStockPaymentDto>({
      query: (body) => ({ url: "/api/stock/payments", method: "POST", body, timeout: POST_TIMEOUT_MS }),
    }),
    getStockPaymentStatus: build.query<StockPaymentStatusDto, string>({
      query: (id) => ({ url: `/api/stock/payments/${pathId(id)}`, timeout: STATUS_TIMEOUT_MS }),
    }),
  }),
});

export const { useAddStockUnitMutation } = stockApi;

export const useStockContracts = (page: number, pageSize: number) => useGetApiStockContractsQuery({ page, pageSize });

export const useStockUnits = (args: { contractId?: string; page: number; pageSize: number }) => useGetApiStockUnitsQuery(args);

export const useStockUnit = (id: string) => useGetApiStockUnitsByIdQuery({ id: pathId(id) });

export const useUnitCashFlow = (id: string) => useGetApiStockUnitsByIdCashFlowQuery({ id: pathId(id) });

export const useContractCashFlow = (id: string) => useGetApiStockContractsByIdCashFlowQuery({ id: pathId(id) });

export const useNettingAccounts = (contractId: string) => useGetApiStockContractsByIdNettingAccountsQuery({ id: pathId(contractId) });

export const usePaymentEndReasons = (contractId: string) => useGetApiStockContractsByIdPaymentEndReasonsQuery({ id: pathId(contractId) });

/** Fresh reads for the payment flow (never from the cache) */
export const readNettingAccounts = (contractId: string) =>
  stockApi.endpoints.getApiStockContractsByIdNettingAccounts.initiate({ id: pathId(contractId) }, { subscribe: false, forceRefetch: true });

export const readStockUnit = (id: string) =>
  stockApi.endpoints.getApiStockUnitsById.initiate({ id: pathId(id) }, { subscribe: false, forceRefetch: true });

export const readPaymentStatus = (id: string) =>
  stockApi.endpoints.getStockPaymentStatus.initiate(id, { subscribe: false, forceRefetch: true });
