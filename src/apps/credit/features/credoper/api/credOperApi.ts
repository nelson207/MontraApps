import { useCallback } from "react";
import {
  MontraPOSApi,
  usePostApiCreditOperationsCalculateCredoperMutation,
  usePostApiCreditOperationsSaveCredoperMutation,
  usePostApiEquipmentsRetakeMutation,
  usePostApiFinancialProductsDefaultsMutation,
  type CredOperDto as ApiCredOperDto,
  type CredOperSaveResultDto,
  type CreditOperationStep,
  type QuotationSummaryDto,
  type RetakeCalculation,
} from "@platform/api/generated/MontraPOSApi";
import { PROBLEM, problemCode, problemMessage, problemStatus } from "@platform/api/problemCode";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import type { CredOperAssetDto, CredOperDto, CredOperIntervDto } from "@platform/api/legacy/legacyApi";
import type { AppDispatch } from "@credit/store";
import { withRetakeAmount } from "../model/business";
import type { CredOperDraft } from "../model/credOperDraft";
import { operationMessages, type OperationMessage, type SaveOutcome } from "../model/operationMessages";
import { assetKindOut, fromApiAsset, fromApiCredOper, toApiAsset, toApiCredOper } from "./credOperMapping";

// The credit-operation procedures of the new API (/api/credit-operations/…), for the wizard's
// draft: requests are translated to the new CredOperDto and answers merged back over the draft
// (credOperMapping.ts).

/** One intervention of the new API as a draft intervention: the person / entity are the app's to fill */
const interventionFromApi = (intervention: unknown): CredOperIntervDto => ({
  person: {},
  entity: {},
  ...fromApiCredOper({ interventions: [intervention as never] }).interventions?.[0],
});

/** The business and company a new object is for: the backend sets its values from them */
export type NewFor = { businessId: number; companyId: number };

/**
 * A blank operation for a quotation or a proposal, of a business in a company and its asset type
 * (an AssetType id; null = no asset, e.g. a personal loan: none sent). A proposal's customer, when
 * it has none, is useCredOperTemplate's to ask for.
 */
export async function newCredOper(
  dispatch: AppDispatch,
  credOperStep: CreditOperationStep,
  { businessId, companyId, assetType }: NewFor & { assetType: number | null },
): Promise<CredOperDto> {
  const request = dispatch(
    MontraPOSApi.endpoints.getApiCreditOperationsNewCredoper.initiate(
      { credOperStep, businessId, companyId, assetType: assetKindOut(assetType) },
      { forceRefetch: true },
    ),
  );
  try {
    return fromApiCredOper(await request.unwrap());
  } finally {
    request.unsubscribe();
  }
}

/**
 * A saved operation, to edit (GET /api/credit-operations/credoper/{id}), in the draft's field
 * names. The app's own parts start empty: its insurances, and each person's details to fill in.
 */
export async function openCredOper(dispatch: AppDispatch, id: string): Promise<CredOperDraft> {
  const request = dispatch(
    // The id is an opaque token: the generated endpoint puts it in the path as given
    MontraPOSApi.endpoints.getApiCreditOperationsCredoperById.initiate({ id: encodeURIComponent(id) }, { forceRefetch: true }),
  );
  try {
    const answer = await request.unwrap();
    if (!answer?.id) throw new CredOperRefusedError([], "The operation couldn't be found.");
    const operation = fromApiCredOper(answer);
    return {
      ...operation,
      interventions: operation.interventions?.map((intervention) => ({ person: {}, entity: {}, ...intervention })),
      insurances: [],
    };
  } finally {
    request.unsubscribe();
  }
}

/**
 * A new proposal from a saved quotation (GET /api/credit-operations/credoper/{id}/quotation-to-proposal):
 * not saved yet (no id; saved as a new operation), with its own correlationId and the quotation it
 * came from (sourceCredOperId), both as the API gave them. In the draft's field names, with the
 * quotation's summary (app-only, shown on top). A customer it doesn't have is useCredOperTemplate's
 * to ask for: only once it has a classification that can be used for one.
 */
export async function quotationToProposal(dispatch: AppDispatch, quotationId: string): Promise<CredOperDraft> {
  const request = dispatch(
    MontraPOSApi.endpoints.getApiCreditOperationsCredoperByIdQuotationToProposal.initiate(
      // The id is an opaque token: the generated endpoint puts it in the path as given
      { id: encodeURIComponent(quotationId) },
      { forceRefetch: true },
    ),
  );
  try {
    const { proposal: answer, quotation } = await request.unwrap();
    const proposal = fromApiCredOper(answer ?? {});
    return {
      ...proposal,
      credOperStep: proposal.credOperStep ?? 2,
      interventions: (proposal.interventions ?? []).map((intervention) => ({ person: {}, entity: {}, ...intervention })),
      insurances: [],
      sourceQuotation: quotation ?? null,
      conversionRef: quotationId,
    };
  } finally {
    request.unsubscribe();
  }
}

