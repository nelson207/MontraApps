import type {
  CustomerCashFlowDto,
  CustomerContractCardDto,
  CustomerContractDto,
  CustomerContractsDto,
  CustomerDashboardDto,
  CustomerDocumentDetailDto,
  CustomerDocumentDto,
  CustomerDocumentsDto,
  CustomerInstallmentDto,
  CustomerPortalRole,
  InstallmentStatus,
} from "@platform/api/generated/MontraPOSApi";
import { DemoProblem, registerDemoHandlers, type DemoRequest } from "@platform/api/demoBackend";

// DEVELOPMENT ONLY, with "Demo access" and no API: a stand-in for /api/customer-portal, its figures
// built from today's date so they stay current. One contract per role, two in arrears, and one in
// dollars for the per-currency totals. The ids hold a "/" on purpose, like real tokens can.

const ME = "Ana Silva";
const FEE_NET = 2.5;
const VAT = 23;
const FEE_TAX = Math.round(FEE_NET * VAT) / 100;
const FEE = FEE_NET + FEE_TAX;

type Seed = {
  n: number;
  number: number;
  business: string;
  product: string;
  lender: string;
  role: CustomerPortalRole;
  customer: string;
  asset: string | null;
  plate: string | null;
  amount: number;
  rate: number;
  taeg: number;
  term: number;
  /** Months since the first payment (first due date = today − monthsAgo, on `day`) */
  monthsAgo: number;
  day: number;
  overdue: number;
  account: string;
  currency: string;
};

const SEEDS: Seed[] = [
  { n: 101, number: 100018734, business: "Auto credit", product: "Auto credit — new", lender: "Montra Finance", role: "Customer", customer: ME, asset: "Peugeot 208 1.2 PureTech Allure", plate: "AA-11-BB", amount: 18_000, rate: 6.9, taeg: 8.5, term: 72, monthsAgo: 22, day: 15, overdue: 0, account: "PT50 •••• 4321", currency: "EUR" },
  { n: 102, number: 100004512, business: "Personal loan", product: "Personal loan", lender: "Montra Finance", role: "Customer", customer: ME, asset: null, plate: null, amount: 7_000, rate: 9.9, taeg: 11.8, term: 48, monthsAgo: 18, day: 5, overdue: 1, account: "PT50 •••• 4321", currency: "EUR" },
  { n: 103, number: 100009981, business: "Financial leasing", product: "Leasing — vehicles", lender: "Banco Atlântico", role: "SecondHolder", customer: "João Silva", asset: "Renault Clio 1.0 TCe Evolution", plate: "BC-22-DE", amount: 24_000, rate: 5.9, taeg: 7.4, term: 60, monthsAgo: 39, day: 20, overdue: 0, account: "PT50 •••• 8810", currency: "EUR" },
  { n: 104, number: 100011207, business: "Personal loan", product: "Personal loan — green", lender: "Lusa Financeira", role: "Guarantor", customer: "Rui Costa", asset: null, plate: null, amount: 12_000, rate: 7.5, taeg: 9.1, term: 60, monthsAgo: 13, day: 10, overdue: 2, account: "PT50 •••• 0077", currency: "EUR" },
  { n: 105, number: 100015533, business: "Equipment credit", product: "Equipment — USD", lender: "Banco Atlântico", role: "Customer", customer: ME, asset: "Forklift Linde H25", plate: null, amount: 30_000, rate: 5.2, taeg: 6.3, term: 36, monthsAgo: 4, day: 25, overdue: 0, account: "PT50 •••• 4321", currency: "USD" },
];

const idOf = (seed: Seed) => `demo/contract+${seed.n}`;
const round2 = (value: number) => Math.round(value * 100) / 100;
const today = () => new Date().toISOString().slice(0, 10);

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

