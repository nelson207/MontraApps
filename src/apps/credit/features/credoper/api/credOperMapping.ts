import type {
  AssetTypeKind,
  CredOperAssetDto as ApiAssetDto,
  CredOperDto as ApiCredOperDto,
  CredOperIntervDto as ApiIntervDto,
  CreditOperationStep,
} from "@platform/api/generated/MontraPOSApi";
import type {
  CredOperAssetDto as DraftAssetDto,
  CredOperDto as DraftDto,
  CredOperIntervDto as DraftIntervDto,
  CreditOperationStep as DraftStep,
} from "@platform/api/legacy/legacyApi";
import { entityFromApi, toApiEntity } from "./entityMapping";

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
  // The network: credit intermediary, supplier (showroom) = importer node, vendor = branch node
  ["showRoomStructNode", "importerStructNodeId"],
  ["salePersonStructNode", "branchStructNodeId"],
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
/** Set by the API only (when a new operation is first saved): never sent */
const API_ONLY_OPERATION = ["autUserStateId", "stateDate", "entryMoment"];
/**
 * The operation's identity for the API's save: the same correlationId from new-credoper on (a
 * save repeated with it returns the operation already saved) and the rowVersion of the version
 * edited (a save over someone else's changes is refused). Never made up nor cleared by the app.
 */
const IDENTITY = ["id", "correlationId", "rowVersion"];
const APP_ONLY_OPERATION = [
  "customerVAT",
  "customerEmail",
  "customerPhone",
  "customerLandLine",
  // The app's insurances (kinds, linked people/vehicles) aren't the API's insurance policies
  "insurances",
  // The asset type chosen: the assets carry it (assetType)
  "assetTypeId",
  // The summary of the quotation a proposal came from (shown only; the link is sourceCredOperId)
  "sourceQuotation",
  // The id it was converted with (to not offer the conversion again)
  "conversionRef",
];
/** Never lost when an answer leaves them out (with "replace" too): the save's key, the quotation link */
const KEPT_ALWAYS = ["correlationId", "sourceCredOperId"];

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
  "samePostalAddress",
  "availablePhones",
  "availableEmails",
  "availableAddresses",
];
/** Set by the API (and ignored when sent): the intervention's pointers to the entity and its contacts */
const API_ONLY_INTERVENTION = [
  "entityId",
  "entityPhoneId",
  "entityEmailId",
  "entityAddressId",
  "fiscalEntityAddressId",
  "residenceHeadquarterEntityAddressId",
];
const APP_ONLY_EQUIPMENT = [
  "odometer",
  // The initial entry is sent as its amount: the percentage only helps type it (a product's default still comes in)
  "retakePercentage",
];

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

/**
 * How an answer is taken over the draft it answers:
 * - "merge": over the whole draft (what the answer leaves out stays the draft's), e.g. a calculation
 * - "replace": the answer is the operation; of the draft only what the API doesn't keep stays
 *   (its app-only fields), e.g. a save
 */
export type AnswerMode = "merge" | "replace";

