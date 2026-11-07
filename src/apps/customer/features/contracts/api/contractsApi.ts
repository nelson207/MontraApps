import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { unexpectedResponse } from "@platform/api/devFallback";
import {
  MontraPOSApi,
  type CustomerCashFlowDto,
  type CustomerContractDto,
  type CustomerContractsDto,
  type CustomerDashboardDto,
  type CustomerDocumentDetailDto,
  type CustomerDocumentsDto,
} from "@platform/api/generated/MontraPOSApi";
import { isInvalidId } from "@platform/api/problemCode";
import {
  CASHFLOW_FILTER_STATUSES,
  cashflowOf,
  contractCardOf,
  contractOf,
  dashboardOf,
  documentDetailOf,
  documentOf,
  type Cashflow,
  type CashflowFilter,
  type Contract,
  type ContractCard,
  type Dashboard,
  type InvoiceDocument,
  type InvoiceDocumentDetail,
} from "../model/contracts";

// MontraAPI's /api/customer-portal, on the generated client: only reads, for the signed-in customer.
// Added to it: record ids are opaque tokens that can hold "/" or "+", so they are encoded in paths,
// and the answers become the model's types. Development without the API uses Demo access
// (demo/customerDemoBackend.ts).

const BASE_URL = "/api/customer-portal";

const pathId = (id: string) => encodeURIComponent(id);

export type CashflowArgs = { contractId: string; filter: CashflowFilter; page: number; pageSize: number };
export type DocumentsArgs = { contractId: string; page: number; pageSize: number };
export type DocumentsPage = { items: InvoiceDocument[]; totalCount: number };
export type PdfArgs = Pick<InvoiceDocument, "id" | "number">;

/** An object URL for the PDF (revoke it once used) and the file name to save it as */
export type PdfFile = { url: string; fileName: string };

const fileNameOf = (number: string) => `${number.replace(/[^\w-]+/g, "_") || "document"}.pdf`;

/** A contract or document that isn't there, or isn't this customer's, as opposed to a failed read */
export const isNotAvailable = (error: unknown) => {
  const status = (error as FetchBaseQueryError | undefined)?.status;
  return status === 403 || status === 404 || (status === 400 && isInvalidId(error as FetchBaseQueryError));
};

const contractsApi = MontraPOSApi.injectEndpoints({
  endpoints: (build) => ({
    getCustomerDashboard: build.query<Dashboard, void>({
      query: () => `${BASE_URL}/dashboard`,
      transformResponse: (dto: CustomerDashboardDto) => dashboardOf(dto),
    }),

    getContracts: build.query<ContractCard[], void>({
      query: () => `${BASE_URL}/contracts`,
      transformResponse: (dto: CustomerContractsDto) => (dto.items ?? []).map(contractCardOf),
    }),

    getContract: build.query<Contract, string>({
      query: (id) => `${BASE_URL}/contracts/${pathId(id)}`,
      transformResponse: (dto: CustomerContractDto) => contractOf(dto),
    }),

    getCashflow: build.query<Cashflow, CashflowArgs>({
      query: ({ contractId, filter, page, pageSize }) => ({
        url: `${BASE_URL}/contracts/${pathId(contractId)}/cash-flow`,
        params: { page, pageSize, status: CASHFLOW_FILTER_STATUSES[filter] },
      }),
      transformResponse: (dto: CustomerCashFlowDto) => cashflowOf(dto),
    }),

    getDocuments: build.query<DocumentsPage, DocumentsArgs>({
      query: ({ contractId, page, pageSize }) => ({
        url: `${BASE_URL}/contracts/${pathId(contractId)}/documents`,
        params: { page, pageSize },
      }),
      transformResponse: (dto: CustomerDocumentsDto) => ({ items: (dto.items ?? []).map(documentOf), totalCount: dto.totalCount ?? 0 }),
    }),

    getDocument: build.query<InvoiceDocumentDetail, string>({
      query: (id) => `${BASE_URL}/documents/${pathId(id)}`,
      transformResponse: (dto: CustomerDocumentDetailDto) => documentDetailOf(dto),
    }),

    // A mutation: run on demand (the download button), nothing to cache. It only reads.
    getDocumentPdf: build.mutation<PdfFile, PdfArgs>({
      queryFn: async ({ id, number }, _api, _extra, baseQuery) => {
        const result = await baseQuery({
          url: `${BASE_URL}/documents/${pathId(id)}/pdf`,
          // A failure stays JSON when it is: the session's handling reads the problem's code
          responseHandler: async (response) => {
            if (response.ok) return response.blob();
            const text = await response.text();
            try {
              return JSON.parse(text);
            } catch {
              return text;
            }
          },
        });
        if (result.error) return { error: result.error as FetchBaseQueryError };
        if (!(result.data instanceof Blob)) return { error: unexpectedResponse("PDF") };
        return { data: { url: URL.createObjectURL(result.data), fileName: fileNameOf(number) } };
      },
    }),
  }),
});

export const {
  useGetCustomerDashboardQuery,
  useGetContractsQuery,
  useGetContractQuery,
  useGetCashflowQuery,
  useGetDocumentsQuery,
  useGetDocumentQuery,
  useGetDocumentPdfMutation,
} = contractsApi;
