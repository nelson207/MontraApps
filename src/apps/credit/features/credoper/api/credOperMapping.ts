import type { CredOperDto as ApiCredOperDto, AssetTypeKind, CreditOperationStep } from "@platform/api/generated/MontraPOSApi";
import type { CredOperDto as DraftDto, CreditOperationStep as DraftStep } from "@platform/api/legacy/legacyApi";

// The Credit wizard's draft (the previous API's shape, platform/api/legacy) ⇄ the new API's
// CredOperDto, at the boundary of the new credit-operation endpoints (credOperApi.ts).
// The new DTO no longer carries the customer, the people, the links between parts
// (correlationID) or the server field rules: they stay in the draft, and the answers are merged
// back over it. Names that changed are renamed both ways.

type AnyRecord = Record<string, unknown>;

/** Draft name → API name; [draft, api] pairs */
const OPERATION_NAMES: [string, string][] = [
  ["financialProduct", "financialProductId"],
  ["creditIntermediaryStructNode", "creditIntermediaryStructNodeId"],
  // Assumption (no exact field in the new API): the showroom/supplier is the operation's local node
  ["showRoomStructNode", "localStructNodeId"],
  ["credOperClassification", "credOperClassificationId"],
  ["description", "descr"],
  ["customerName", "entityName"],
];

const EQUIPMENT_NAMES: [string, string][] = [
  ["brand", "equipmentBrand"],
  ["model", "equipmentModel"],
  ["version", "equipVersion"],
  ["doors", "numOfDoors"],
  ["enginesize", "engineSize"],
  ["description", "descr"],
  // Assumption: the registration date is the licence date
  ["registrationDate", "licenceDate"],
];

/** Kept by the app only, at any level */
const APP_ONLY_EVERYWHERE = ["correlationID", "status", "metadataResponse"];
const APP_ONLY_OPERATION = [
  "salePersonStructNode",
  "customerVAT",
  "customerEmail",
  "customerPhone",
  "customerLandLine",
  // The app's insurances (kinds, linked people/vehicles) aren't the API's insurance policies
  "insurances",
  // The asset type chosen: the assets carry it (assetType)
  "assetTypeId",
];

/** The draft's asset type (an AssetType id: 1 = equipment, 2 = building) ⇄ the API's AssetTypeKind */
const ASSET_KINDS: [number, AssetTypeKind][] = [
  [1, "Equipment"],
  [2, "Building"],
];
export const assetKindOut = (assetType: unknown): AssetTypeKind | undefined => ASSET_KINDS.find(([id]) => id === assetType)?.[1];
const assetKindIn = (kind: unknown): number | null => ASSET_KINDS.find(([, name]) => name === kind)?.[0] ?? null;
const APP_ONLY_CONDITION = ["period", "dueRegime", "annualRate"];
const APP_ONLY_INTERVENTION = [
  "person",
  "company",
  "entity",
  "entityAddress",
  "fiscalEntityAddress",
  "entityEmail",
  "entityMobilePhone",
  "entityLandlinePhone",
];
const APP_ONLY_EQUIPMENT = ["odometer"];

/** `item` without `drop`, with names renamed draft → API */
function outward(item: AnyRecord | null | undefined, names: [string, string][], drop: string[]): AnyRecord | undefined {
  if (!item) return undefined;
  const out: AnyRecord = {};
  for (const [key, value] of Object.entries(item)) {
    if (APP_ONLY_EVERYWHERE.includes(key) || drop.includes(key)) continue;
    const renamed = names.find(([draft]) => draft === key)?.[1] ?? key;
    out[renamed] = value;
  }
  return out;
}

/** `item` with names renamed API → draft, over `base` (whose app-only values are kept) */
function inward(item: AnyRecord | null | undefined, names: [string, string][], base?: AnyRecord | null): AnyRecord {
  const out: AnyRecord = { ...(base ?? {}) };
  for (const [key, value] of Object.entries(item ?? {})) {
    const renamed = names.find(([, api]) => api === key)?.[0] ?? key;
    out[renamed] = value;
  }
  return out;
}

const list = <T>(items: T[] | null | undefined) => (Array.isArray(items) ? items : undefined);