/** yyyy-mm-dd `months` later, on the same day (or the month's last day when shorter) */
function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const total = m - 1 + months;
  const year = y + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(Math.min(d, daysInMonth(year, month))).padStart(2, "0")}`;
}

const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

/** French amortization: paid until `overdue` installments before today, the last overdue one in collection */
function schedule(seed: Seed): Required<Pick<CustomerInstallmentDto, "number" | "dueDate" | "principal" | "interest" | "fees" | "payment" | "balance" | "status">>[] {
  const now = today();
  const first = addMonths(`${now.slice(0, 7)}-${String(seed.day).padStart(2, "0")}`, -seed.monthsAgo);
  const r = seed.rate / 100 / 12;
  const payment = (seed.amount * r) / (1 - (1 + r) ** -seed.term);
  const pastDue = Array.from({ length: seed.term }, (_, i) => addMonths(first, i)).filter((date) => date < now).length;
  const paidCount = Math.max(0, pastDue - seed.overdue);
  let balance = seed.amount;
  return Array.from({ length: seed.term }, (_, i) => {
    const interest = round2(balance * r);
    const principal = i === seed.term - 1 ? round2(balance) : round2(payment - interest);
    balance = round2(balance - principal);
    let status: InstallmentStatus;
    if (i < paidCount) status = "Paid";
    else if (i < pastDue) status = i === pastDue - 1 && seed.overdue > 1 ? "InCollection" : "Overdue";
    else if (i === pastDue) status = "Next";
    else status = i === pastDue + 1 ? "Scheduled" : "NotInvoiced";
    return { number: i + 1, dueDate: addMonths(first, i), principal, interest, fees: FEE, payment: round2(principal + interest + FEE), balance, status };
  });
}

function figures(seed: Seed) {
  const rows = schedule(seed);
  const paid = rows.filter((row) => row.status === "Paid");
  const overdue = rows.filter((row) => row.status === "Overdue" || row.status === "InCollection");
  const next = rows.find((row) => row.status === "Next");
  return { rows, paid, overdue, next, overdueAmount: round2(overdue.reduce((sum, row) => sum + row.payment, 0)), stillOwed: paid.at(-1)?.balance ?? seed.amount };
}

function card(seed: Seed): CustomerContractCardDto {
  const { paid, overdue, next, overdueAmount, stillOwed } = figures(seed);
  return {
    id: idOf(seed),
    number: seed.number,
    role: seed.role,
    businessName: seed.business,
    productName: seed.product,
    financialCompany: seed.lender,
    assetDescription: seed.asset,
    licencePlate: seed.plate,
    customerName: seed.customer,
    nextPayment: next ? { amount: next.payment, dueDate: `${next.dueDate}T00:00:00` } : undefined,
    stillOwed,
    overdueAmount,
    overdueInstallments: overdue.length,
    paidInstallments: paid.length,
    totalInstallments: seed.term,
    currencyId: seed.currency,
    isActive: true,
  };
}

const seedOf = (request: DemoRequest) => {
  const seed = SEEDS.find((s) => idOf(s) === request.params.id);
  if (!seed) throw new DemoProblem(404, "not_found", "Contract not found.");
  return seed;
};

const pageOf = <T>(items: T[], request: DemoRequest) => {
  const page = Number(request.params.page ?? 1);
  const pageSize = Number(request.params.pageSize ?? 20);
  return { items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, totalCount: items.length };
};

function documents(seed: Seed): CustomerDocumentDetailDto[] {
  const now = today();
  const docs: CustomerDocumentDetailDto[] = [];
  const common = { contractId: idOf(seed), contractNumber: seed.number, currencyId: seed.currency, paymentMethod: "Direct debit", maskedAccount: seed.account, asOf: now };
  for (const row of schedule(seed)) {
    // Each installment is invoiced 20 days before it is due
    const issueDate = addDays(row.dueDate, -20);
    if (issueDate > now) break;
    const net = round2(row.principal + row.interest + FEE_NET);
    const open = row.status === "Paid" ? "Paid" : row.status === "Overdue" ? "Overdue" : row.status === "InCollection" ? "InCollection" : "Open";
    docs.push({
      ...common,
      id: `demo/document+${seed.n * 1000 + row.number}`,
      typeCode: "FT",
      typeName: "Invoice",
      number: `FT ${seed.number}/${String(row.number).padStart(3, "0")}`,
      description: `Installment ${row.number} of ${seed.term}`,
      installmentNumber: row.number,
      issueDate,
      dueDate: row.dueDate,
      lines: [
        { description: "Principal", amount: row.principal, isExempt: true, taxRate: null },
        { description: "Interest", amount: row.interest, isExempt: true, taxRate: null },
        { description: "Processing fee", amount: FEE_NET, isExempt: false, taxRate: VAT },
      ],
      net,
      tax: FEE_TAX,
      total: round2(net + FEE_TAX),
      status: open,
      hasPdf: true,
    });
    // A late installment also gets a debit note for the late-payment interest (no PDF yet)
    if (row.status === "Overdue" || row.status === "InCollection") {
      const lateInterest = round2(row.payment * 0.04);
      docs.push({
        ...common,
        id: `demo/document+${seed.n * 1000 + 500 + row.number}`,
        typeCode: "ND",
        typeName: "Debit note",
        number: `ND ${seed.number}/${String(row.number).padStart(3, "0")}`,
        description: `Late payment interest · installment ${row.number}`,
        installmentNumber: row.number,
        issueDate: addDays(row.dueDate, 5) < now ? addDays(row.dueDate, 5) : now,
        dueDate: addDays(row.dueDate, 20),
        lines: [{ description: "Late payment interest", amount: lateInterest, isExempt: true, taxRate: null }],
        net: lateInterest,
        tax: 0,
        total: lateInterest,
        status: addDays(row.dueDate, 20) < now ? "Overdue" : "Open",
        hasPdf: false,
      });
    }
  }
  return docs.sort((a, b) => (b.issueDate ?? "").localeCompare(a.issueDate ?? ""));
}

const documentById = (id: string) => {
  const doc = SEEDS.flatMap(documents).find((d) => d.id === id);
  if (!doc) throw new DemoProblem(404, "not_found", "Document not found.");
  return doc;
};

function dashboard(): CustomerDashboardDto {
  const contracts = SEEDS.map((seed) => ({ seed, ...figures(seed) }));
  const first = `${today().slice(0, 7)}-01`;
  const held = contracts.filter((c) => c.seed.role !== "Guarantor");
  return {
    asOf: today(),
    totals: [...new Set(SEEDS.map((s) => s.currency))].map((currencyId) => {
      const mine = held.filter((c) => c.seed.currency === currencyId);
      const guaranteed = contracts.filter((c) => c.seed.currency === currencyId && c.seed.role === "Guarantor");
      const next = mine.filter((c) => c.next).sort((a, b) => a.next!.dueDate.localeCompare(b.next!.dueDate))[0];
      return {
        currencyId,
        nextPayment: next ? { contractId: idOf(next.seed), contractNumber: next.seed.number, amount: next.next!.payment, dueDate: `${next.next!.dueDate}T00:00:00` } : undefined,
        overdueAmount: round2(mine.reduce((sum, c) => sum + c.overdueAmount, 0)),
        overdueContracts: mine.filter((c) => c.overdueAmount > 0).length,
        stillOwed: round2(mine.reduce((sum, c) => sum + c.stillOwed, 0)),
        stillOwedContracts: mine.length,
        paidEachMonth: round2(mine.reduce((sum, c) => sum + c.rows[0].payment, 0)),
        guarantor: {
          stillOwed: round2(guaranteed.reduce((sum, c) => sum + c.stillOwed, 0)),
          overdueAmount: round2(guaranteed.reduce((sum, c) => sum + c.overdueAmount, 0)),
          contracts: guaranteed.length,
        },
      };
    }),
    overdueContracts: held
      .filter((c) => c.overdueAmount > 0)
      .map((c) => ({ contractId: idOf(c.seed), contractNumber: c.seed.number, amount: c.overdueAmount, currencyId: c.seed.currency })),
    monthlyPayments: [...new Set(SEEDS.map((s) => s.currency))].flatMap((currencyId) =>
      Array.from({ length: 12 }, (_, i) => {
        const month = addMonths(first, i).slice(0, 7);
        const amount = held
          .filter((c) => c.seed.currency === currencyId)
          .flatMap((c) => c.rows)
          .filter((row) => row.dueDate.startsWith(month) && row.status !== "Paid")
          .reduce((sum, row) => sum + row.payment, 0);
        return { month: `${month}-01T00:00:00`, currencyId, amount: round2(amount) };
      }),
    ),
    comingUp: contracts
      .filter((c) => c.next)
      .sort((a, b) => a.next!.dueDate.localeCompare(b.next!.dueDate))
      .map((c) => ({
        contractId: idOf(c.seed),
        contractNumber: c.seed.number,
        businessName: c.seed.business,
        role: c.seed.role,
        amount: c.next!.payment,
        currencyId: c.seed.currency,
        dueDate: `${c.next!.dueDate}T00:00:00`,
      })),
    stillOwedByContract: held.map((c) => ({
      contractId: idOf(c.seed),
      contractNumber: c.seed.number,
      businessName: c.seed.business,
      amount: c.stillOwed,
      currencyId: c.seed.currency,
    })),
    repaid: contracts.map((c) => ({
      contractId: idOf(c.seed),
      contractNumber: c.seed.number,
      role: c.seed.role,
      paidInstallments: c.paid.length,
      totalInstallments: c.seed.term,
      hasOverdue: c.overdueAmount > 0,
      endDate: `${c.rows.at(-1)!.dueDate}T00:00:00`,
      stillOwed: c.stillOwed,
      currencyId: c.seed.currency,
    })),
  };
}

function contractDetail(seed: Seed): CustomerContractDto {
  const { rows } = figures(seed);
  return {
    ...card(seed),
    financedAmount: seed.amount,
    monthlyPayment: rows[0].payment,
    termMonths: seed.term,
    nominalRate: seed.rate,
    effectiveRate: seed.taeg,
    startDate: `${addMonths(rows[0].dueDate, -1)}T00:00:00`,
    endDate: `${rows.at(-1)!.dueDate}T00:00:00`,
    paymentMethod: "Direct debit",
    maskedAccount: seed.account,
    people: seed.role === "Customer" ? [{ name: ME, role: "Customer" }] : [{ name: seed.customer, role: "Customer" }, { name: ME, role: seed.role }],
    asOf: today(),
  };
}

function cashFlow(seed: Seed, request: DemoRequest): CustomerCashFlowDto {
  const { rows, paid, overdue, next, overdueAmount, stillOwed } = figures(seed);
  const statuses = request.params.status?.split(",");
  const unpaid = rows.filter((row) => row.status !== "Paid");
  const { items, page, pageSize, totalCount } = pageOf(rows.filter((row) => !statuses || statuses.includes(row.status)), request);
  return {
    asOf: today(),
    currencyId: seed.currency,
    nextPayment: next ? { amount: next.payment, dueDate: `${next.dueDate}T00:00:00` } : undefined,
    overdueAmount,
    paidAmount: round2(paid.reduce((sum, row) => sum + row.payment, 0)),
    paidInstallments: paid.length,
    overdueInstallments: overdue.length,
    totalInstallments: seed.term,
    stillToPay: round2(unpaid.reduce((sum, row) => sum + row.payment, 0)),
    unpaidInstallments: unpaid.length,
    stillOwed,
    installments: items,
    nextPosition: next ? rows.indexOf(next) + 1 : null,
    page,
    pageSize,
    totalCount,
  };
}

// The smallest document a PDF viewer opens
const DEMO_PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT /F1 18 Tf 50 780 Td (Demo document) Tj ET
endstream endobj
trailer<</Root 1 0 R>>
%%EOF
`;

registerDemoHandlers({
  "GET /api/customer-portal/dashboard": dashboard,
  "GET /api/customer-portal/contracts": (request): CustomerContractsDto => ({
    items: SEEDS.filter((seed) => !request.params.role || seed.role === request.params.role).map(card),
    counts: (["Customer", "SecondHolder", "Guarantor"] as const).map((role) => ({ role, count: SEEDS.filter((seed) => seed.role === role).length })),
    asOf: today(),
  }),
  "GET /api/customer-portal/contracts/:id": (request) => contractDetail(seedOf(request)),
  "GET /api/customer-portal/contracts/:id/cash-flow": (request) => cashFlow(seedOf(request), request),
  "GET /api/customer-portal/contracts/:id/documents": (request): CustomerDocumentsDto => ({
    ...pageOf<CustomerDocumentDto>(documents(seedOf(request)), request),
    asOf: today(),
  }),
  "GET /api/customer-portal/documents/:id": (request) => documentById(request.params.id),
  "GET /api/customer-portal/documents/:id/pdf": (request) => {
    documentById(request.params.id);
    return new Blob([DEMO_PDF], { type: "application/pdf" });
  },
});
