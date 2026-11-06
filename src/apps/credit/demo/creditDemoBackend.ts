import type {
  CredOperAssetDto as ApiAssetDto,
  CredOperDto as ApiCredOperDto,
  CreditOperationStep,
  EntityPreloadDto,
  OtpChannel,
  RetakeCalculation,
} from "@platform/api/generated/MontraPOSApi";
import type { CredOperDto, CredOperIntervDto } from "@platform/api/legacy/legacyApi";
import { fromApiCredOper, stepName, stepNumber, toApiCredOper } from "../features/credoper/api/credOperMapping";
import { BUSINESSES } from "../features/credoper/model/business";
import type { SaveIdentity } from "../features/credoper/model/credOperDraft";
import { DemoProblem, registerDemoHandlers, type DemoRequest } from "@platform/api/demoBackend";
import { demoCalculate } from "./demoCalculation";
import { delay } from "@platform/api/devFallback";
import { newId } from "@platform/utils/newId";

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
  { id: 1, abbreviation: "Private", description: "Private customer", isValid: true, entitySuperType: "Person" },
  { id: 2, abbreviation: "Self-employed", description: "Self-employed customer", isValid: true, entitySuperType: "Person" },
  { id: 3, abbreviation: "Company", description: "Company", isValid: true, entitySuperType: "Company" },
  { id: 4, abbreviation: "Public body", description: "Neither a person nor a company", isValid: true, entitySuperType: null },
];

/** What a classification's customer must be; a classification that can't have one is refused */
function customerKindOf(classificationId: string | undefined) {
  const kind = CLASSIFICATIONS.find((c) => String(c.id) === classificationId)?.entitySuperType;
  if (!kind) throw new DemoProblem(400, "validation_failed", "This classification can't be used to create a customer.");
  return kind;
}

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

type DemoOperation = CredOperDto & SaveIdentity & { sourceCredOperId?: string | null };

// Saved operations of this session, for the search; new ones also by their correlationId
const saved = new Map<string, DemoOperation>();
const savedByCorrelation = new Map<string, string>();
const findSaved = (id: string | null | undefined): DemoOperation | undefined =>
  id ? (saved.get(id) ?? sampleSearch().find((op) => op.id === id)) : undefined;

/** The operation type of the demo's operations (the backend sets it; the app never does) */
const DEMO_OPERATION_TYPE = 299;

/**
 * A proposal made from a quotation keeps the quotation's company, business and operation type,
 * and its quotation must be one the user can see: as the API, refused (400) before anything else
 */
function checkQuotationLock(op: DemoOperation) {
  if (!op.sourceCredOperId) return;
  const quotation = findSaved(op.sourceCredOperId);
  const refuse = (detail: string) => {
    throw new DemoProblem(400, "validation_failed", detail);
  };
  if (!quotation) refuse("The quotation of this proposal can't be found.");
  if (
    (op.aplCompanyId ?? null) !== (quotation!.aplCompanyId ?? null) ||
    (op.aplBusinessId ?? null) !== (quotation!.aplBusinessId ?? null) ||
    (op.credOperTypeId ?? DEMO_OPERATION_TYPE) !== (quotation!.credOperTypeId ?? DEMO_OPERATION_TYPE)
  ) {
    refuse("The proposal must keep its quotation's company, business and operation type.");
  }
}
let lastNumber = 0;
let lastItem = 0;

const body = (request: DemoRequest) => (request.body ?? {}) as Record<string, unknown>;
const operationIn = (request: DemoRequest) => (body(request).credOperDto ?? body(request)) as CredOperDto;

/** A new version of an operation (its concurrency token), base64 like the API's */
const newRowVersion = () => btoa(`demo-${Date.now()}-${Math.random()}`);

/** Items saved for the first time get their id */
const withIds = <T extends { id?: string | null }>(items: T[] | null | undefined, kind: string) =>
  items?.map((item) => (item.id ? item : { ...item, id: `demo-${kind}-${++lastItem}` }));

