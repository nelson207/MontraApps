import type {
  CustomerCashFlowDto,
  CustomerContractCardDto,
  CustomerContractDto,
  CustomerContractPaymentDto,
  CustomerDashboardDto,
  CustomerDocumentDetailDto,
  CustomerDocumentDto,
  CustomerDocumentStatus,
  CustomerInstallmentDto,
  CustomerPortalRole,
  InstallmentStatus,
} from "@platform/api/generated/MontraPOSApi";

// A customer's view of their credit contracts, as MontraAPI's /api/customer-portal gives them. The
// figures are the API's: nothing is calculated here, the DTOs only get their defaults and day-only
// dates. Ids are opaque tokens.

export type ContractRole = "customer" | "secondHolder" | "guarantor";

export const ROLE_LABELS: Record<ContractRole, string> = {
  customer: "Customer",
  secondHolder: "Second holder",
  guarantor: "Guarantor",
};

const ROLES: Record<CustomerPortalRole, ContractRole> = {
  Customer: "customer",
  SecondHolder: "secondHolder",
  Guarantor: "guarantor",
};

const roleOf = (role: CustomerPortalRole | undefined): ContractRole => ROLES[role ?? "Customer"];

/** yyyy-mm-dd: the API's date-times are calendar days */
const dayOf = (iso: string) => iso.slice(0, 10);
const optionalDay = (iso: string | null | undefined) => (iso ? dayOf(iso) : null);

export type Payment = { amount: number; dueDate: string };

/** .NET's empty date (0001-01-01) means no payment, like a missing one */
function paymentOf(payment: Pick<CustomerContractPaymentDto, "amount" | "dueDate"> | null | undefined): Payment | null {
  if (!payment?.dueDate || payment.dueDate.startsWith("0001")) return null;
  return { amount: payment.amount ?? 0, dueDate: dayOf(payment.dueDate) };
}

/** The parts that exist, joined with " · " */
export const joined = (...parts: (string | number | null | undefined)[]) => parts.filter((part) => part || part === 0).join(" · ");

export type ContractCard = {
  id: string;
  number: number;
  /** The signed-in customer's part in it */
  role: ContractRole;
  business: string | null;
  product: string | null;
  /** The financial company */
  lender: string | null;
  /** The financed vehicle or equipment, if any */
  asset: string | null;
  /** The contract's customer (the first holder) */
  customerName: string | null;
  next: Payment | null;
  /** Principal still owed */
  stillOwed: number;
  overdueAmount: number;
  overdueInstallments: number;
  paidInstallments: number;
  totalInstallments: number;
  currency: string | null;
};

export function contractCardOf(dto: CustomerContractCardDto): ContractCard {
  return {
    id: dto.id ?? "",
    number: dto.number ?? 0,
    role: roleOf(dto.role),
    business: dto.businessName ?? null,
    product: dto.productName ?? null,
    lender: dto.financialCompany ?? null,
    asset: joined(dto.assetDescription, dto.licencePlate) || null,
    customerName: dto.customerName ?? null,
    next: paymentOf(dto.nextPayment),
    stillOwed: dto.stillOwed ?? 0,
    overdueAmount: dto.overdueAmount ?? 0,
    overdueInstallments: dto.overdueInstallments ?? 0,
    paidInstallments: dto.paidInstallments ?? 0,
    totalInstallments: dto.totalInstallments ?? 0,
    currency: dto.currencyId ?? null,
  };
}

export type Contract = ContractCard & {
  financedAmount: number | null;
  /** Current monthly payment */
  monthlyPayment: number | null;
  /** Months */
  term: number | null;
  /** Nominal annual rate, % */
  tan: number | null;
  /** Annual percentage rate of charge, % */
  taeg: number | null;
  startDate: string | null;
  endDate: string | null;
  /** e.g. "Direct debit · PT50 •••• 4321" */
  paymentMethod: string | null;
  /** Everyone on the contract */
  people: { name: string; role: ContractRole }[];
};

export function contractOf(dto: CustomerContractDto): Contract {
  return {
    ...contractCardOf(dto),
    financedAmount: dto.financedAmount ?? null,
    monthlyPayment: dto.monthlyPayment ?? null,
    term: dto.termMonths ?? null,
    tan: dto.nominalRate ?? null,
    taeg: dto.effectiveRate ?? null,
    startDate: optionalDay(dto.startDate),
    endDate: optionalDay(dto.endDate),
    paymentMethod: joined(dto.paymentMethod, dto.maskedAccount) || null,
    people: (dto.people ?? []).map((person) => ({ name: person.name ?? "", role: roleOf(person.role) })),
  };
}

/** Whole % of the installments paid */
export const repaidShare = (paid: number, total: number) => (total > 0 ? Math.round((paid / total) * 100) : 0);

export type PaymentStatus = "paid" | "overdue" | "inCollection" | "notInvoiced" | "due" | "scheduled";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Paid",
  overdue: "Overdue",
  inCollection: "In collection",
  notInvoiced: "Not invoiced",
  due: "Next",
  scheduled: "Scheduled",
};

