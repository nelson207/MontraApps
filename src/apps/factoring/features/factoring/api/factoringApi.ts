import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import {
  MontraPOSApi,
  useGetApiFactoringAdvancesQuery,
  useGetApiFactoringCessionsByIdQuery,
  useGetApiFactoringContractsByIdCounterpartiesQuery,
  useGetApiFactoringDocumentsQuery,
  type FactoringAdvanceBatchDto,
  type FactoringAdvanceResultDto,
  type FactoringAdvanceSummaryDto,
  type FactoringAdvanceSummaryRequestDto,
  type FactoringCessionResultDto,
  type FactoringContractDto,
  type FactoringCounterpartyResultDto,
  type FactoringDocumentDto,
  type GetApiFactoringAdvancesApiArg,
  type GetApiFactoringDocumentsApiArg,
  type NewFactoringAdvanceDto,
  type NewFactoringCessionDto,
} from "@platform/api/generated/MontraPOSApi";

// MontraAPI's /api/factoring, on the generated client. Added to it:
// - Record ids are opaque tokens that can hold "/" or "+", so they are encoded in paths.
// - The POSTs and the batch read have a timeout, treated like a network error (same correlationId).
// - Two lists the screens need whole, however many pages the API splits them in.
// There is deliberately no sample fallback: it would turn a network error on a submission into a
// sample "success". Development without the API uses Demo access (demo/factoringDemoBackend.ts).

export const POST_TIMEOUT_MS = 60_000;
export const STATUS_TIMEOUT_MS = 15_000;
const ALL_PAGE_SIZE = 100;

const pathId = (id: string) => encodeURIComponent(id);
const contractPath = (id: string) => `/api/factoring/contracts/${pathId(id)}`;

type Page<T> = { items?: T[] | null; totalCount?: number };
type PageRead = { data?: unknown; error?: FetchBaseQueryError };

/** Every page, one at a time. Stops on an empty page too, should totalCount and the items ever disagree. */
async function allPages<T>(read: (page: number) => PageRead | Promise<PageRead>): Promise<{ data: T[] } | { error: FetchBaseQueryError }> {
  const all: T[] = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await read(page);
    if (error) return { error };
    const { items, totalCount = 0 } = (data ?? {}) as Page<T>;
    all.push(...(items ?? []));
    if (!items?.length || all.length >= totalCount) return { data: all };
  }
}

export const factoringApi = MontraPOSApi.injectEndpoints({
  endpoints: (build) => ({
    getAllFactoringContracts: build.query<FactoringContractDto[], void>({
      queryFn: (_arg, _api, _extra, baseQuery) =>
        allPages<FactoringContractDto>((page) => baseQuery({ url: "/api/factoring/contracts", params: { page, pageSize: ALL_PAGE_SIZE } }) as Promise<PageRead>),
    }),
    getApprovedInvoices: build.query<FactoringDocumentDto[], string>({
      queryFn: (contractId, _api, _extra, baseQuery) =>
        allPages<FactoringDocumentDto>(
          (page) =>
            baseQuery({
              url: "/api/factoring/documents",
              params: { contractId, kind: "Confirming", status: "Approved", page, pageSize: ALL_PAGE_SIZE },
            }) as Promise<PageRead>,
        ),
    }),
    addCounterparty: build.mutation<FactoringCounterpartyResultDto, { contractId: string; taxNumber: string }>({
      query: ({ contractId, taxNumber }) => ({
        url: `${contractPath(contractId)}/counterparties`,
        method: "POST",
        body: { taxNumber },
        timeout: POST_TIMEOUT_MS,
      }),
    }),
    submitCession: build.mutation<FactoringCessionResultDto, { contractId: string; body: NewFactoringCessionDto }>({
      query: ({ contractId, body }) => ({ url: `${contractPath(contractId)}/cessions`, method: "POST", body, timeout: POST_TIMEOUT_MS }),
    }),
    readAdvanceSummary: build.mutation<FactoringAdvanceSummaryDto, { contractId: string; body: FactoringAdvanceSummaryRequestDto }>({
      query: ({ contractId, body }) => ({ url: `${contractPath(contractId)}/advances/summary`, method: "POST", body, timeout: POST_TIMEOUT_MS }),
    }),
    submitAdvance: build.mutation<FactoringAdvanceResultDto, { contractId: string; body: NewFactoringAdvanceDto }>({
      query: ({ contractId, body }) => ({ url: `${contractPath(contractId)}/advances`, method: "POST", body, timeout: POST_TIMEOUT_MS }),
    }),
    getAdvanceBatch: build.query<FactoringAdvanceBatchDto, string>({
      query: (id) => ({ url: `/api/factoring/advances/batches/${pathId(id)}`, timeout: STATUS_TIMEOUT_MS }),
    }),
  }),
});

export const { useAddCounterpartyMutation, useReadAdvanceSummaryMutation } = factoringApi;

/** The active agreements of both kinds */
export const useAgreements = () => factoringApi.useGetAllFactoringContractsQuery();

export const useApprovedInvoices = (agreement: FactoringContractDto | undefined) =>
  factoringApi.useGetApprovedInvoicesQuery(agreement?.id ?? "", { skip: !agreement?.id });

/** The pending ones too: they can't take invoices, but the user can see that they are on their way */
export const useCounterparties = (contractId: string | undefined) =>
  useGetApiFactoringContractsByIdCounterpartiesQuery({ id: pathId(contractId ?? ""), includePending: true }, { skip: !contractId });

export const useDocuments = (args: GetApiFactoringDocumentsApiArg) => useGetApiFactoringDocumentsQuery(args);

export const useAdvances = (args: GetApiFactoringAdvancesApiArg) => useGetApiFactoringAdvancesQuery(args);

/** For a cession accepted with no number yet */
export const useCession = (id: string | null | undefined, skip: boolean) =>
  useGetApiFactoringCessionsByIdQuery({ id: pathId(id ?? "") }, { skip: skip || !id });

/** A fresh read for the polling (never from the cache) */
export const readAdvanceBatch = (id: string) => factoringApi.endpoints.getAdvanceBatch.initiate(id, { subscribe: false, forceRefetch: true });