/** The new API names the step (CreditOperationStep); the draft keeps the previous API's number */
const STEP_NUMBERS: Record<CreditOperationStep, DraftStep> = {
  Quotation: 1,
  Proposal: 2,
  Contract: 3,
  Cession: 4,
  Loan: 5,
  Projection: 6,
  Agreement: 7,
  MLAProposal: 12,
  MLAContract: 13,
  ExternalOperation: 99,
};

export const stepName = (step: number | null | undefined): CreditOperationStep | undefined =>
  (Object.keys(STEP_NUMBERS) as CreditOperationStep[]).find((name) => STEP_NUMBERS[name] === step);

export const stepNumber = (step: CreditOperationStep | null | undefined): DraftStep | undefined =>
  step ? STEP_NUMBERS[step] : undefined;

/** The draft as the new API takes it */
export function toApiCredOper(draft: DraftDto): ApiCredOperDto {
  const op = outward(draft as AnyRecord, OPERATION_NAMES, [
    ...APP_ONLY_OPERATION,
    "conditions",
    "assets",
    "interventions",
  ])!;
  if ("credOperStep" in op) op.credOperStep = stepName(draft.credOperStep);
  return {
    ...op,
    conditions: list(draft.conditions)?.map((c) => ({
      ...outward(c as AnyRecord, [], [...APP_ONLY_CONDITION, "flows"]),
      flows: list(c.flows)?.map((f) => outward(f as AnyRecord, [], [])),
    })),
    assets: list(draft.assets)?.map((a, i) => ({
      ...outward(a as AnyRecord, [], ["equipment"]),
      // No asset: no kind (the API's are equipment and building)
      assetType: assetKindOut(a.assetType),
      // Numbered by position (1, 2, 3…) on every send: no gaps after a vehicle is added or removed
      assetItem: i + 1,
      equipment: outward(a.equipment as AnyRecord, EQUIPMENT_NAMES, APP_ONLY_EQUIPMENT),
    })),
    interventions: list(draft.interventions)?.map((i) => outward(i as AnyRecord, [], APP_ONLY_INTERVENTION)),
  } as ApiCredOperDto;
}

/**
 * An answer of the new API as a draft. With `base` (the draft that was sent), what only the app
 * keeps stays: lists are merged item by item (by position).
 */
export function fromApiCredOper(api: ApiCredOperDto, base?: DraftDto | null): DraftDto {
  const op = inward(api as AnyRecord, OPERATION_NAMES, base as AnyRecord);
  if (api.credOperStep !== undefined) op.credOperStep = stepNumber(api.credOperStep) ?? base?.credOperStep;
  const baseConditions = list(base?.conditions) ?? [];
  const baseAssets = list(base?.assets) ?? [];
  const baseInterventions = list(base?.interventions) ?? [];

  if (api.conditions !== undefined) {
    op.conditions = list(api.conditions)?.map((c, i) => {
      const baseCondition = (baseConditions[i] ?? {}) as AnyRecord;
      const baseFlows = list(baseConditions[i]?.flows) ?? [];
      return {
        ...inward(c as AnyRecord, [], baseCondition),
        flows: list(c.flows)?.map((f, j) => inward(f as AnyRecord, [], baseFlows[j] as AnyRecord)) ?? baseCondition.flows,
      };
    }) ?? null;
  }
  if (api.assets !== undefined) {
    op.assets = list(api.assets)?.map((a, i) => ({
      ...inward(a as AnyRecord, [], baseAssets[i] as AnyRecord),
      assetType: a.assetType !== undefined ? assetKindIn(a.assetType) : baseAssets[i]?.assetType,
      equipment: inward(a.equipment as AnyRecord, EQUIPMENT_NAMES, baseAssets[i]?.equipment as AnyRecord),
    })) ?? null;
  }
  if (api.interventions !== undefined) {
    op.interventions =
      list(api.interventions)?.map((v, i) => inward(v as AnyRecord, [], baseInterventions[i] as AnyRecord)) ?? null;
  }
  // The app's insurances never come from the API
  if (base) op.insurances = (base as AnyRecord).insurances;
  return op as DraftDto;
}
