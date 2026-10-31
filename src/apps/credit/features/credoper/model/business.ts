import type { AvailableBusinessDto, AvailableFinancialProductDto, BuildingDto } from "@platform/api/generated/MontraPOSApi";
import type { CredOperAssetDto, CredOperDto, EquipmentDto } from "@platform/api/legacy/legacyApi";
import type { CredOperDraft } from "./credOperDraft";

// The type of business of an operation (CredOperDto.aplBusinessId): the first choice of every
// quotation and proposal. It decides which steps there are: vehicles, financing, insurance.
// Which businesses (and their financial products) a company offers comes from the API
// (GET /api/credit-operations/businesses); what each one means for the wizard (icon, equipment,
// financing) is the app's, below. A business the app doesn't know gets DEFAULT_TRAITS.

/** TODO: placeholder until the backend gives Auto insurance its aplBusinessId */
export const AUTO_INSURANCE_BUSINESS_ID = 50;

export type EquipmentMode = "none" | "single" | "multiple";

export type Business = {
  id: number;
  label: string;
  description: string;
  /** Bootstrap Icons class */
  icon: string;
  equipment: EquipmentMode;
  /** Financed (product, amounts, term); Auto insurance isn't */
  financing: boolean;
};

export const BUSINESSES: Business[] = [
  {
    id: 4,
    label: "Auto credit",
    description: "Credit to buy a vehicle.",
    icon: "bi-car-front",
    equipment: "single",
    financing: true,
  },
  {
    id: 2,
    label: "Personal loan",
    description: "Credit without equipment.",
    icon: "bi-wallet2",
    equipment: "none",
    financing: true,
  },
  {
    id: 1,
    label: "Financial leasing",
    description: "Leasing of one vehicle or piece of equipment.",
    icon: "bi-file-earmark-text",
    equipment: "single",
    financing: true,
  },
  {
    id: 13,
    label: "Renting",
    description: "One contract for several vehicles.",
    icon: "bi-collection",
    equipment: "multiple",
    financing: true,
  },
  {
    id: AUTO_INSURANCE_BUSINESS_ID,
    label: "Auto insurance",
    description: "Insurance for a vehicle, without financing.",
    icon: "bi-shield-check",
    equipment: "single",
    financing: false,
  },
];

/** A business the app has no traits for: no equipment, financed */
const DEFAULT_TRAITS = { icon: "bi-briefcase", equipment: "none", financing: true } as const;

/** The API's names of the businesses loaded so far (the operation stores the id only) */
const apiNames = new Map<number, { label: string; description: string }>();

/**
 * What an operation finances (AssetType id, offered per business and company: Settings →
 * Application). Not an enum in the API: 1 = equipment (vehicles), 2 = building; null = no asset
 * (e.g. a personal loan).
 */
export type AssetTypeId = number | null;
export const EQUIPMENT_ASSET = 1;
export const BUILDING_ASSET = 2;

export type AssetTypeOption = { id: AssetTypeId; label: string };

/** The asset type's name: the API's, else the app's for the known ones */
export const assetTypeLabel = (id: AssetTypeId, label?: string | null): string =>
  label?.trim() || (id === null ? "No asset" : id === EQUIPMENT_ASSET ? "Equipment" : id === BUILDING_ASSET ? "Building" : `Asset type ${id}`);

/** A company a business can be done with, that company's financial products and asset types for it */
export type BusinessOffer = {
  companyId: number;
  companyLabel: string;
  financialProducts: AvailableFinancialProductDto[];
  assetTypes: AssetTypeOption[];
};

/** A business of the API, with the app's traits for it and the companies it can be done with */
export type AvailableBusiness = Business & { offers: BusinessOffer[] };

export const businessById = (id: number | null | undefined): Business | null => {
  if (!id) return null;
  const known = BUSINESSES.find((b) => b.id === id) ?? { id, label: `Business ${id}`, description: "", ...DEFAULT_TRAITS };
  return { ...known, ...apiNames.get(id) };
};

/**
 * GET /api/credit-operations/businesses → businesses with their traits; their names are
 * remembered. The answer has one item per business and company (the backend applies the
 * configured companies and businesses): they're grouped by business, in the answer's order.
 */
export function toAvailableBusinesses(list: AvailableBusinessDto[]): AvailableBusiness[] {
  const businesses = new Map<number, AvailableBusiness>();
  for (const dto of list) {
    if (typeof dto.id !== "number") continue;
    const abbreviation = dto.abbreviation?.trim();
    const description = dto.description?.trim() ?? "";
    if (abbreviation || description)
      apiNames.set(dto.id, abbreviation ? { label: abbreviation, description } : { label: description, description: "" });
    const business = businesses.get(dto.id) ?? { ...businessById(dto.id)!, offers: [] };
    businesses.set(dto.id, business);
    if (typeof dto.companyId !== "number" || business.offers.some((o) => o.companyId === dto.companyId)) continue;
    business.offers.push({
      companyId: dto.companyId,
      companyLabel: dto.companyAbbreviation?.trim() || `Company ${dto.companyId}`,
      financialProducts: (dto.financialProducts ?? []).filter((p) => typeof p.id === "number"),
      // No asset is a null id (also when the answer leaves it out)
      assetTypes: (dto.assetTypes ?? []).flatMap((a) => {
        const id = a.id ?? null;
        return id === null || typeof id === "number" ? [{ id, label: assetTypeLabel(id, a.abbreviation) }] : [];
      }),
    });
  }
  return [...businesses.values()];
}

