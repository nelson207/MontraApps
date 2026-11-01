import {
  MontraPOSApi,
  usePostApiCreditOperationsCalculateCredoperMutation,
  usePostApiFinancialProductsDefaultsMutation,
  type CreditOperationStep,
  type NewInterventionKind,
} from "@platform/api/generated/MontraPOSApi";
import type { CredOperAssetDto, CredOperDto, CredOperIntervDto } from "@platform/api/legacy/legacyApi";
import type { AppDispatch } from "@credit/store";
import { withRetakeAmount } from "../model/business";
import { assetKindOut, fromApiCredOper, toApiCredOper } from "./credOperMapping";

// The credit-operation procedures of the new API (/api/credit-operations/…), for the wizard's
// draft: requests are translated to the new CredOperDto and answers merged back over the draft
// (credOperMapping.ts). Save, search and quotation → proposal aren't in the new API yet: they
// stay on the legacy placeholders (platform/api/legacy).

/** One intervention of the new API as a draft intervention: the person / entity are the app's to fill */
const interventionFromApi = (intervention: unknown): CredOperIntervDto => ({
  person: {},
  entity: {},
  ...fromApiCredOper({ interventions: [intervention as never] }).interventions?.[0],
});

/** The business and company a new object is for: the backend sets its values from them */
export type NewFor = { businessId: number; companyId: number };

/**
 * A blank operation for a quotation or a proposal (with its customer), of a business in a company
 * and its asset type (an AssetType id; null = no asset, e.g. a personal loan: none sent)
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
    const operation = fromApiCredOper(await request.unwrap());
    // A proposal starts with its customer to fill in
    if (credOperStep === "Proposal" && !operation.interventions?.length) {
      operation.interventions = [await newIntervention(dispatch, "Customer")];
    }
    return operation;
  } finally {
    request.unsubscribe();
  }
}

/** A blank customer, second holder or guarantor */
export async function newIntervention(dispatch: AppDispatch, kind: NewInterventionKind): Promise<CredOperIntervDto> {
  const request = dispatch(
    MontraPOSApi.endpoints.getApiCreditOperationsNewIntervention.initiate({ kind }, { forceRefetch: true }),
  );
  try {
    return interventionFromApi(await request.unwrap());
  } finally {
    request.unsubscribe();
  }
}

/** The calculation failed: the API's messages, if any */
export class CalculationError extends Error {
  readonly data: { message: string };
  constructor(messages: string[]) {
    const message = messages.join(" ") || "The operation couldn't be calculated.";
    super(message);
    // Shape read by getApiErrorMessage
    this.data = { message };
  }
}

/** Calculates the draft; the result is the draft with the calculated values */
export function useCalculateCredOper() {
  const [calculate, state] = usePostApiCreditOperationsCalculateCredoperMutation();
  const run = async (draft: CredOperDto): Promise<CredOperDto> => {
    const result = await calculate({ credOperDto: toApiCredOper(draft) }).unwrap();
    if (!result.isCalculated || !result.credOper) {
      throw new CalculationError((result.messages ?? []).map((m) => m.text ?? "").filter(Boolean));
    }
    const calculated = fromApiCredOper(result.credOper, draft);
    // The amount is what was calculated with: the percentage shown follows it
    const retakeAmount = calculated.assets?.[0]?.equipment?.retakeAmount;
    return retakeAmount != null ? withRetakeAmount(calculated, retakeAmount) : calculated;
  };
  return [run, state] as const;
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
