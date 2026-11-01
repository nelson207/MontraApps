import type { CredOperDto as ApiCredOperDto, CreditOperationStep } from "@platform/api/generated/MontraPOSApi";
import type { CredOperDto, CredOperIntervDto } from "@platform/api/legacy/legacyApi";
import { fromApiCredOper, stepName, stepNumber, toApiCredOper } from "../features/credoper/api/credOperMapping";
import { BUSINESSES } from "../features/credoper/model/business";
import { registerDemoHandlers, type DemoRequest } from "@platform/api/demoBackend";
import { demoCalculate } from "./demoCalculation";
import type { EntityData } from "../features/credoper/entityLookup/entityLookupApi";
import { delay } from "@platform/api/devFallback";

// DEVELOPMENT ONLY — Montra Credit's answers for the demo backend (platform/api/demoBackend.ts):
// used while signed in with "Demo access" and the API can't be reached, so quotations, proposals
// and the search work without a backend. Kept in memory: a page reload starts over.
// Registered from store.ts in development only.

const product = (code: number, abbreviation: string, description: string, rate: number, term: number) => ({
  code: String(code),
  abbreviation,
  description,
  rate,
  term,
});

/** Financial products per business (aplBusinessId), with the rate and term they default to */
const PRODUCTS: Record<number, ReturnType<typeof product>[]> = {
  4: [
    product(1041, "Auto credit — new", "Credit for new vehicles", 6.9, 72),
    product(1042, "Auto credit — used", "Credit for used vehicles", 8.4, 60),
  ],
  2: [
    product(1021, "Personal loan", "General purpose personal loan", 9.9, 48),
    product(1022, "Personal loan — green", "Energy efficiency and electric mobility", 7.5, 60),
  ],
  1: [
    product(1011, "Leasing — vehicles", "Financial leasing of vehicles", 5.9, 60),
    product(1012, "Leasing — equipment", "Financial leasing of equipment", 6.4, 48),
  ],
  13: [
    product(1131, "Renting — fleet", "Operating lease for company fleets", 5.5, 48),
    product(1132, "Renting — private", "Operating lease for private customers", 6.2, 36),
  ],
};
const ALL_PRODUCTS = Object.entries(PRODUCTS).flatMap(([business, list]) => list.map((p) => ({ ...p, business: Number(business) })));
const productById = (id: unknown) => ALL_PRODUCTS.find((p) => p.code === String(id));

/** Contract classifications (CredOperClassificationDto) */
/** GET /api/catalog/asset-types: no asset (null), equipment (1), building (2) */
const ASSET_TYPES = [
  { id: null, abbreviation: "No asset" },
  { id: 1, abbreviation: "Equipment" },
  { id: 2, abbreviation: "Building" },
];

const CLASSIFICATIONS = [
  { id: 1, abbreviation: "Private", description: "Private customer", isValid: true },
  { id: 2, abbreviation: "Self-employed", description: "Self-employed customer", isValid: true },
  { id: 3, abbreviation: "Company", description: "Company", isValid: true },
];

const customerTemplate = (): CredOperIntervDto => ({
  correlationID: "",
  credOperIntervType: 1,
  entity: {},
  person: {},
  metadataResponse: [],
});

const newOperation = (includeCustomer: boolean): CredOperDto => ({
  id: null,
  credOperNumber: null,
  customerName: "",
  amount: null,
  financialProduct: null,
  metadataResponse: [],
  conditions: [{ term: 60, metadataResponse: [], flows: [] }],
  assets: [{ correlationID: "", metadataResponse: [], equipment: { metadataResponse: [] } }],
  interventions: includeCustomer ? [customerTemplate()] : [],
});

// Saved operations of this session, for the search
const saved = new Map<string, CredOperDto>();
let lastNumber = 0;

const body = (request: DemoRequest) => (request.body ?? {}) as Record<string, unknown>;
const operationIn = (request: DemoRequest) => (body(request).credOperDto ?? body(request)) as CredOperDto;

function save(op: CredOperDto & { quotationId?: string | null }): CredOperDto {
  // Ids are opaque strings, like the API's; the operation number is the readable one
  const number = op.credOperNumber ?? 2026_000 + ++lastNumber;
  const id = op.id ?? `demo-op-${number}`;
  const result: CredOperDto = {
    ...op,
    id,
    credOperNumber: number,
    beginDate: op.beginDate ?? new Date().toISOString(),
  };
  saved.set(id, result);
  return result;
}