const PAYMENT_STATUSES: Record<InstallmentStatus, PaymentStatus> = {
  Paid: "paid",
  Overdue: "overdue",
  InCollection: "inCollection",
  NotInvoiced: "notInvoiced",
  Next: "due",
  Scheduled: "scheduled",
};

/** One installment of the payment schedule */
export type CashflowRow = {
  number: number;
  dueDate: string;
  principal: number;
  interest: number;
  fees: number;
  total: number;
  /** Principal owed after this payment */
  balance: number;
  status: PaymentStatus;
  /** The residual value: the API numbers it on its own (1), apart from the rents */
  isResidualValue: boolean;
};

const cashflowRowOf = (dto: CustomerInstallmentDto): CashflowRow => ({
  number: dto.number ?? 0,
  dueDate: dayOf(dto.dueDate ?? ""),
  principal: dto.principal ?? 0,
  interest: dto.interest ?? 0,
  fees: dto.fees ?? 0,
  total: dto.payment ?? 0,
  balance: dto.balance ?? 0,
  status: PAYMENT_STATUSES[dto.status ?? "Scheduled"],
  isResidualValue: dto.flowClass === "ResidualValue",
});

type Tally = { count: number; amount: number };

export type Cashflow = {
  currency: string | null;
  next: Payment | null;
  paid: Tally;
  overdue: Tally;
  /** Everything not paid yet (overdue included) */
  remaining: Tally;
  /** Installments of the whole contract */
  totalInstallments: number;
  /** One page of the installments that match the filter */
  rows: CashflowRow[];
  /** How many match the filter, over all pages */
  totalCount: number;
  /** Where the next payment is in the unfiltered schedule, from 1 */
  nextPosition: number | null;
};

export function cashflowOf(dto: CustomerCashFlowDto): Cashflow {
  return {
    currency: dto.currencyId ?? null,
    next: paymentOf(dto.nextPayment),
    paid: { count: dto.paidInstallments ?? 0, amount: dto.paidAmount ?? 0 },
    overdue: { count: dto.overdueInstallments ?? 0, amount: dto.overdueAmount ?? 0 },
    remaining: { count: dto.unpaidInstallments ?? 0, amount: dto.stillToPay ?? 0 },
    totalInstallments: dto.totalInstallments ?? 0,
    rows: (dto.installments ?? []).map(cashflowRowOf),
    totalCount: dto.totalCount ?? 0,
    nextPosition: dto.nextPosition ?? null,
  };
}

export type CashflowFilter = "all" | "upcoming" | "paid" | "overdue";

/** The statuses to ask the API for; none = all of them */
export const CASHFLOW_FILTER_STATUSES: Record<CashflowFilter, InstallmentStatus[] | undefined> = {
  all: undefined,
  upcoming: ["Overdue", "InCollection", "NotInvoiced", "Next", "Scheduled"],
  paid: ["Paid"],
  overdue: ["Overdue"],
};

/** The page holding the next payment (the first page without one) */
export const openingPage = (nextPosition: number | null, pageSize: number) =>
  nextPosition && nextPosition > 0 ? Math.floor((nextPosition - 1) / pageSize) + 1 : 1;

export type DocumentStatus = "paid" | "open" | "overdue" | "inCollection";

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  paid: "Paid",
  open: "Open",
  overdue: "Overdue",
  inCollection: "In collection",
};

const DOCUMENT_STATUSES: Record<CustomerDocumentStatus, DocumentStatus> = {
  Paid: "paid",
  Open: "open",
  Overdue: "overdue",
  InCollection: "inCollection",
};

/** An invoiced document of a contract (installment invoice, late-payment debit note, credit note) */
export type InvoiceDocument = {
  id: string;
  number: string;
  /** The API's name for its type, e.g. "Invoice" */
  typeName: string | null;
  description: string | null;
  issueDate: string | null;
  dueDate: string | null;
  total: number;
  currency: string | null;
  status: DocumentStatus;
  hasPdf: boolean;
};

export function documentOf(dto: CustomerDocumentDto): InvoiceDocument {
  return {
    id: dto.id ?? "",
    number: dto.number ?? "",
    typeName: dto.typeName ?? null,
    description: dto.description ?? null,
    issueDate: optionalDay(dto.issueDate),
    dueDate: optionalDay(dto.dueDate),
    total: dto.total ?? 0,
    currency: dto.currencyId ?? null,
    status: DOCUMENT_STATUSES[dto.status ?? "Open"],
    hasPdf: dto.hasPdf ?? false,
  };
}

export type InvoiceLine = { description: string; amount: number; taxRate: number | null; isExempt: boolean };

export type InvoiceDocumentDetail = InvoiceDocument & {
  contractNumber: number | null;
  lines: InvoiceLine[];
  net: number;
  tax: number;
  paymentMethod: string | null;
};