/** A saved quotation (GET credoper/{id}) as the summary a proposal made from it shows */
export function quotationSummaryOf(quotation: ApiCredOperDto): QuotationSummaryDto {
  const customer = quotation.interventions?.find((i) => i.role === "Customer") ?? quotation.interventions?.[0];
  return {
    id: quotation.id ?? undefined,
    number: quotation.credOperNumber,
    aplCompanyId: quotation.aplCompanyId,
    aplBusinessId: quotation.aplBusinessId,
    credOperTypeId: quotation.credOperTypeId,
    financialProductId: quotation.financialProductId,
    amount: quotation.amount,
    currencyId: quotation.currencyId,
    beginDate: quotation.beginDate,
    stateId: quotation.autUserStateId,
    stateDate: quotation.stateDate,
    customerEntityId: customer?.entityId ?? null,
    customerName: quotation.entityName,
  };
}

/** Why a quotation couldn't become a proposal, in the user's words */
export function conversionErrorMessage(error: unknown): string {
  if (problemStatus(error) === 404) return "Quotation not found. It doesn't exist anymore, or you can't see it.";
  if (problemStatus(error) === 400 && problemCode(error) === PROBLEM.validationFailed) {
    return "Only a quotation can be converted to a proposal.";
  }
  // 502 (Accipiens failed) and the rest: the usual backend error
  return problemMessage(error) ?? getApiErrorMessage(error) ?? "Please try again.";
}

export const KIND_MISMATCH_ON_SAVE = "An intervention's NIF or type doesn't match its role";

/**
 * Why a save failed, in the user's words. A 400: the API's own explanation when it gives one (never
 * its title), or else the message of its code; the rest: the usual backend error.
 */
export function saveErrorMessage(error: unknown): string {
  if (problemCode(error) === PROBLEM.entityKindMismatch) return KIND_MISMATCH_ON_SAVE;
  if (problemStatus(error) === 400) {
    const data = (error as { data?: { detail?: unknown; message?: unknown } | null }).data;
    const explanation = [data?.detail, data?.message].find((text) => typeof text === "string" && text.trim());
    if (explanation) return (explanation as string).trim();
  }
  return problemMessage(error) ?? getApiErrorMessage(error) ?? "Something went wrong. Please try again.";
}

/** What a blank intervention is asked for with: a customer is what its classification says, the others always persons */
export type NewInterventionRequest =
  | { kind: "Customer"; credOperClassificationId: number }
  | { kind: "SecondHolder" | "Guarantor" };

/** A blank customer, second holder or guarantor, with its entity's kind as the API sets it */
export async function newIntervention(dispatch: AppDispatch, arg: NewInterventionRequest): Promise<CredOperIntervDto> {
  const request = dispatch(MontraPOSApi.endpoints.getApiCreditOperationsNewIntervention.initiate(arg, { forceRefetch: true }));
  try {
    return interventionFromApi(await request.unwrap());
  } finally {
    request.unsubscribe();
  }
}

/** The API refused the operation (not calculated / not saved): its messages, if any */
export class CredOperRefusedError extends Error {
  readonly data: { message: string };
  readonly messages: OperationMessage[];
  constructor(messages: OperationMessage[], fallback: string) {
    const message = messages.map((m) => m.text).join(" ") || fallback;
    super(message);
    this.messages = messages;
    // Shape read by getApiErrorMessage
    this.data = { message };
  }
}

/** A save that failed, refused by the API (its messages) or not (the error says why) */
export const failedSave = (error: unknown, revision: number): SaveOutcome => ({
  saved: false,
  messages: error instanceof CredOperRefusedError ? error.messages : [],
  revision,
  error,
});

/** The API's operation merged over the draft it answers */
function calculatedOver(answer: ApiCredOperDto, draft: CredOperDto): CredOperDto {
  const merged = fromApiCredOper(answer, draft);
  // The amount is what was calculated with: the percentage shown follows it
  const retakeAmount = merged.assets?.[0]?.equipment?.retakeAmount;
  return retakeAmount != null ? withRetakeAmount(merged, retakeAmount) : merged;
}

/** Calculates the draft; the result is the draft with the calculated values */
export function useCalculateCredOper() {
  const [calculate, state] = usePostApiCreditOperationsCalculateCredoperMutation();
  const run = async (draft: CredOperDto): Promise<{ operation: CredOperDto; messages: OperationMessage[] }> => {
    const result = await calculate({ credOperDto: toApiCredOper(draft) }).unwrap();
    const messages = operationMessages({ calculation: result.messages });
    if (!result.isCalculated || !result.credOper) {
      throw new CredOperRefusedError(messages, "The operation couldn't be calculated.");
    }
    return { operation: calculatedOver(result.credOper, draft), messages };
  };
  return [run, state] as const;
}

