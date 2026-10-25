import { emptySplitApi } from "@platform/api/emptyApi";
import type { CredOperSummaryDtoPagedResult } from "@platform/api/generated/MontraPOSApi";

// GET /api/credit-operations/search, typed by hand: the generated client types `step` as the
// enum's number, but the API takes its name ("Quotation", "Proposal", "Contract"…).
// The API already limits the results to what the user may see: never filtered here.

export type CreditOperationStepName = "Quotation" | "Proposal" | "Contract" | (string & {});

export type CreditOperationsSearchArgs = {
  number?: number;
  step?: CreditOperationStepName;
  stateId?: number;
  page: number;
  pageSize: number;
};

const creditOperationsSearchApi = emptySplitApi.injectEndpoints({
  endpoints: (build) => ({
    searchCreditOperations: build.query<CredOperSummaryDtoPagedResult, CreditOperationsSearchArgs>({
      query: (params) => ({ url: "/api/credit-operations/search", params }),
    }),
  }),
});

export const { useSearchCreditOperationsQuery } = creditOperationsSearchApi;
