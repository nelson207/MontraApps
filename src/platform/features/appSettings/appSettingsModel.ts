import type {
  CompanyConfigurationDto,
  MontraAplApplications,
  ScreenCustomizationConfigurationDto,
} from "@platform/api/generated/MontraPOSApi";

// Application settings (Settings → Application): what administrators configure per app, saved
// through the API as the app's screen customization (ScreenCustomizationConfigurationDto):
//   { newsTypes: [1, 3],
//     companies: [{ companyId, businesses, proposalBusinesses, equipmentTypes, equipmentCategories }],
//     emailTypes: { personal, work } }
// Empty lists mean no restriction. Keys this app doesn't know (the DTOs allow them) are kept.

/** Standard .NET role claim; a plain "role" claim is read too */
export const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
export const ADMINISTRATOR_ROLE = "Administrator";

/** The parts of the settings an app offers, in the order they're shown */
export type AppSettingsSection = "companies" | "newsTypes" | "emailTypes";

export type AppSettingsConfig = {
  /** Screen customization identifier, e.g. MONTRA_APPLICATION_CREDIT */
  identifier: MontraAplApplications;
  sections: AppSettingsSection[];
};

/**
 * One available company. A company that isn't listed isn't available (no company listed = no
 * restriction). In each list, empty = all: all the company's businesses, all its available
 * businesses can start in proposal, all equipment types / categories.
 */
export type CompanySetting = {
  companyId: number;
  businesses: number[];
  proposalBusinesses: number[];
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

const COMPANY_KEYS = ["companyId", "businesses", "proposalBusinesses", "equipmentTypes", "equipmentCategories"];
const SETTINGS_KEYS = ["newsTypes", "companies", "emailTypes"];

function toCompanySetting(item: unknown): CompanySetting[] {
  if (!isRecord(item) || id(item.companyId) === null) return [];
  const businesses = ids(item.businesses);
  const proposal = ids(item.proposalBusinesses);
  return [
    {
      companyId: item.companyId as number,
      businesses,
      // Proposal businesses are always among the available ones
      proposalBusinesses: businesses.length ? proposal.filter((b) => businesses.includes(b)) : proposal,
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
  const key = (s: AppSettings) =>
    JSON.stringify({
      ...toConfiguration(s),
      newsTypes: sorted(s.newsTypes),
      companies: [...s.companies]
        .sort((x, y) => x.companyId - y.companyId)
        .map((c) => [c.companyId, sorted(c.businesses), sorted(c.proposalBusinesses), sorted(c.equipmentTypes), sorted(c.equipmentCategories)]),
    });
  return key(a) === key(b);
}

/** A new available company: no restriction inside it */
export const newCompanySetting = (companyId: number): CompanySetting => ({
  companyId,
  businesses: [],
  proposalBusinesses: [],
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
