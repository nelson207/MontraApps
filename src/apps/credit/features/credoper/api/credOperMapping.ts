import type { CredOperDto as ApiCredOperDto } from "@platform/api/generated/MontraPOSApi";
import type { CredOperDto as DraftDto } from "@platform/api/legacy/legacyApi";

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
];
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

/** The draft as the new API takes it */
export function toApiCredOper(draft: DraftDto): ApiCredOperDto {
  const op = outward(draft as AnyRecord, OPERATION_NAMES, [
    ...APP_ONLY_OPERATION,
    "conditions",
    "assets",
    "interventions",
  ])!;
  return {
    ...op,
    conditions: list(draft.conditions)?.map((c) => ({
      ...outward(c as AnyRecord, [], [...APP_ONLY_CONDITION, "flows"]),
      flows: list(c.flows)?.map((f) => outward(f as AnyRecord, [], [])),
    })),
    assets: list(draft.assets)?.map((a) => ({
      ...outward(a as AnyRecord, [], ["equipment"]),
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
