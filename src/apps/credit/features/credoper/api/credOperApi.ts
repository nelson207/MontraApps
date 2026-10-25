import {
  MontraPOSApi,
  usePostApiCreditOperationsCalculateCredoperMutation,
  usePostApiFinancialProductsDefaultsMutation,
  type CreditOperationStep,
  type NewInterventionKind,
} from "@platform/api/generated/MontraPOSApi";
import type { CredOperDto, CredOperIntervDto, EquipmentDto } from "@platform/api/legacy/legacyApi";
import type { AppDispatch } from "@credit/store";
import { fromApiCredOper, toApiCredOper } from "./credOperMapping";

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

/** A blank operation for a quotation (step 1) or a proposal (step 2, with its customer) */
export async function newCredOper(dispatch: AppDispatch, credOperStep: CreditOperationStep): Promise<CredOperDto> {
  const request = dispatch(
    MontraPOSApi.endpoints.getApiCreditOperationsNewCredoper.initiate({ credOperStep }, { forceRefetch: true }),
  );
  try {
    const operation = fromApiCredOper(await request.unwrap());
    // A proposal starts with its customer to fill in
    if (credOperStep === 2 && !operation.interventions?.length) {
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
    return fromApiCredOper(result.credOper, draft);
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

/** A blank vehicle (GET /api/equipments/new), in the draft's field names */
export async function newEquipment(dispatch: AppDispatch): Promise<EquipmentDto> {
  const request = dispatch(MontraPOSApi.endpoints.getApiEquipmentsNew.initiate(undefined, { forceRefetch: true }));
  try {
    const equipment = await request.unwrap();
    return fromApiCredOper({ assets: [{ equipment }] }).assets?.[0]?.equipment ?? {};
  } finally {
    request.unsubscribe();
  }
}
