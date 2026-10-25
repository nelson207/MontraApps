import type { AvailableBusinessDto, AvailableFinancialProductDto } from "@platform/api/generated/MontraPOSApi";
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

/** A company a business can be done with, and that company's financial products for it */
export type BusinessOffer = { companyId: number; companyLabel: string; financialProducts: AvailableFinancialProductDto[] };

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
    });
  }
  return [...businesses.values()];
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

export const equipmentModeOf = (op: CredOperDto): EquipmentMode => businessOf(op)?.equipment ?? "none";

export const hasEquipment = (op: CredOperDto): boolean => equipmentModeOf(op) !== "none";

export const hasFinancing = (op: CredOperDto): boolean => businessOf(op)?.financing ?? true;

export const isAutoInsurance = (op: CredOperDto): boolean => op.aplBusinessId === AUTO_INSURANCE_BUSINESS_ID;

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
  const equipment = { ...asset.equipment };
  VEHICLE_FIELDS.forEach((field) => delete equipment[field]);
  return { ...asset, equipment };
};

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The operation with another business, and what that removes (for the confirmation):
 * vehicle details for a business without equipment, extra vehicles when only one is allowed,
 * car insurances of removed vehicles, credit protections for auto insurance. A different
 * business also clears the financial product, since products depend on the business.
 */
export function changeBusiness(op: CredOperDraft, id: number): { next: CredOperDraft; removed: string[] } {
  const target = businessById(id);
  const removed: string[] = [];
  let assets = op.assets ?? [];
  let insurances = op.insurances;

  if (target?.equipment === "none") {
    if (assets.some(hasVehicleData)) removed.push("the vehicle details");
    assets = assets.slice(0, 1).map(withoutVehicle);
  } else if (target?.equipment === "single" && assets.length > 1) {
    removed.push(count(assets.length - 1, "other vehicle", "other vehicles"));
    assets = assets.slice(0, 1);
  }

  const keptRefs = new Set(target?.equipment === "none" ? [] : assets.map((a) => a.correlationID));
  const cars = insurances.filter((i) => i.kind === "car" && !keptRefs.has(i.assetRef));
  if (cars.length) removed.push(count(cars.length, "car insurance", "car insurances"));
  insurances = insurances.filter((i) => !cars.includes(i));

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
      assets: op.assets ? assets : op.assets,
      insurances,
    },
    removed,
  };
}
