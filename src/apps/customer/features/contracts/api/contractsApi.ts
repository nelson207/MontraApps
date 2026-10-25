import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { shouldUseSample, unexpectedResponse } from "@platform/api/devFallback";
import { emptySplitApi } from "@platform/api/emptyApi";
import type { CashflowRow, Contract, InvoiceDocument } from "../model/contracts";
import { invoicePdf } from "../model/invoicePdf";
import { sampleCashflow, sampleContracts, SAMPLE_CUSTOMER_NAME, sampleDocuments } from "./sampleContracts";

// The signed-in customer's contracts.
// TODO: placeholder endpoints (not exposed by the backend yet), injected by hand:
//   GET /api/Customer/Contracts                                →  Contract[]   (as customer, second holder or guarantor)
//   GET /api/Customer/Contracts/{id}/Cashflow                  →  CashflowRow[]
//   GET /api/Customer/Contracts/{id}/Documents                 →  InvoiceDocument[]
//   GET /api/Customer/Contracts/{id}/Documents/{documentId}/Pdf →  application/pdf
const CONTRACTS_URL = "/api/Customer/Contracts";

const notFound: FetchBaseQueryError = { status: 404, data: { message: "Contract not found." } };

export type PdfArgs = { contract: Contract; document: InvoiceDocument };

/** An object URL for the PDF (revoke it once used) and the file name to save it as */
export type PdfFile = { url: string; fileName: string };

const fileNameOf = (document: InvoiceDocument) => `${document.number.replace(/[^\w-]+/g, "_")}.pdf`;

const contractsApi = emptySplitApi.injectEndpoints({
  endpoints: (build) => ({
    getContracts: build.query<Contract[], void>({
      queryFn: async (_arg, _api, _extra, baseQuery) => {
        const result = await baseQuery(CONTRACTS_URL);
        const error = result.error as FetchBaseQueryError | undefined;
        if (shouldUseSample(error)) return { data: await sampleContracts() };
        if (error) return { error };
        return Array.isArray(result.data) ? { data: result.data as Contract[] } : { error: unexpectedResponse("contracts") };
      },
    }),

    getCashflow: build.query<CashflowRow[], number>({
      queryFn: async (contractId, _api, _extra, baseQuery) => {
        const result = await baseQuery(`${CONTRACTS_URL}/${contractId}/Cashflow`);
        const error = result.error as FetchBaseQueryError | undefined;
        if (shouldUseSample(error)) {
          const rows = await sampleCashflow(contractId);
          return rows ? { data: rows } : { error: notFound };
        }
        if (error) return { error };
        return Array.isArray(result.data) ? { data: result.data as CashflowRow[] } : { error: unexpectedResponse("cashflow") };
      },
    }),

    getDocuments: build.query<InvoiceDocument[], number>({
      queryFn: async (contractId, _api, _extra, baseQuery) => {
        const result = await baseQuery(`${CONTRACTS_URL}/${contractId}/Documents`);
        const error = result.error as FetchBaseQueryError | undefined;
        if (shouldUseSample(error)) {
          const docs = await sampleDocuments(contractId);
          return docs ? { data: docs } : { error: notFound };
        }
        if (error) return { error };
        return Array.isArray(result.data) ? { data: result.data as InvoiceDocument[] } : { error: unexpectedResponse("documents") };
      },
    }),

    // A mutation: run on demand (the download button), nothing to cache
    getDocumentPdf: build.mutation<PdfFile, PdfArgs>({
      queryFn: async ({ contract, document }, _api, _extra, baseQuery) => {
        const result = await baseQuery({
          url: `${CONTRACTS_URL}/${contract.id}/Documents/${document.id}/Pdf`,
          responseHandler: (response) => (response.ok ? response.blob() : response.text()),
        });
        const error = result.error as FetchBaseQueryError | undefined;
        let blob: Blob;
        if (shouldUseSample(error)) {
          // Built in the browser from the document's figures
          // Invoices are addressed to the contract's customer (the first holder)
          const name = contract.holders.find((h) => h.role === "customer")?.name ?? SAMPLE_CUSTOMER_NAME;
          const bytes = invoicePdf(document, { contractNumber: contract.number, customerName: name, lender: contract.lender });
          blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
        } else if (error) return { error };
        else if (result.data instanceof Blob) blob = result.data;
        else return { error: unexpectedResponse("PDF") };
        return { data: { url: URL.createObjectURL(blob), fileName: fileNameOf(document) } };
      },
    }),
  }),
});

export const { useGetContractsQuery, useGetCashflowQuery, useGetDocumentsQuery, useGetDocumentPdfMutation } = contractsApi;
