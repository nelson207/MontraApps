import type { FactoringCessionResultDto, FactoringKind, NewFactoringCessionDto } from "@platform/api/generated/MontraPOSApi";
import { useAppDispatch } from "@platform/app/store";
import { factoringApi } from "../api/factoringApi";
import { classifyCession, type CessionAccepted } from "../model/submission";
import { useSubmission } from "./useSubmission";

export type CessionRequest = Omit<NewFactoringCessionDto, "correlationId">;

/** What the confirmation shows */
export type CessionSummary = {
  kind: FactoringKind | undefined;
  financialInstitution: string | null;
  contractNumber: number | null;
  currencyId: string | null;
  supplierName: string | null;
  total: number;
  advance: number | null;
  invoices: { key: string; invoiceNumber: string; debtorName: string | null; dueDate: string; amount: number | null }[];
};

export function useCessionSubmission() {
  const dispatch = useAppDispatch();
  return useSubmission<CessionRequest, FactoringCessionResultDto, CessionSummary, CessionAccepted>({
    flow: "cession",
    post: (contractId, body) => dispatch(factoringApi.endpoints.submitCession.initiate({ contractId, body })).unwrap(),
    classify: classifyCession,
  });
}

export type CessionSubmission = ReturnType<typeof useCessionSubmission>;