const SAMPLE_CUSTOMERS = ["Ana Silva", "Rui Costa", "Marta Ferreira", "Construtora Norte, Lda.", "Pedro Santos", "Joana Lopes"];

const sampleSearch = (): CredOperDto[] =>
  SAMPLE_CUSTOMERS.map((customerName, i) => ({
    id: `demo-op-search-${i}`,
    credOperNumber: 2025_900 + i,
    customerName,
    credOperStep: i % 3 === 0 ? 2 : 1,
    aplBusinessId: [4, 2, 1, 13, 4, 2][i],
    financialProduct: Number([1041, 1021, 1011, 1131, 1042, 1022][i]),
    amount: [18_500, 7_000, 32_000, 54_000, 12_900, 9_500][i],
    autUserStateId: (i % 4) + 1,
    beginDate: new Date(Date.now() - (i + 1) * 4 * 86_400_000).toISOString(),
    creditIntermediaryStructNode: "o1",
  }));

const DEMO_USER = { id: "demo-user", userName: "demo", fullName: "Demo User", email: "demo@montra.example", culture: "pt-PT", uiCulture: "en-GB" };

let demoContacts: { emails?: object[] | null; phones?: object[] | null; addresses?: object[] | null } = {
  emails: [{ id: "demo-email-1", emailAddress: "demo@montra.example", isMain: true, isValidated: true }],
  phones: [{ id: "demo-phone-1", countryId: "PRT", phoneNumber: "912345678", isMain: true }],
  addresses: [],
};

/** The new API's intervention kinds → the operation's intervention types */
const INTERVENTION_TYPES: Record<string, number> = { Customer: 1, SecondHolder: 2, Guarantor: 4 };

/** A request to the new API, as a draft (the demo calculation works on drafts) */
const apiOperationIn = (request: DemoRequest) => fromApiCredOper((request.body ?? {}) as ApiCredOperDto);

// Entities in the "database" for the NIF lookup (the contacts masked, as the backend sends them)
const DEMO_OTP_CODE = "123456";
const otpRequests = new Map<string, string>();
const DEMO_ENTITIES: Record<string, { phone: string; email: string; data: EntityData }> = {
  "123456789": {
    phone: "+351 9•• ••• 321",
    email: "an•••@example.com",
    data: {
      entity: {
        id: "demo-entity-1",
        entityTypeId: 1,
        fullName: "Ana Maria Silva",
        legalDocs: [{ legalDocTypeId: 1, legalDocNumber: "12345678 9ZZ1", validDate: "2031-03-15" }],
      },
      person: { birthDate: "1988-04-12" },
      entityEmail: { email: "ana.silva@example.com" },
      entityMobilePhone: { phoneNumber: "+351912345321" },
      fiscalEntityAddress: { street: "Rua Augusta 100", postalCode: "1100-053", district: "Lisboa", countryId: "PT" },
    },
  },
  "500000000": {
    phone: "+351 2•• ••• 100",
    email: "fi•••@acme.pt",
    data: {
      entity: { id: "demo-entity-2", entityTypeId: 2, fullName: "Acme Transportes, Lda." },
      entityEmail: { email: "financeiro@acme.pt" },
      entityLandlinePhone: { phoneNumber: "+351210000100" },
      fiscalEntityAddress: { street: "Avenida da Liberdade 200", postalCode: "1250-147", district: "Lisboa", countryId: "PT" },
    },
  },
};

