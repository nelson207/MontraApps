import type {
  BusinessSettingsDto,
  CompanyConfigurationDto,
  MontraAplApplications,
  ScreenCustomizationConfigurationDto,
} from "@platform/api/generated/MontraPOSApi";

// Application settings (Settings → Application): what administrators configure per app, saved
// through the API as the app's screen customization (ScreenCustomizationConfigurationDto):
//   { newsTypes: [1, 3],
//     companies: [{ companyId, businesses, proposalBusinesses,
//                   businessSettings: [{ businessId, classifications, assetTypes }],
//                   equipmentTypes, equipmentCategories }],
//     emailTypes: { personal, work } }
// The backend offers only what is listed: a company that isn't listed, or an empty list, offers
// nothing of that kind (no news types = no news). Keys this app doesn't know (the DTOs allow them)
// are kept. emailTypes is only read from SHARED_APPLICATION, the settings every app shares.

/** Standard .NET role claim; a plain "role" claim is read too */
export const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
export const ADMINISTRATOR_ROLE = "Administrator";

/** The settings shared by every app: the only ones the backend reads emailTypes from */
export const SHARED_APPLICATION: MontraAplApplications = "MONTRA_APPLICATION_APP";

/** The parts of the settings an app offers, in the order they're shown */
export type AppSettingsSection = "companies" | "newsTypes" | "emailTypes";

export type AppSettingsConfig = {
  /** Screen customization identifier, e.g. MONTRA_APPLICATION_CREDIT */
  identifier: MontraAplApplications;
  sections: AppSettingsSection[];
};

/** An asset type (1 = equipment, 2 = building), or null: no asset */
export type AssetTypeId = number | null;

/**
 * What one business offers: its contract classifications (CredOperClassification ids) and its
 * asset types (null = no asset, e.g. a personal loan)
 */
export type BusinessSetting = {
  businessId: number;
  classifications: number[];
  assetTypes: AssetTypeId[];
  /** Keys this app doesn't know, kept as they were */
  extra?: Record<string, unknown>;
};

/**
 * One available company. A company that isn't listed isn't available. In each list only what is
 * listed is offered (empty = none): its businesses, those that can start in proposal (always
 * among the businesses), each business's contract classifications and asset types, its equipment types and
 * their categories.
 */
export type CompanySetting = {
  companyId: number;
  businesses: number[];
  proposalBusinesses: number[];
  /** One entry per available business that has classifications or asset types listed */
  businessSettings: BusinessSetting[];
  equipmentTypes: number[];
  equipmentCategories: number[];
  /** Keys this app doesn't know, kept as they were */
  extra?: Record<string, unknown>;
};

export type AppSettings = {
  newsTypes: number[];
  companies: CompanySetting[];
  /** The e-mail type ids (EmailDto.entityEmailTypeId) of personal and work addresses */
  emailTypes: { personal: number | null; work: number | null };
  /** Keys this app doesn't know, kept as they were */
  extra?: Record<string, unknown>;
};

export const EMPTY_SETTINGS: AppSettings = { newsTypes: [], companies: [], emailTypes: { personal: null, work: null } };

/** The signed-in user is an administrator (role claim: one value or a list, any case) */
export function isAdministrator(claims: Record<string, unknown> | null | undefined): boolean {
  if (!claims) return false;
  const roles = [claims[ROLE_CLAIM], claims.role].flat();
  return roles.some((role) => typeof role === "string" && role.toLowerCase() === ADMINISTRATOR_ROLE.toLowerCase());
}

const ids = (value: unknown): number[] =>
  Array.isArray(value) ? value.filter((v): v is number => typeof v === "number" && Number.isInteger(v)) : [];
const id = (value: unknown): number | null => (typeof value === "number" && Number.isInteger(value) ? value : null);
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const without = (record: Record<string, unknown>, keys: string[]) => {
  const rest = Object.fromEntries(Object.entries(record).filter(([key]) => !keys.includes(key)));
  return Object.keys(rest).length ? rest : undefined;
};

