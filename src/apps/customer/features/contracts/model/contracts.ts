// A customer's view of their credit contracts: the contracts they hold or guarantee, each one's
// cashflow (payment schedule) and its invoiced documents. Pure model; the API is in ../api.

export type ContractRole = "customer" | "secondHolder" | "guarantor";

export const ROLE_LABELS: Record<ContractRole, string> = {
  customer: "Customer",
  secondHolder: "Second holder",
  guarantor: "Guarantor",
};

export type Contract = {
  id: number;
  number: string;
  /** e.g. "Auto credit" */
  business: string;
  product: string;
  /** The financial company */
  lender: string;
  /** The signed-in customer's part in it */
  role: ContractRole;
  /** Everyone on the contract */
  holders: { name: string; role: ContractRole }[];
  /** The financed vehicle or equipment, if any */
  asset: string | null;
  startDate: string;
  endDate: string;
  /** Months */
  term: number;
  financedAmount: number;
  /** Current monthly payment */
  installment: number;
  /** Nominal annual rate, % */
  tan: number;
  /** Annual percentage rate of charge, % */
  taeg: number;
  paidInstallments: number;
  /** Principal still owed */
  outstanding: number;
  nextDueDate: string | null;
  nextAmount: number | null;
  overdueAmount: number;
  overdueCount: number;
  /** e.g. "Direct debit · PT50 •••• 4321" */
  paymentMethod: string;
};

export type PaymentStatus = "paid" | "overdue" | "due" | "scheduled";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Paid",
  overdue: "Overdue",
  due: "Next",
  scheduled: "Scheduled",
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
};

export type DocumentType = "invoice" | "debitNote" | "creditNote";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  invoice: "Invoice",
  debitNote: "Debit note",
  creditNote: "Credit note",
};

export type DocumentStatus = "paid" | "open" | "overdue";

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = { paid: "Paid", open: "Open", overdue: "Overdue" };

export type InvoiceLine = { description: string; net: number; taxRate?: number };

/** An invoiced document of a contract (installment invoice, late-payment debit note, credit note) */
export type InvoiceDocument = {
  id: number;
  number: string;
  type: DocumentType;
  issueDate: string;
  dueDate: string;
  description: string;
  /** The installment it bills, if any */
  installment?: number;
  lines: InvoiceLine[];
  net: number;
  tax: number;
  total: number;
  status: DocumentStatus;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

/** yyyy-mm-dd `months` later, on the same day (or the month's last day when shorter) */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const total = m - 1 + months;
  const year = y + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const day = Math.min(d, daysInMonth(year, month));
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** French amortization: the same principal + interest every month, interest on the balance */
export function amortizationSchedule({
  amount,
  rate,
  term,
  firstDueDate,
  monthlyFee = 0,
}: {
  amount: number;
  /** Annual, % */
  rate: number;
  term: number;
  firstDueDate: string;
  monthlyFee?: number;
}): CashflowRow[] {
  const r = rate / 100 / 12;
  const payment = r === 0 ? amount / term : (amount * r) / (1 - (1 + r) ** -term);
  let balance = amount;
  return Array.from({ length: term }, (_, i) => {
    const interest = round2(balance * r);
    // The last payment settles whatever is left (rounding)
    const principal = i === term - 1 ? round2(balance) : round2(payment - interest);
    balance = round2(balance - principal);
    return {
      number: i + 1,
      dueDate: addMonths(firstDueDate, i),
      principal,
      interest,
      fees: monthlyFee,
      total: round2(principal + interest + monthlyFee),
      balance,
      status: "scheduled" as const,
    };
  });
}

/** Paid up to `paidCount`; then overdue while past due; then the next one is due */
export function withStatuses(rows: CashflowRow[], paidCount: number, today: string): CashflowRow[] {
  let nextFound = false;
  return rows.map((row, i) => {
    let status: PaymentStatus;
    if (i < paidCount) status = "paid";
    else if (row.dueDate < today) status = "overdue";
    else if (!nextFound) {
      status = "due";
      nextFound = true;
    } else status = "scheduled";
    return { ...row, status };
  });
}

type Tally = { count: number; amount: number };

const tally = (rows: CashflowRow[]): Tally => ({ count: rows.length, amount: round2(rows.reduce((sum, r) => sum + r.total, 0)) });

export type CashflowSummary = {
  paid: Tally;
  overdue: Tally;
  /** Everything not paid yet (overdue included) */
  remaining: Tally;
  next: CashflowRow | null;
  /** Share of the total already paid, whole % */
  paidShare: number;
};

export function cashflowSummary(rows: CashflowRow[]): CashflowSummary {
  const paid = tally(rows.filter((r) => r.status === "paid"));
  const all = tally(rows);
  return {
    paid,
    overdue: tally(rows.filter((r) => r.status === "overdue")),
    remaining: tally(rows.filter((r) => r.status !== "paid")),
    next: rows.find((r) => r.status === "due") ?? null,
    paidShare: all.amount > 0 ? Math.round((paid.amount / all.amount) * 100) : 0,
  };
}

/** The contracts I hold (pay), as opposed to the ones I only guarantee */
export const isHolder = (contract: Contract) => contract.role !== "guarantor";

export type PortfolioSummary = {
  /** Contracts as customer or second holder */
  holding: number;
  /** Their monthly payments together */
  monthly: number;
  /** Principal still owed on them */
  outstanding: number;
  overdue: { amount: number; contracts: number };
  next: { contractId: number; contractNumber: string; date: string; amount: number } | null;
  guarantees: { contracts: number; outstanding: number; overdueAmount: number };
};

export function portfolioSummary(contracts: Contract[]): PortfolioSummary {
  const held = contracts.filter(isHolder);
  const guaranteed = contracts.filter((c) => !isHolder(c));
  const sum = (list: Contract[], pick: (c: Contract) => number) => round2(list.reduce((total, c) => total + pick(c), 0));
  const upcoming = held
    .filter((c) => c.nextDueDate && c.nextAmount != null)
    .sort((a, b) => a.nextDueDate!.localeCompare(b.nextDueDate!));
  const first = upcoming[0];

  return {
    holding: held.length,
    monthly: sum(held, (c) => c.installment),
    outstanding: sum(held, (c) => c.outstanding),
    overdue: { amount: sum(held, (c) => c.overdueAmount), contracts: held.filter((c) => c.overdueAmount > 0).length },
    next: first ? { contractId: first.id, contractNumber: first.number, date: first.nextDueDate!, amount: first.nextAmount! } : null,
    guarantees: {
      contracts: guaranteed.length,
      outstanding: sum(guaranteed, (c) => c.outstanding),
      overdueAmount: sum(guaranteed, (c) => c.overdueAmount),
    },
  };
}

/** My payments month by month (yyyy-mm), from this month: each held contract from its next payment until it ends */
export function paymentsAhead(contracts: Contract[], today: string, months = 12): { month: string; amount: number }[] {
  const start = `${today.slice(0, 7)}-01`;
  const held = contracts.filter((c) => isHolder(c) && c.nextDueDate);
  return Array.from({ length: months }, (_, i) => {
    const month = addMonths(start, i).slice(0, 7);
    const paying = held.filter((c) => c.nextDueDate!.slice(0, 7) <= month && month <= c.endDate.slice(0, 7));
    return { month, amount: round2(paying.reduce((sum, c) => sum + c.installment, 0)) };
  });
}

const EURO = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

/** 1 234,56 € */
export const formatEuro = (value: number): string => EURO.format(value);

/** 15 Oct 2026 */
export const formatDate = (iso: string): string =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

/** Today in local time, yyyy-mm-dd */
export const todayLocal = (now = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