export function documentDetailOf(dto: CustomerDocumentDetailDto): InvoiceDocumentDetail {
  return {
    ...documentOf(dto),
    contractNumber: dto.contractNumber ?? null,
    lines: (dto.lines ?? []).map((line) => ({
      description: line.description ?? "",
      amount: line.amount ?? 0,
      taxRate: line.taxRate ?? null,
      isExempt: line.isExempt ?? false,
    })),
    net: dto.net ?? 0,
    tax: dto.tax ?? 0,
    paymentMethod: joined(dto.paymentMethod, dto.maskedAccount) || null,
  };
}

/** What a customer pays in one currency: amounts in different currencies are never added up */
export type CurrencyOverview = {
  currency: string | null;
  next: (Payment & { contractId: string; contractNumber: number }) | null;
  overdue: { amount: number; contracts: { id: string; number: number }[] };
  stillOwed: { amount: number; contracts: number };
  paidEachMonth: number;
  guarantor: { stillOwed: number; overdueAmount: number; contracts: number };
  /** Month by month (yyyy-mm) */
  monthlyPayments: { month: string; amount: number }[];
  owedByContract: { id: string; number: number; business: string | null; amount: number }[];
};

export type Dashboard = {
  overviews: CurrencyOverview[];
  comingUp: (Payment & { contractId: string; contractNumber: number; business: string | null; role: ContractRole; currency: string | null })[];
  repaid: {
    contractId: string;
    contractNumber: number;
    role: ContractRole;
    paidInstallments: number;
    totalInstallments: number;
    hasOverdue: boolean;
    endDate: string | null;
    stillOwed: number;
    currency: string | null;
  }[];
};

export function dashboardOf(dto: CustomerDashboardDto): Dashboard {
  const sameCurrency = (currency: string | null) => (row: { currencyId?: string | null }) => (row.currencyId ?? null) === currency;
  return {
    overviews: (dto.totals ?? []).map((totals) => {
      const currency = totals.currencyId ?? null;
      const next = paymentOf(totals.nextPayment);
      return {
        currency,
        next: next && { ...next, contractId: totals.nextPayment?.contractId ?? "", contractNumber: totals.nextPayment?.contractNumber ?? 0 },
        overdue: {
          amount: totals.overdueAmount ?? 0,
          contracts: (dto.overdueContracts ?? [])
            .filter(sameCurrency(currency))
            .map((contract) => ({ id: contract.contractId ?? "", number: contract.contractNumber ?? 0 })),
        },
        stillOwed: { amount: totals.stillOwed ?? 0, contracts: totals.stillOwedContracts ?? 0 },
        paidEachMonth: totals.paidEachMonth ?? 0,
        guarantor: {
          stillOwed: totals.guarantor?.stillOwed ?? 0,
          overdueAmount: totals.guarantor?.overdueAmount ?? 0,
          contracts: totals.guarantor?.contracts ?? 0,
        },
        monthlyPayments: (dto.monthlyPayments ?? [])
          .filter(sameCurrency(currency))
          .map((month) => ({ month: (month.month ?? "").slice(0, 7), amount: month.amount ?? 0 })),
        owedByContract: (dto.stillOwedByContract ?? []).filter(sameCurrency(currency)).map((contract) => ({
          id: contract.contractId ?? "",
          number: contract.contractNumber ?? 0,
          business: contract.businessName ?? null,
          amount: contract.amount ?? 0,
        })),
      };
    }),
    comingUp: (dto.comingUp ?? []).map((row) => ({
      contractId: row.contractId ?? "",
      contractNumber: row.contractNumber ?? 0,
      business: row.businessName ?? null,
      role: roleOf(row.role),
      amount: row.amount ?? 0,
      dueDate: dayOf(row.dueDate ?? ""),
      currency: row.currencyId ?? null,
    })),
    repaid: (dto.repaid ?? []).map((row) => ({
      contractId: row.contractId ?? "",
      contractNumber: row.contractNumber ?? 0,
      role: roleOf(row.role),
      paidInstallments: row.paidInstallments ?? 0,
      totalInstallments: row.totalInstallments ?? 0,
      hasOverdue: row.hasOverdue ?? false,
      endDate: optionalDay(row.endDate),
      stillOwed: row.stillOwed ?? 0,
      currency: row.currencyId ?? null,
    })),
  };
}

/** 1 234,56 € in the record's currency; without a usable currency code, the amount alone or with what was given */
export function formatMoney(value: number, currency: string | null): string {
  const plain = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  if (currency && /^[A-Za-z]{3}$/.test(currency)) return new Intl.NumberFormat("pt-PT", { ...plain, style: "currency", currency }).format(value);
  const amount = new Intl.NumberFormat("pt-PT", plain).format(value);
  return currency ? `${amount} ${currency}` : amount;
}

/** 6,90 % */
export const formatRate = (value: number) => `${value.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} %`;

/** 15 Oct 2026 */
export const formatDate = (iso: string): string =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

/** Today in local time, yyyy-mm-dd */
export const todayLocal = (now = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