const saveMessagesOf = (result: CredOperSaveResultDto) =>
  operationMessages({ save: result.saveMessages, calculation: result.calculationMessages });

/**
 * The saved operation: the save answer's operation replaces the draft that was sent (its id, its
 * items' ids, the new rowVersion, the same correlationId, every value it saved). Of the draft only
 * what the API doesn't keep stays: the customer fields, the insurances, the links between parts,
 * the field rules (credOperMapping "replace").
 */
export function savedFromApi(result: CredOperSaveResultDto, draft: CredOperDraft): CredOperDraft {
  if (!result.isSaved || !result.credOper) {
    throw new CredOperRefusedError(saveMessagesOf(result), "The operation couldn't be saved.");
  }
  const saved = fromApiCredOper(result.credOper, draft, "replace") as CredOperDraft;
  const id = saved.id ?? result.id;
  if (!id) throw new CredOperRefusedError(saveMessagesOf(result), "The operation was saved without an id.");
  // The amount is what was saved: the percentage shown follows it
  const retakeAmount = saved.assets?.[0]?.equipment?.retakeAmount;
  return { ...((retakeAmount != null ? withRetakeAmount(saved, retakeAmount) : saved) as CredOperDraft), id };
}

/**
 * Saves the draft (POST /api/credit-operations/save-credoper); the result is the saved operation
 * and what the API has to say about it (warnings, notes). The draft carries its correlationId (and,
 * once saved, its rowVersion): the API refuses a save without them.
 */
export function useSaveCredOper() {
  const [save, state] = usePostApiCreditOperationsSaveCredoperMutation();
  const run = async (draft: CredOperDraft): Promise<{ operation: CredOperDraft; messages: OperationMessage[] }> => {
    const result = await save({ credOperDto: toApiCredOper(draft) }).unwrap();
    return { operation: savedFromApi(result, draft), messages: saveMessagesOf(result) };
  };
  return [run, state] as const;
}

/**
 * 409 concurrency_conflict: someone else saved the operation after it was opened here; nothing
 * was saved. Only reopening it (its latest version) lets it be saved again.
 */
export const isConcurrencyConflict = (error: unknown): boolean =>
  problemStatus(error) === 409 && problemCode(error) === PROBLEM.concurrencyConflict;

/**
 * The asset with its initial entry worked out by the API (POST /api/equipments/retake): from its
 * percentage ("Amount": the amount is filled) or from its amount ("Percentage"), with its base
 * amount recalculated. The result is the asset to put in place of the one sent.
 */
export function useRetakeCalculation() {
  const [retake] = usePostApiEquipmentsRetakeMutation();
  return useCallback(
    async (calculate: RetakeCalculation, asset: CredOperAssetDto): Promise<CredOperAssetDto> => {
      const request = toApiAsset(asset, 0);
      // The percentage is app-only on the operation, but here it's what the amount is worked out from
      request.equipment = { ...request.equipment, retakePercentage: asset.equipment?.retakePercentage ?? null };
      const answer = await retake({ equipmentRetakeRequestDto: { calculate, asset: request } }).unwrap();
      return fromApiAsset(answer, asset, "replace");
    },
    [retake],
  );
}

/** The draft with the defaults of its (new) financial product */
export function useFinancialProductDefaults() {
  const [getDefaults, state] = usePostApiFinancialProductsDefaultsMutation();
  const run = async (draft: CredOperDto, oldFinancialProductId?: number | null): Promise<CredOperDto> => {
    const answer = await getDefaults({
      credOperDto: toApiCredOper(draft),
      oldFinancialProductId: oldFinancialProductId ?? undefined,
    }).unwrap();
    return fromApiCredOper(answer, draft);
  };
  return [run, state] as const;
}

/**
 * A blank asset of a business in a company, in the draft's field names: with its equipment
 * (GET /api/equipments/new) or its building (GET /api/buildings/new), as the backend sets them
 */
export async function newAsset(dispatch: AppDispatch, kind: "equipment" | "building", ids: NewFor): Promise<CredOperAssetDto> {
  const endpoint = kind === "equipment" ? MontraPOSApi.endpoints.getApiEquipmentsNew : MontraPOSApi.endpoints.getApiBuildingsNew;
  const request = dispatch(endpoint.initiate(ids, { forceRefetch: true }));
  try {
    const asset = await request.unwrap();
    return fromApiCredOper({ assets: [asset] }).assets?.[0] ?? {};
  } finally {
    request.unsubscribe();
  }
}