/** The asset types of a business in a company; every company's (without repeats) while no company is set */
export function assetTypesOf(business: AvailableBusiness | undefined, companyId: number | null | undefined): AssetTypeOption[] {
  const offers = business?.offers.filter((o) => !companyId || o.companyId === companyId) ?? [];
  const all = offers.flatMap((o) => o.assetTypes);
  return all.filter((a, i) => all.findIndex((b) => b.id === a.id) === i);
}

/**
 * The financial products of a business in the operation's company; all its companies' (without
 * repeats) while no company is set.
 */
export function productsOf(business: AvailableBusiness | undefined, companyId: number | null | undefined): AvailableFinancialProductDto[] {
  const offers = business?.offers.filter((o) => !companyId || o.companyId === companyId) ?? [];
  const products = offers.flatMap((o) => o.financialProducts);
  return products.filter((p, i) => products.findIndex((q) => q.id === p.id) === i);
}

export const businessOf = (op: CredOperDto): Business | null => businessById(op.aplBusinessId);

/** An operation with the asset type chosen for it (app-only: undefined until it's chosen or decided) */
type WithAssetType = CredOperDto & { assetTypeId?: AssetTypeId };

/**
 * The operation's asset type; undefined while not chosen (the key there, undefined: to be chosen
 * again). An operation that doesn't say (opened from the server) has its first asset's, or,
 * saved before asset types, its business's.
 */
export function assetTypeOf(op: WithAssetType): AssetTypeId | undefined {
  if ("assetTypeId" in op) return op.assetTypeId;
  const kind = op.assets?.[0]?.assetType;
  if (kind != null) return kind;
  if (op.id == null) return undefined;
  return businessOf(op)?.equipment === "none" ? null : EQUIPMENT_ASSET;
}

/** Vehicles only with equipment: several when the business takes several (Renting) */
export const equipmentModeOf = (op: CredOperDto): EquipmentMode =>
  assetTypeOf(op) !== EQUIPMENT_ASSET ? "none" : businessOf(op)?.equipment === "multiple" ? "multiple" : "single";

export const hasEquipment = (op: CredOperDto): boolean => assetTypeOf(op) === EQUIPMENT_ASSET;

export const hasBuilding = (op: CredOperDto): boolean => assetTypeOf(op) === BUILDING_ASSET;

/** What the financing amount is of: the vehicle, the building, or the loan itself */
export const amountLabel = (op: CredOperDto): string =>
  hasEquipment(op) ? "Equipment amount" : hasBuilding(op) ? "Building amount" : "Loan amount";

export const hasFinancing = (op: CredOperDto): boolean => businessOf(op)?.financing ?? true;

export const isAutoInsurance = (op: CredOperDto): boolean => op.aplBusinessId === AUTO_INSURANCE_BUSINESS_ID;

/** Auto credit and Financial leasing: the amount typed is also what the asset is bought and financed for */
const AMOUNT_FILLS_ASSET = [4, 1];

/**
 * The assets with the amount typed for asset `index`: its equipment's net amount; for Auto
 * credit and Financial leasing also the equipment's purchase amount and the asset's amount and
 * base amount (the amount × the equipment's quantity, 1 when it has none).
 * TODO: the other businesses' rules.
 */
export function withAssetAmount(op: CredOperDto, index: number, amount: number | null | undefined): CredOperAssetDto[] {
  const assets = [...(op.assets ?? [])];
  const asset = assets[index] ?? {};
  const equipment = { ...asset.equipment, netAmount: amount };
  if (!AMOUNT_FILLS_ASSET.includes(op.aplBusinessId ?? 0)) {
    assets[index] = { ...asset, equipment };
    return assets;
  }
  const total = amount == null ? amount : amount * (asset.equipment?.quantity || 1);
  assets[index] = { ...asset, amount: total, baseAmount: total, equipment: { ...equipment, purchaseAmount: amount } };
  return assets;
}

/** The fields that describe the vehicle itself (not its financing) */
const VEHICLE_FIELDS: (keyof EquipmentDto)[] = [
  "equipmentTypeId",
  "equipmentCategoryId",
  "equipmentStateId",
  "licencePlate",
  "registrationDate",
  "description",
  "brand",
  "model",
  "version",
  "odometer",
  "enginesize",
  "doors",
  "baseMarketValue",
];

const hasVehicleData = (asset: CredOperAssetDto) =>
  VEHICLE_FIELDS.some((field) => {
    const value = asset.equipment?.[field];
    return value !== null && value !== undefined && value !== "";
  });