registerDemoHandlers({
  // --- New API (/api/credit-operations/…): same answers, in the new shapes ----------------
  // The "new" objects carry the values the backend sets for the business in the company (the
  // currency among them): the app sets none the user doesn't see
  "GET /api/credit-operations/new-credoper": ({ params }) => ({
    ...toApiCredOper(newOperation(false)),
    aplBusinessId: Number(params.businessId) || null,
    aplCompanyId: Number(params.companyId) || null,
    currencyId: "EUR",
  }),

  "GET /api/credit-operations/new-intervention": (request) =>
    toApiCredOper({ interventions: [{ ...customerTemplate(), credOperIntervType: INTERVENTION_TYPES[request.params.kind] ?? 1 }] })
      .interventions?.[0],

  // --- Users: the demo user may manage users (GET /api/users/{own id} answers) -------------
  "GET /api/users/me": () => DEMO_USER,
  [`GET /api/users/${DEMO_USER.id}`]: () => ({ ...DEMO_USER, aplUserTypeId: 1, authorizationLevel: 9, contacts: demoContacts }),
  "GET /api/users/me/contact-details": () => demoContacts,
  "PUT /api/users/me/contact-details": (request) => {
    const changes = (request.body ?? {}) as typeof demoContacts;
    let n = 0;
    const withIds = <T extends { id?: string | null }>(list: T[] | null | undefined) =>
      list?.map((item) => ({ ...item, id: item.id ?? `demo-contact-${Date.now()}-${++n}` }));
    demoContacts = {
      emails: withIds(changes.emails) ?? demoContacts.emails,
      phones: withIds(changes.phones) ?? demoContacts.phones,
      addresses: withIds(changes.addresses) ?? demoContacts.addresses,
    };
    return demoContacts;
  },
  "GET /api/companies/countries": () => [
    { id: "PRT", abbreviation: "Portugal", alpha2Code: "PT", phonePrefix: 351 },
    { id: "ESP", abbreviation: "Spain", alpha2Code: "ES", phonePrefix: 34 },
    { id: "FRA", abbreviation: "France", alpha2Code: "FR", phonePrefix: 33 },
  ],

  // Settings → Application: the catalog's companies and each one's businesses (the same ones in the demo)
  "GET /api/catalog/companies": () => [
    { id: 1, abbreviation: "Montra Lisboa", currencyId: "EUR" },
    { id: 2, abbreviation: "Montra Porto", currencyId: "EUR" },
  ],
  ...Object.fromEntries(
    [1, 2].map((companyId) => [
      `GET /api/catalog/companies/${companyId}/businesses`,
      () => BUSINESSES.map((b) => ({ id: b.id, abbreviation: b.label, description: b.description })),
    ]),
  ),

  // One item per business and company: Auto credit in both companies, the others only in Lisboa
  "GET /api/credit-operations/businesses": () =>
    BUSINESSES.filter((b) => PRODUCTS[b.id]).flatMap((b) =>
      (b.id === 4 ? [1, 2] : [1]).map((companyId) => ({
        companyId,
        companyAbbreviation: companyId === 1 ? "Montra Lisboa" : "Montra Porto",
        id: b.id,
        abbreviation: b.label,
        description: b.description,
        financialProducts: PRODUCTS[b.id].map(({ code, abbreviation, description }) => ({
          id: Number(code),
          companyId,
          code: abbreviation,
          description,
          importerIds: [],
        })),
        // As Settings → Application would have them: Financial leasing asks (equipment or a
        // building), a personal loan has no asset, the others finance equipment
        assetTypes: b.id === 1 ? [ASSET_TYPES[1], ASSET_TYPES[2]] : b.equipment === "none" ? [ASSET_TYPES[0]] : [ASSET_TYPES[1]],
      })),
    ),

  "GET /api/catalog/asset-types": () => ASSET_TYPES,

  // A new asset with its equipment or building, as the backend sets them
  "GET /api/equipments/new": () => ({ assetType: "Equipment", currencyId: "EUR", equipment: { currencyId: "EUR" } }),
  "GET /api/buildings/new": ({ params }) => ({
    assetType: "Building",
    currencyId: "EUR",
    building: { currencyId: "EUR", aplCompanyId: Number(params.companyId) || null },
  }),

  // The step by name (CreditOperationStep); the saved drafts keep its number
  "GET /api/credit-operations/search": ({ params }) => {
    const step = params.Step ? (stepNumber(params.Step as CreditOperationStep) ?? -1) : null;
    const number = params.Number ? Number(params.Number) : null;
    const all = [...[...saved.values()].reverse(), ...sampleSearch()].filter(
      (op) => (step == null || (op.credOperStep ?? 1) === step) && (number == null || op.credOperNumber === number),
    );
    const page = Number(params.Page) || 1;
    const pageSize = Number(params.PageSize) || 50;
    return {
      items: all.slice((page - 1) * pageSize, page * pageSize).map((op) => ({
        id: op.id,
        number: op.credOperNumber,
        step: stepName(op.credOperStep ?? 1),
        financialProductId: op.financialProduct,
        stateId: op.autUserStateId,
        beginDate: op.beginDate,
        amount: op.amount,
        currencyId: "EUR",
        entityName: op.customerName,
      })),
      page,
      pageSize,
      totalCount: all.length,
    };
  },

  "GET /api/financial-products": (request) => {
    const businessId = Number(request.params.BusinessId);
    const list = businessId ? (PRODUCTS[businessId] ?? []) : ALL_PRODUCTS;
    return list.map(({ code, abbreviation, description }) => ({ id: Number(code), code: abbreviation, description }));
  },

  "POST /api/financial-products/defaults": (request) => {
    const found = productById(apiOperationIn(request).financialProduct);
    return { conditions: [{ term: found?.term ?? 60, implicitRate: found?.rate ?? 7.9 }] };
  },

  "POST /api/credit-operations/calculate-credoper": (request) => ({
    isCalculated: true,
    credOper: toApiCredOper(demoCalculate(apiOperationIn(request))),
    messages: [],
  }),

  // Contract classifications: every one, for the operation and for Settings → Application
  "GET /api/credit-operations/classifications": () => CLASSIFICATIONS,
  "GET /api/catalog/classifications": () => CLASSIFICATIONS,

  // --- Legacy placeholders (platform/api/legacy) -------------------------------------------
  "POST /api/Simulations/GetFinancialProductDetails": (request) => {
    const { finProductId } = (body(request).financialProductDetailsRequest ?? body(request)) as { finProductId?: number };
    const found = productById(finProductId);
    return {
      finProductId: Number(finProductId),
      abrev: found?.abbreviation ?? "Product",
      descr: found?.description ?? null,
      aplBusinessId: found?.business ?? null,
      aplCompanyId: 1,
      currencyId: "EUR",
      finProductVersion: 1,
      OperType: 1,
      metadataResponse: [],
    };
  },

  "POST /api/CreditOperations/GetFinancialProductTermRestriction": () => ({
    minValue: 12,
    maxValue: 120,
    defaultSymbolValue: 60,
    stepValue: 6,
  }),

  "POST /api/CreditOperations/SaveCredOper": (request) => save(operationIn(request)),

  // A new proposal from the quotation (its own number, quotationId pointing back), with a customer to fill in
  "POST /api/CreditOperations/QuotationToProposal": (request) => {
    const quotation = operationIn(request);
    const hasCustomer = quotation.interventions?.some((i) => (i.credOperIntervType ?? 1) === 1);
    return save({
      ...quotation,
      id: null,
      credOperNumber: null,
      beginDate: undefined,
      quotationId: quotation.id ?? null,
      credOperStep: 2,
      interventions: hasCustomer ? quotation.interventions : [customerTemplate(), ...(quotation.interventions ?? [])],
    });
  },

  "POST /api/CreditOperations/SearchOperations": () => [...[...saved.values()].reverse(), ...sampleSearch()],

  // --- Entity lookup by NIF (placeholder: entityLookup/entityLookupApi.ts) ------------------
  // Known NIFs: 123456789 (a person), 500000000 (a company); the code is always 123456
  "POST /api/entities/lookup-by-vat": async ({ body }) => {
    await delay(700);
    const entity = DEMO_ENTITIES[(body as { vat?: string })?.vat ?? ""];
    return entity ? { found: true, phone: entity.phone, email: entity.email } : { found: false };
  },

  "POST /api/entities/otp/send": async ({ body }) => {
    await delay(600);
    const vat = (body as { vat?: string })?.vat ?? "";
    if (!DEMO_ENTITIES[vat]) return { sent: false, message: "There are no contacts on file for this NIF." };
    const otpRequestId = `otp-${vat}-${Date.now()}`;
    otpRequests.set(otpRequestId, vat);
    return { sent: true, otpRequestId, validUntil: new Date(Date.now() + 5 * 60_000).toISOString() };
  },

  "POST /api/entities/otp/verify": async ({ body }) => {
    await delay(600);
    const { otpRequestId = "", code } = (body ?? {}) as { otpRequestId?: string; code?: string };
    const vat = otpRequests.get(otpRequestId);
    if (!vat || code !== DEMO_OTP_CODE) return { valid: false };
    otpRequests.delete(otpRequestId);
    return { valid: true, intervention: DEMO_ENTITIES[vat].data };
  },
});