/** `item`'s `keys` (for "replace": what the app keeps that the API doesn't) */
function pick(item: AnyRecord | null | undefined, keys: string[]): AnyRecord | undefined {
  if (!item) return undefined;
  return Object.fromEntries(keys.filter((key) => key in item).map((key) => [key, item[key]]));
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

/** The draft's item an answer's item is: the one with its id, or else the one at its position */
function baseItem<T extends { id?: unknown }>(baseList: T[], item: { id?: unknown }, index: number): T | undefined {
  const byId = item.id != null ? baseList.find((b) => b.id === item.id) : undefined;
  return byId ?? baseList[index];
}

/** An asset as the API takes it, numbered by its position */
export function toApiAsset(asset: DraftAssetDto, index: number): ApiAssetDto {
  return {
    ...outward(asset as AnyRecord, [], ["equipment"]),
    // No asset: no kind (the API's are equipment and building)
    assetType: assetKindOut(asset.assetType),
    // Numbered by position (1, 2, 3…) on every send: no gaps after a vehicle is added or removed
    assetItem: index + 1,
    equipment: outward(asset.equipment as AnyRecord, EQUIPMENT_NAMES, APP_ONLY_EQUIPMENT),
  } as ApiAssetDto;
}

/** An asset of an answer as the draft's, over `base` (the draft's asset it answers) */
export function fromApiAsset(asset: ApiAssetDto, base?: DraftAssetDto | null, mode: AnswerMode = "merge"): DraftAssetDto {
  const keep = (item: unknown, keys: string[]) => (mode === "replace" ? pick(item as AnyRecord, keys) : (item as AnyRecord));
  return {
    ...inward(asset as AnyRecord, [], keep(base, APP_ONLY_EVERYWHERE)),
    assetType: asset.assetType !== undefined ? assetKindIn(asset.assetType) : base?.assetType,
    equipment: inward(
      asset.equipment as AnyRecord,
      EQUIPMENT_NAMES,
      keep(base?.equipment, [...APP_ONLY_EVERYWHERE, ...APP_ONLY_EQUIPMENT]),
    ),
  } as DraftAssetDto;
}

/** A person of the draft as the API takes them: their link to the operation, and the entity */
function toApiIntervention(intervention: DraftIntervDto): AnyRecord {
  return {
    ...outward(intervention as AnyRecord, [], [...APP_ONLY_INTERVENTION, ...API_ONLY_INTERVENTION]),
    entity: toApiEntity(intervention),
  };
}

/** A person of an answer as the draft's, over `base` (the draft's person it answers) */
function fromApiIntervention(intervention: ApiIntervDto, base: AnyRecord | undefined): DraftIntervDto {
  const { entity, entityId, ...link } = intervention;
  const out = inward(link as AnyRecord, [], base) as DraftIntervDto;
  return entity === undefined && entityId === undefined ? out : { ...out, ...entityFromApi(entityId, entity, out) };
}

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
    ...API_ONLY_OPERATION,
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
    assets: list(draft.assets)?.map(toApiAsset),
    interventions: list(draft.interventions)?.map(toApiIntervention),
  } as ApiCredOperDto;
}

/**
 * An answer of the new API as a draft. With `base` (the draft that was sent), what only the app
 * keeps stays: with "merge", lists are merged item by item (by id, or else by position); with
 * "replace", only the app-only values of each item stay (see AnswerMode). Either way the
 * operation's correlationId and sourceCredOperId aren't lost when an answer leaves them out, and
 * with "merge" neither are its id or rowVersion.
 */
export function fromApiCredOper(api: ApiCredOperDto, base?: DraftDto | null, mode: AnswerMode = "merge"): DraftDto {
  const keep = (item: unknown, keys: string[]) => (mode === "replace" ? pick(item as AnyRecord, keys) : (item as AnyRecord));
  const op = inward(api as AnyRecord, OPERATION_NAMES, keep(base, [...APP_ONLY_EVERYWHERE, ...APP_ONLY_OPERATION]));
  for (const key of mode === "replace" ? KEPT_ALWAYS : [...IDENTITY, ...KEPT_ALWAYS]) {
    if (op[key] == null && (base as AnyRecord | null | undefined)?.[key] != null) op[key] = (base as AnyRecord)[key];
  }
  if (api.credOperStep !== undefined) op.credOperStep = stepNumber(api.credOperStep) ?? base?.credOperStep;
  const baseConditions = list(base?.conditions) ?? [];
  const baseAssets = list(base?.assets) ?? [];
  const baseInterventions = list(base?.interventions) ?? [];

  if (api.conditions !== undefined) {
    op.conditions = list(api.conditions)?.map((c, i) => {
      const baseCondition = baseItem(baseConditions, c, i);
      const baseFlows = list(baseCondition?.flows) ?? [];
      return {
        ...inward(c as AnyRecord, [], keep(baseCondition, [...APP_ONLY_EVERYWHERE, ...APP_ONLY_CONDITION])),
        flows:
          list(c.flows)?.map((f, j) => inward(f as AnyRecord, [], keep(baseItem(baseFlows, f, j), APP_ONLY_EVERYWHERE))) ??
          (mode === "replace" ? null : baseCondition?.flows),
      };
    }) ?? null;
  }
  if (api.assets !== undefined) {
    op.assets = list(api.assets)?.map((a, i) => fromApiAsset(a, baseItem(baseAssets, a, i), mode)) ?? null;
  }
  if (api.interventions !== undefined) {
    op.interventions =
      list(api.interventions)?.map((v, i) =>
        fromApiIntervention(v, keep(baseItem(baseInterventions, v, i), [...APP_ONLY_EVERYWHERE, ...APP_ONLY_INTERVENTION])),
      ) ?? null;
  }
  // The app's insurances never come from the API (its insurance policies are another shape)
  if (base) op.insurances = (base as AnyRecord).insurances;
  else delete op.insurances;
  return op as DraftDto;
}