// businessClassifications: the earlier name of businessSettings (read, then saved under the new one)
const COMPANY_KEYS = ["companyId", "businesses", "proposalBusinesses", "businessSettings", "businessClassifications", "equipmentTypes", "equipmentCategories"];
const BUSINESS_SETTING_KEYS = ["businessId", "classifications", "assetTypes"];
const SETTINGS_KEYS = ["newsTypes", "companies", "emailTypes"];

/** Asset type ids, null (no asset) included, without repeats */
const assetTypeIds = (value: unknown): AssetTypeId[] =>
  Array.isArray(value)
    ? value.filter((v, i): v is AssetTypeId => (v === null || id(v) !== null) && value.indexOf(v) === i)
    : [];

/** The entries of available businesses, one per business (the first one wins) */
function toBusinessSettings(value: unknown, businesses: number[]): BusinessSetting[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<BusinessSetting[]>((list, item) => {
    const businessId = isRecord(item) ? id(item.businessId) : null;
    if (businessId === null || !businesses.includes(businessId) || list.some((e) => e.businessId === businessId)) return list;
    const entry = item as Record<string, unknown>;
    return [
      ...list,
      {
        businessId,
        classifications: ids(entry.classifications),
        assetTypes: assetTypeIds(entry.assetTypes),
        extra: without(entry, BUSINESS_SETTING_KEYS),
      },
    ];
  }, []);
}

function toCompanySetting(item: unknown): CompanySetting[] {
  if (!isRecord(item) || id(item.companyId) === null) return [];
  const businesses = ids(item.businesses);
  const proposal = ids(item.proposalBusinesses);
  return [
    {
      companyId: item.companyId as number,
      businesses,
      // Proposal businesses and classified ones are always among the available ones
      proposalBusinesses: proposal.filter((b) => businesses.includes(b)),
      businessSettings: toBusinessSettings(item.businessSettings ?? item.businessClassifications, businesses),
      equipmentTypes: ids(item.equipmentTypes),
      equipmentCategories: ids(item.equipmentCategories),
      extra: without(item, COMPANY_KEYS),
    },
  ];
}

/** The saved configuration (the DTO, or its JSON text as older saves have it); anything unreadable → no settings */
export function parseSettings(raw: unknown): AppSettings {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return EMPTY_SETTINGS;
    }
  }
  if (!isRecord(value)) return EMPTY_SETTINGS;
  const emailTypes = isRecord(value.emailTypes) ? value.emailTypes : {};
  return {
    newsTypes: ids(value.newsTypes),
    companies: Array.isArray(value.companies) ? value.companies.flatMap(toCompanySetting) : [],
    emailTypes: { personal: id(emailTypes.personal), work: id(emailTypes.work) },
    extra: without(value, SETTINGS_KEYS),
  };
}

/** The settings as saved (SaveScreenCustomizationRequest.configuration) */
export function toConfiguration(settings: AppSettings): ScreenCustomizationConfigurationDto {
  return {
    ...settings.extra,
    newsTypes: settings.newsTypes,
    companies: settings.companies.map(
      (c): CompanyConfigurationDto => ({
        ...c.extra,
        companyId: c.companyId,
        businesses: c.businesses,
        proposalBusinesses: c.proposalBusinesses,
        businessSettings: c.businessSettings.map(
          (b): BusinessSettingsDto => ({ ...b.extra, businessId: b.businessId, classifications: b.classifications, assetTypes: b.assetTypes }),
        ),
        equipmentTypes: c.equipmentTypes,
        equipmentCategories: c.equipmentCategories,
      }),
    ),
    emailTypes: settings.emailTypes,
  };
}