const withoutVehicle = (asset: CredOperAssetDto): CredOperAssetDto => {
  if (!asset.equipment) return asset;
  const equipment = { ...asset.equipment };
  VEHICLE_FIELDS.forEach((field) => delete equipment[field]);
  return { ...asset, equipment };
};

/** The building of an asset (the draft's asset type doesn't name it; the new API's does) */
export const buildingOf = (asset: CredOperAssetDto | undefined): BuildingDto | undefined =>
  (asset as { building?: BuildingDto } | undefined)?.building ?? undefined;

const hasBuildingData = (asset: CredOperAssetDto) =>
  Object.entries(buildingOf(asset) ?? {}).some(
    ([key, value]) => !["metadataResponse", "currencyId", "aplCompanyId"].includes(key) && value !== null && value !== undefined && value !== "",
  );

const withoutBuilding = (asset: CredOperAssetDto): CredOperAssetDto => {
  const rest = { ...asset } as CredOperAssetDto & { building?: BuildingDto };
  delete rest.building;
  return rest;
};

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Car insurances of vehicles that are gone: removed with them */
function withoutLostCars(insurances: CredOperDraft["insurances"], assets: CredOperAssetDto[], keepsVehicles: boolean, removed: string[]) {
  const keptRefs = new Set(keepsVehicles ? assets.map((a) => a.correlationID) : []);
  const cars = insurances.filter((i) => i.kind === "car" && !keptRefs.has(i.assetRef));
  if (cars.length) removed.push(count(cars.length, "car insurance", "car insurances"));
  return insurances.filter((i) => !cars.includes(i));
}

/**
 * The operation with another asset type, and what that removes (for the confirmation): vehicle
 * details (and their car insurances) when it no longer finances equipment, the building's when
 * it no longer finances a building. There's always a first asset: the financing amounts are on it
 * (also for no asset).
 */
export function changeAssetType(op: CredOperDraft, id: AssetTypeId): { next: CredOperDraft; removed: string[] } {
  const removed: string[] = [];
  let assets = op.assets?.length ? op.assets : [{}];
  if (id !== EQUIPMENT_ASSET) {
    if (assets.some(hasVehicleData)) removed.push("the vehicle details");
    if (assets.length > 1) removed.push(count(assets.length - 1, "other vehicle", "other vehicles"));
    assets = assets.slice(0, 1).map(withoutVehicle);
  }
  if (id !== BUILDING_ASSET) {
    if (assets.some(hasBuildingData)) removed.push("the building details");
    assets = assets.map(withoutBuilding);
  }
  const insurances = withoutLostCars(op.insurances, assets, id === EQUIPMENT_ASSET, removed);
  return { next: { ...op, assetTypeId: id, assets: assets.map((a) => ({ ...a, assetType: id })), insurances }, removed };
}

/**
 * The operation with another business, and what that removes (for the confirmation): what its
 * asset type had when the business doesn't offer it (`offered`: its asset types, any company),
 * extra vehicles when only one is allowed, car insurances of removed vehicles, credit
 * protections for auto insurance. A different business also clears the financial product (products
 * depend on the business) and, when it isn't offered, the asset type (chosen or decided again).
 */
export function changeBusiness(op: CredOperDraft, id: number, offered: AssetTypeId[] = []): { next: CredOperDraft; removed: string[] } {
  const target = businessById(id);
  const removed: string[] = [];
  const current = assetTypeOf(op);
  const keepsAssetType = current !== undefined && offered.includes(current);
  let assets = op.assets ?? [];
  let assetTypeId: AssetTypeId | undefined = keepsAssetType ? current : undefined;

  if (!keepsAssetType && current !== undefined) {
    // What only that asset type had goes; the next one starts from no asset
    const dropped = changeAssetType(op, null);
    removed.push(...dropped.removed.filter((r) => !r.includes("insurance")));
    assets = op.assets ? dropped.next.assets ?? [] : assets;
    assetTypeId = undefined;
  } else if (target?.equipment !== "multiple" && assets.length > 1) {
    removed.push(count(assets.length - 1, "other vehicle", "other vehicles"));
    assets = assets.slice(0, 1);
  }

  let insurances = withoutLostCars(op.insurances, assets, keepsAssetType && current === EQUIPMENT_ASSET, removed);

  if (id === AUTO_INSURANCE_BUSINESS_ID) {
    const protections = insurances.filter((i) => i.kind === "creditProtection");
    if (protections.length) removed.push(count(protections.length, "credit protection", "credit protections"));
    insurances = insurances.filter((i) => i.kind !== "creditProtection");
  }

  const changed = op.aplBusinessId != null && op.aplBusinessId !== id;
  return {
    next: {
      ...op,
      aplBusinessId: id,
      financialProduct: changed ? null : op.financialProduct,
      assetTypeId,
      assets: op.assets ? assets : op.assets,
      insurances,
    },
    removed,
  };
}
