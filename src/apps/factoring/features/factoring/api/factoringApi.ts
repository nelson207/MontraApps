import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { delay, shouldUseSample, unexpectedResponse } from "@platform/api/devFallback";
import { emptySplitApi } from "@platform/api/emptyApi";
import type { AgreementNature, Entity, FactoringAgreement, FactoringDraft } from "../model/factoring";
import { sampleAgreements, sampleCreateRequest, sampleDocuments, sampleSearchEntities } from "./sampleFactoring";

// Factoring endpoints.
// TODO: placeholder endpoints (not exposed by the backend yet), injected by hand:
//   GET  /api/Factoring/Agreements?intermediaryId=          →  FactoringAgreement[]
//   GET  /api/Factoring/Entities?search=&pageSize=           →  { items: Entity[], total }   (debtors / suppliers)
//   GET  /api/Factoring/Documents?intermediaryId=            →  FactoringDocumentRow[]
//   POST /api/Factoring/Requests
//        { intermediaryId, vendorId, agreementId, supplierId, documents: [{ invoiceNumber, issueDate, dueDate, amount, debtorId }] }
//        →  { reference, documents }
const AGREEMENTS_URL = "/api/Factoring/Agreements";
const ENTITIES_URL = "/api/Factoring/Entities";
const DOCUMENTS_URL = "/api/Factoring/Documents";
const REQUESTS_URL = "/api/Factoring/Requests";

export type DocumentStatus = "submitted" | "approved" | "financed" | "paid" | "overdue";

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  submitted: "Submitted",
  approved: "Approved",
  financed: "Financed",
  paid: "Paid",
  overdue: "Overdue",
};

export type EntityPage = { items: Entity[]; total: number };

/** A financed invoice, as listed */
export type FactoringDocumentRow = {
  id: number;
  /** The request it was submitted in */
  reference: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  /** The debtor (factoring) or the supplier (confirming) */
  entity: Entity;
  nature: AgreementNature;
  agreementNumber: string;
  financialCompany: string;
  status: DocumentStatus;
};

export type FactoringRequest = { reference: string; documents: number };

export type CreateFactoringRequest = {
  intermediaryId: string;
  vendorId: string;
  draft: FactoringDraft;
  agreement: FactoringAgreement;
};

export const ENTITY_PAGE_SIZE = 20;

const factoringApi = emptySplitApi.enhanceEndpoints({ addTagTypes: ["FactoringDocument"] }).injectEndpoints({
  endpoints: (build) => ({
    getFactoringAgreements: build.query<FactoringAgreement[], string>({
      queryFn: async (intermediaryId, _api, _extra, baseQuery) => {
        const result = await baseQuery({ url: AGREEMENTS_URL, params: { intermediaryId } });
        const error = result.error as FetchBaseQueryError | undefined;
        if (shouldUseSample(error)) {
          await delay(200);
          return { data: sampleAgreements(intermediaryId) };
        }
        if (error) return { error };
        return Array.isArray(result.data) ? { data: result.data as FactoringAgreement[] } : { error: unexpectedResponse("agreements") };
      },
    }),

    searchEntities: build.query<EntityPage, string>({
      queryFn: async (search, _api, _extra, baseQuery) => {
        const result = await baseQuery({ url: ENTITIES_URL, params: { search, pageSize: ENTITY_PAGE_SIZE } });
        const error = result.error as FetchBaseQueryError | undefined;
        if (shouldUseSample(error)) return { data: await sampleSearchEntities(search, ENTITY_PAGE_SIZE) };
        if (error) return { error };
        const page = result.data as EntityPage | undefined;
        return Array.isArray(page?.items) ? { data: page } : { error: unexpectedResponse("companies") };
      },
    }),

    getFactoringDocuments: build.query<FactoringDocumentRow[], string>({
      queryFn: async (intermediaryId, _api, _extra, baseQuery) => {
        const result = await baseQuery({ url: DOCUMENTS_URL, params: { intermediaryId } });
        const error = result.error as FetchBaseQueryError | undefined;
        if (shouldUseSample(error)) return { data: await sampleDocuments(intermediaryId) };
        if (error) return { error };
        return Array.isArray(result.data) ? { data: result.data as FactoringDocumentRow[] } : { error: unexpectedResponse("documents") };
      },
      providesTags: [{ type: "FactoringDocument", id: "LIST" }],
    }),

    createFactoringRequest: build.mutation<FactoringRequest, CreateFactoringRequest>({
      queryFn: async ({ intermediaryId, vendorId, draft, agreement }, _api, _extra, baseQuery) => {
        const confirming = agreement.nature === 1;
        const body = {
          intermediaryId,
          vendorId,
          agreementId: agreement.id,
          supplierId: confirming ? (draft.supplier?.id ?? null) : null,
          documents: draft.documents.map((doc) => ({
            invoiceNumber: doc.invoiceNumber.trim(),
            issueDate: doc.issueDate,
            dueDate: doc.dueDate,
            amount: doc.amount,
            debtorId: confirming ? null : (doc.debtor?.id ?? null),
          })),
        };
        const result = await baseQuery({ url: REQUESTS_URL, method: "POST", body });
        const error = result.error as FetchBaseQueryError | undefined;
        if (shouldUseSample(error)) return { data: await sampleCreateRequest(intermediaryId, draft, agreement) };
        if (error) return { error };
        const request = result.data as FactoringRequest | undefined;
        return request && typeof request.reference === "string" ? { data: request } : { error: unexpectedResponse("factoring request") };
      },
      invalidatesTags: [{ type: "FactoringDocument", id: "LIST" }],
    }),
  }),
});

export const {
  useGetFactoringAgreementsQuery,
  useSearchEntitiesQuery,
  useGetFactoringDocumentsQuery,
  useCreateFactoringRequestMutation,
} = factoringApi;