/** Same settings, whatever the order of the lists */
export function sameSettings(a: AppSettings, b: AppSettings): boolean {
  const sorted = (list: number[]) => [...list].sort((x, y) => x - y);
  // No asset (null) first
  const sortedAssetTypes = (list: AssetTypeId[]) => [...list].sort((x, y) => (x ?? -Infinity) - (y ?? -Infinity));
  const key = (s: AppSettings) =>
    JSON.stringify({
      ...toConfiguration(s),
      newsTypes: sorted(s.newsTypes),
      companies: [...s.companies]
        .sort((x, y) => x.companyId - y.companyId)
        .map((c) => [
          c.companyId,
          sorted(c.businesses),
          sorted(c.proposalBusinesses),
          [...c.businessSettings]
            .sort((x, y) => x.businessId - y.businessId)
            .map((b) => [b.businessId, sorted(b.classifications), sortedAssetTypes(b.assetTypes), b.extra ?? null]),
          sorted(c.equipmentTypes),
          sorted(c.equipmentCategories),
        ]),
    });
  return key(a) === key(b);
}

const without_ = (list: number[], remove: number[]) => list.filter((id) => !remove.includes(id));
const withAll = (list: number[], add: number[]) => [...list, ...add.filter((id) => !list.includes(id))];

/**
 * Ticks or unticks an equipment type. Ticked, it comes with `categoryIds` (its categories to
 * offer: the backend offers a type's categories only when they're listed too); unticked, every
 * one of `allCategoryIds` (all its categories) goes with it.
 */
export function setEquipmentType(
  setting: CompanySetting,
  typeId: number,
  on: boolean,
  { categoryIds, allCategoryIds }: { categoryIds: number[]; allCategoryIds: number[] },
): CompanySetting {
  return on
    ? { ...setting, equipmentTypes: withAll(setting.equipmentTypes, [typeId]), equipmentCategories: withAll(setting.equipmentCategories, categoryIds) }
    : { ...setting, equipmentTypes: without_(setting.equipmentTypes, [typeId]), equipmentCategories: without_(setting.equipmentCategories, allCategoryIds) };
}

/** Ticks or unticks a category; ticking one also ticks its type */
export function setEquipmentCategory(setting: CompanySetting, typeId: number, categoryId: number, on: boolean): CompanySetting {
  return on
    ? { ...setting, equipmentTypes: withAll(setting.equipmentTypes, [typeId]), equipmentCategories: withAll(setting.equipmentCategories, [categoryId]) }
    : { ...setting, equipmentCategories: without_(setting.equipmentCategories, [categoryId]) };
}

const businessSettingOf = (setting: CompanySetting, businessId: number) =>
  setting.businessSettings.find((b) => b.businessId === businessId);

/** The business's entry changed (it's added when it has none) */
function updateBusinessSetting(setting: CompanySetting, businessId: number, changes: Partial<BusinessSetting>): CompanySetting {
  return {
    ...setting,
    businessSettings: businessSettingOf(setting, businessId)
      ? setting.businessSettings.map((b) => (b.businessId === businessId ? { ...b, ...changes } : b))
      : [...setting.businessSettings, { businessId, classifications: [], assetTypes: [], ...changes }],
  };
}

/** The classifications a business offers (none listed = none) */
export const classificationsOf = (setting: CompanySetting, businessId: number): number[] =>
  businessSettingOf(setting, businessId)?.classifications ?? [];

/** The business's classifications replaced (its entry is added when it has none) */
export const setClassifications = (setting: CompanySetting, businessId: number, classifications: number[]): CompanySetting =>
  updateBusinessSetting(setting, businessId, { classifications });

/** The asset types a business offers (none listed = none) */
export const assetTypesOf = (setting: CompanySetting, businessId: number): AssetTypeId[] =>
  businessSettingOf(setting, businessId)?.assetTypes ?? [];

/** The business's asset types replaced (its entry is added when it has none) */
export const setAssetTypes = (setting: CompanySetting, businessId: number, assetTypes: AssetTypeId[]): CompanySetting =>
  updateBusinessSetting(setting, businessId, { assetTypes });