function save(op: DemoOperation): DemoOperation {
  // Ids are opaque strings, like the API's; the operation number is the readable one
  const number = op.credOperNumber ?? 2026_000 + ++lastNumber;
  const id = op.id ?? `demo-op-${number}`;
  const result: DemoOperation = {
    ...op,
    id,
    credOperNumber: number,
    beginDate: op.beginDate ?? new Date().toISOString(),
    rowVersion: newRowVersion(),
    conditions: withIds(op.conditions, "condition"),
    assets: withIds(op.assets, "asset"),
    interventions: withIds(op.interventions, "intervention"),
  };
  saved.set(id, result);
  return result;
}

/** An operation as the API answers it: with what only the API sets (state, its dates, version) */
const apiOut = (op: DemoOperation): ApiCredOperDto => ({
  ...toApiCredOper(op),
  autUserStateId: op.autUserStateId,
  stateDate: op.stateDate,
  entryMoment: op.entryMoment,
  rowVersion: op.rowVersion,
});

const round2 = (value: number) => Math.round(value * 100) / 100;

const SAMPLE_CUSTOMERS = ["Ana Silva", "Rui Costa", "Marta Ferreira", "Construtora Norte, Lda.", "Pedro Santos", "Joana Lopes"];

const sampleSearch = (): DemoOperation[] =>
  SAMPLE_CUSTOMERS.map((customerName, i) => ({
    id: `demo-op-search-${i}`,
    correlationId: `00000000-0000-4000-8000-00000000000${i}`,
    rowVersion: btoa(`demo-sample-${i}`),
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
/** NIFs a code was sent for, and until when it's accepted */
const otpSentFor = new Map<string, number>();
const kindOfDemoEntity = (vatNumber: string) => (DEMO_ENTITIES[vatNumber].data.company ? "Company" : "Person");

/** A paged list's answer: searched by its names, one page */
const demoPage = <T extends { abbreviation?: string | null; description?: string | null }>(all: T[], params: Record<string, string>) => {
  const search = params.search?.toLowerCase() ?? "";
  const items = all.filter((item) => `${item.abbreviation} ${item.description}`.toLowerCase().includes(search));
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 50;
  return { items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, totalCount: items.length };
};

const DEMO_ENTITIES: Record<string, { phone: string | null; email: string; data: EntityPreloadDto }> = {
  "123456789": {
    phone: "+351 9•• ••• 321",
    email: "an•••@example.com",
    data: {
      id: "demo-entity-1",
      entityTypeId: 1,
      name: "Ana Maria Silva",
      person: { firstName: "Ana Maria", lastName: "Silva", birthDate: "1988-04-12" },
      emails: [{ id: "demo-entity-1-email", emailAddress: "ana.silva@example.com", isMain: true }],
      phones: [
        { id: "demo-entity-1-phone", phoneNumber: "912345321", countryId: "PRT", phoneTypeId: 2, isMain: true },
        { id: "demo-entity-1-landline", phoneNumber: "213000111", countryId: "PRT", phoneTypeId: 1 },
      ],
      addresses: [
        {
          id: "demo-entity-1-address",
          singleLine: "Rua Augusta 100, 1100-053 Lisboa",
          details: { street: "Rua Augusta 100", postalCode: "1100-053", locality: "Lisboa", countryId: "PRT", isFiscal: true },
        },
        {
          id: "demo-entity-1-address-2",
          singleLine: "Av. da Boavista 1500, 4100-114 Porto",
          details: { street: "Av. da Boavista 1500", postalCode: "4100-114", locality: "Porto", countryId: "PRT" },
        },
      ],
    },
  },
  "500000000": {
    phone: null,
    email: "fi•••@acme.pt",
    data: {
      id: "demo-entity-2",
      entityTypeId: 2,
      name: "Acme Transportes, Lda.",
      company: { registryNumber: "500000000" },
      emails: [{ id: "demo-entity-2-email", emailAddress: "financeiro@acme.pt", isMain: true }],
      phones: [{ id: "demo-entity-2-phone", phoneNumber: "210000100", countryId: "PRT", phoneTypeId: 1, isMain: true }],
      addresses: [
        {
          id: "demo-entity-2-address",
          singleLine: "Avenida da Liberdade 200, 1250-147 Lisboa",
          details: { street: "Avenida da Liberdade 200", postalCode: "1250-147", locality: "Lisboa", countryId: "PRT", isFiscal: true },
        },
      ],
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
    // The operation's identity for saving it (once): kept by the app as it is
    correlationId: newId(),
  }),

  "GET /api/credit-operations/new-intervention": (request) => {
    const { kind, credOperClassificationId } = request.params;
    const company = kind === "Customer" && customerKindOf(credOperClassificationId) === "Company";
    const entity = company ? { entityTypeId: 2 } : {};
    return toApiCredOper({ interventions: [{ ...customerTemplate(), entity, credOperIntervType: INTERVENTION_TYPES[kind] ?? 1 }] })
      .interventions?.[0];
  },

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
      })),
    ),

  // As Settings → Application would have them: Financial leasing asks (equipment or a building),
  // a business without vehicles has no asset, the others finance equipment
  "GET /api/credit-operations/asset-types": ({ params }) => {
    const business = BUSINESSES.find((b) => b.id === Number(params.businessId));
    if (!business) return [];
    return business.id === 1 ? [ASSET_TYPES[1], ASSET_TYPES[2]] : business.equipment === "none" ? [ASSET_TYPES[0]] : [ASSET_TYPES[1]];
  },

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

  // A saved operation (or a sample from Search), to edit
  "GET /api/credit-operations/credoper/:id": ({ params }) => {
    const found = findSaved(params.id);
    if (!found) throw new DemoProblem(404, "not_found", "The operation couldn't be found.");
    return apiOut(found);
  },

  // Calculated again and saved: its number, and the first state for a new one. As the API: no
  // correlationId (or no rowVersion for a saved one) is refused; a new operation saved again with
  // its correlationId is the one already saved; a rowVersion other than the stored one is a conflict
  "POST /api/credit-operations/save-credoper": (request) => {
    const incoming = apiOperationIn(request) as DemoOperation;
    const answer = (op: DemoOperation) => ({ isSaved: true, id: op.id, credOper: apiOut(op), calculationMessages: [], saveMessages: [] });
    if (!incoming.correlationId) throw new DemoProblem(400, "validation_failed", "The correlationId is required.");
    checkQuotationLock(incoming);
    if (!incoming.id) {
      const already = savedByCorrelation.get(incoming.correlationId);
      if (already && saved.has(already)) return answer(saved.get(already)!);
    } else {
      if (!incoming.rowVersion) throw new DemoProblem(400, "validation_failed", "The rowVersion is required.");
      const stored = saved.get(incoming.id) ?? sampleSearch().find((op) => op.id === incoming.id);
      if (stored && stored.rowVersion !== incoming.rowVersion) {
        throw new DemoProblem(409, "concurrency_conflict", "The operation was changed by someone else.");
      }
    }
    const stored = incoming.id ? (saved.get(incoming.id) ?? sampleSearch().find((op) => op.id === incoming.id)) : undefined;
    const now = new Date().toISOString();
    const op = save({
      ...demoCalculate(incoming),
      // Set by the API only, when a new operation is first saved
      autUserStateId: stored ? stored.autUserStateId : 1,
      stateDate: stored ? stored.stateDate : now,
      entryMoment: stored ? stored.entryMoment : now,
    });
    if (!incoming.id) savedByCorrelation.set(incoming.correlationId, op.id!);
    return answer(op);
  },

  // The initial entry from its percentage ("Amount") or its amount ("Percentage"); the base
  // amount is the purchase amount + options − the initial entry
  "POST /api/equipments/retake": ({ body }) => {
    const { calculate, asset = {} } = (body ?? {}) as { calculate?: RetakeCalculation; asset?: ApiAssetDto };
    const equipment = asset.equipment ?? {};
    const purchase = (equipment.purchaseAmount ?? equipment.netAmount ?? 0) + (equipment.optionsAmount ?? 0);
    let { retakeAmount, retakePercentage } = equipment;
    if (calculate === "Amount") retakeAmount = retakePercentage == null ? null : round2((purchase * retakePercentage) / 100);
    else retakePercentage = retakeAmount == null || purchase <= 0 ? null : round2((retakeAmount / purchase) * 100);
    return {
      ...asset,
      baseAmount: round2(purchase - (retakeAmount ?? 0)),
      equipment: { ...equipment, retakeAmount, retakePercentage },
    } satisfies ApiAssetDto;
  },

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

  // A new proposal from a saved quotation, NOT saved: no id, its own correlationId, the quotation's
  // values and sourceCredOperId pointing back; with the quotation's summary
  "GET /api/credit-operations/credoper/:id/quotation-to-proposal": ({ params }) => {
    const quotation = findSaved(params.id);
    if (!quotation) throw new DemoProblem(404, "not_found", "The quotation couldn't be found.");
    if ((quotation.credOperStep ?? 1) !== 1) throw new DemoProblem(400, "validation_failed", "Only a quotation becomes a proposal.");
    const hasCustomer = quotation.interventions?.some((i) => (i.credOperIntervType ?? 1) === 1);
    const blank = <T extends { id?: string | null }>(items: T[] | null | undefined) => items?.map((item) => ({ ...item, id: null }));
    const proposal: DemoOperation = {
      ...quotation,
      id: null,
      credOperNumber: null,
      rowVersion: null,
      autUserStateId: undefined,
      stateDate: undefined,
      entryMoment: undefined,
      sourceCredOperId: quotation.id ?? null,
      credOperStep: 2,
      credOperTypeId: quotation.credOperTypeId ?? DEMO_OPERATION_TYPE,
      correlationId: newId(),
      conditions: blank(quotation.conditions),
      assets: blank(quotation.assets),
      interventions: blank(hasCustomer ? quotation.interventions : [customerTemplate(), ...(quotation.interventions ?? [])]),
    };
    return {
      proposal: apiOut(proposal),
      quotation: {
        id: quotation.id ?? undefined,
        number: quotation.credOperNumber,
        aplCompanyId: quotation.aplCompanyId ?? null,
        aplBusinessId: quotation.aplBusinessId ?? null,
        credOperTypeId: quotation.credOperTypeId ?? DEMO_OPERATION_TYPE,
        financialProductId: quotation.financialProduct ?? null,
        amount: quotation.amount ?? null,
        currencyId: quotation.currencyId ?? "EUR",
        beginDate: quotation.beginDate ?? null,
        stateId: quotation.autUserStateId ?? null,
        stateDate: quotation.stateDate ?? null,
        customerEntityId: null,
        customerName: quotation.customerName ?? null,
      },
    };
  },

  "POST /api/CreditOperations/SearchOperations": () => [...[...saved.values()].reverse(), ...sampleSearch()],

  // --- The lists of a person's form (/api/entities/…) ---------------------------------------
  "GET /api/entities/phone-types": () => [
    { kind: "Mobile", phoneTypeId: 2 },
    { kind: "Landline", phoneTypeId: 1 },
  ],
  "GET /api/entities/juridical-types": ({ params }) =>
    demoPage(
      params.kind === "Company"
        ? [
            { id: 21, abbreviation: "Lda", description: "Sociedade por quotas", hasActivity: true, activityTypeContextId: 1 },
            { id: 22, abbreviation: "SA", description: "Sociedade anónima", hasActivity: true, activityTypeContextId: 1 },
            { id: 23, abbreviation: "Assoc", description: "Associação", hasActivity: false },
          ]
        : [
            { id: 11, abbreviation: "PS", description: "Pessoa singular", hasActivity: false },
            { id: 12, abbreviation: "ENI", description: "Empresário em nome individual", hasActivity: true, activityTypeContextId: 1 },
          ],
      params,
    ),
  "GET /api/entities/activity-types": ({ params }) =>
    demoPage(
      [
        { id: 45110, abbreviation: "45110", description: "Comércio de veículos automóveis ligeiros", contextId: 1 },
        { id: 47110, abbreviation: "47110", description: "Comércio a retalho em supermercados", contextId: 1 },
        { id: 62010, abbreviation: "62010", description: "Programação informática", contextId: 1 },
      ],
      params,
    ),
  "GET /api/entities/genders": ({ params }) => demoPage([{ id: 1, abbreviation: "F", description: "Female" }, { id: 2, abbreviation: "M", description: "Male" }], params),
  "GET /api/entities/marital-statuses": ({ params }) => demoPage([{ id: 1, abbreviation: "Single", description: null }, { id: 2, abbreviation: "Married", description: null }], params),
  "GET /api/entities/professions": ({ params }) => demoPage([{ id: 1, abbreviation: "Engineer", description: null }, { id: 2, abbreviation: "Teacher", description: null }], params),
  "GET /api/entities/legal-doc-types": ({ params }) => demoPage([{ id: 1, abbreviation: "CC", description: "Citizen card" }, { id: 2, abbreviation: "PP", description: "Passport" }], params),

  // --- Entity lookup by NIF (/api/entities/…) -----------------------------------------------
  // Known NIFs: 123456789 (a person: by code, always 123456), 500000000 (a company: no code)
  "POST /api/entities/lookup": async ({ body }) => {
    await delay(700);
    const { vatNumber = "", kind: asked } = (body ?? {}) as { vatNumber?: string; kind?: string };
    const entity = DEMO_ENTITIES[vatNumber];
    if (!entity) return { exists: false };
    const kind = kindOfDemoEntity(vatNumber);
    if (kind !== asked) return { exists: true, kind, kindMatches: false, preload: null };
    return {
      exists: true,
      kind,
      kindMatches: true,
      mobilePhone: entity.phone,
      email: entity.email,
      preload: kind === "Company" ? entity.data : null,
    };
  },

  "POST /api/entities/otp": async ({ body }) => {
    await delay(600);
    const { vatNumber = "", channel, kind } = (body ?? {}) as { vatNumber?: string; channel?: OtpChannel; kind?: string };
    if (DEMO_ENTITIES[vatNumber] && kindOfDemoEntity(vatNumber) !== kind) {
      throw new DemoProblem(400, "entity_kind_mismatch", "The entity is of another kind.");
    }
    const entity = DEMO_ENTITIES[vatNumber];
    const sentTo = channel === "Sms" ? entity?.phone : entity?.email;
    if (!sentTo) throw new DemoProblem(400, "validation_failed", "There's no contact on file to send the code to.");
    const expiresAt = Date.now() + 5 * 60_000;
    otpSentFor.set(vatNumber, expiresAt);
    return { expiresAt: new Date(expiresAt).toISOString(), sentTo };
  },

  "POST /api/entities/otp/verify": async ({ body }) => {
    await delay(600);
    const { vatNumber = "", code, kind } = (body ?? {}) as { vatNumber?: string; code?: string; kind?: string };
    if (DEMO_ENTITIES[vatNumber] && kindOfDemoEntity(vatNumber) !== kind) {
      throw new DemoProblem(400, "entity_kind_mismatch", "The entity is of another kind.");
    }
    const expiresAt = otpSentFor.get(vatNumber);
    if (!expiresAt || expiresAt < Date.now() || code !== DEMO_OTP_CODE) {
      throw new DemoProblem(400, "invalid_otp_code", "The code doesn't match or has expired.");
    }
    otpSentFor.delete(vatNumber);
    return DEMO_ENTITIES[vatNumber].data;
  },
});