/** Ticks or unticks one asset type of a business; ticking it also makes the business available */
export function setAssetType(setting: CompanySetting, businessId: number, assetType: AssetTypeId, on: boolean): CompanySetting {
  const others = assetTypesOf(setting, businessId).filter((a) => a !== assetType);
  const next = setAssetTypes(setting, businessId, on ? [...others, assetType] : others);
  return on ? { ...next, businesses: withAll(next.businesses, [businessId]) } : next;
}

/** Ticks or unticks one classification of a business; ticking it also makes the business available */
export function setClassification(setting: CompanySetting, businessId: number, classificationId: number, on: boolean): CompanySetting {
  const current = classificationsOf(setting, businessId);
  const next = setClassifications(setting, businessId, on ? withAll(current, [classificationId]) : without_(current, [classificationId]));
  return on ? { ...next, businesses: withAll(next.businesses, [businessId]) } : next;
}

/** What a business ticked now comes with, for each list it has nothing in yet */
export type BusinessDefaults = { classificationIds?: number[]; assetTypeIds?: AssetTypeId[] };

/**
 * Ticks or unticks a business. Ticked, it comes with `classificationIds` (the classifications to
 * offer) and `assetTypeIds` (its asset types) unless it already lists some; unticked, it can't
 * start in proposal and its classifications and asset types go with it.
 */
export function setBusiness(
  setting: CompanySetting,
  businessId: number,
  on: boolean,
  { classificationIds = [], assetTypeIds = [] }: BusinessDefaults = {},
): CompanySetting {
  if (on) {
    let next = { ...setting, businesses: withAll(setting.businesses, [businessId]) };
    if (!classificationsOf(setting, businessId).length) next = setClassifications(next, businessId, classificationIds);
    if (!assetTypesOf(setting, businessId).length) next = setAssetTypes(next, businessId, assetTypeIds);
    return next;
  }
  return {
    ...setting,
    businesses: without_(setting.businesses, [businessId]),
    proposalBusinesses: without_(setting.proposalBusinesses, [businessId]),
    businessSettings: setting.businessSettings.filter((b) => b.businessId !== businessId),
  };
}

/** Ticks or unticks "can start in proposal"; ticking it also makes the business available */
export function setProposalBusiness(
  setting: CompanySetting,
  businessId: number,
  on: boolean,
  options: BusinessDefaults = {},
): CompanySetting {
  if (!on) return { ...setting, proposalBusinesses: without_(setting.proposalBusinesses, [businessId]) };
  const available = setBusiness(setting, businessId, true, options);
  return { ...available, proposalBusinesses: withAll(available.proposalBusinesses, [businessId]) };
}

/** A newly listed company: nothing ticked inside it yet */
export const newCompanySetting = (companyId: number): CompanySetting => ({
  companyId,
  businesses: [],
  proposalBusinesses: [],
  businessSettings: [],
  equipmentTypes: [],
  equipmentCategories: [],
});

/**
 * The businesses a new proposal can start with, by id; undefined = no restriction (nothing
 * configured, or a company that allows all of its businesses). The operation has no company
 * yet when the business is picked, so a business allowed in any company counts.
 */
export function proposalBusinessIds(companies: CompanySetting[]): number[] | undefined {
  if (!companies.length || companies.some((c) => !c.proposalBusinesses.length && !c.businesses.length)) return undefined;
  return [...new Set(companies.flatMap((c) => (c.proposalBusinesses.length ? c.proposalBusinesses : c.businesses)))];
}

/** `items` limited to the `chosen` values (none chosen = all of them) */
export function restrictTo<T>(items: T[], chosen: (string | number)[] | undefined, idOf: (item: T) => string | number): T[] {
  if (!chosen?.length) return items;
  return items.filter((item) => chosen.includes(idOf(item)));
}
