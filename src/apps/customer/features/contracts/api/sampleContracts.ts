import { delay } from "@platform/api/devFallback";
import {
  addMonths,
  amortizationSchedule,
  todayLocal,
  withStatuses,
  type CashflowRow,
  type Contract,
  type ContractRole,
  type InvoiceDocument,
} from "../model/contracts";

// Development-only stand-ins for the customer endpoints: the signed-in customer's four contracts
// (one per role, one in arrears), their payment schedules and invoiced documents, all built from
// today's date so the figures stay current.

const ME = "Ana Silva";
const FEE_NET = 2.5;
const VAT = 23;
const FEE_TAX = Math.round(FEE_NET * VAT) / 100;

type Seed = {
  id: number;
  number: string;
  business: string;
  product: string;
  lender: string;
  role: ContractRole;
  holders: { name: string; role: ContractRole }[];
  asset: string | null;
  amount: number;
  rate: number;
  taeg: number;
  term: number;
  /** Months since the first payment (first due date = today − monthsAgo, on `day`) */
  monthsAgo: number;
  day: number;
  overdue: number;
  paymentMethod: string;
};

const SEEDS: Seed[] = [
  {
    id: 101,
    number: "AC-2024-018734",
    business: "Auto credit",
    product: "Auto credit — new",
    lender: "Montra Finance",
    role: "customer",
    holders: [{ name: ME, role: "customer" }],
    asset: "Peugeot 208 1.2 PureTech Allure · AA-11-BB",
    amount: 18_000,
    rate: 6.9,
    taeg: 8.5,
    term: 72,
    monthsAgo: 22,
    day: 15,
    overdue: 0,
    paymentMethod: "Direct debit · PT50 •••• 4321",
  },
  {
    id: 102,
    number: "PL-2025-004512",
    business: "Personal loan",
    product: "Personal loan",
    lender: "Montra Finance",
    role: "customer",
    holders: [{ name: ME, role: "customer" }],
    asset: null,
    amount: 7_000,
    rate: 9.9,
    taeg: 11.8,
    term: 48,
    monthsAgo: 18,
    day: 5,
    overdue: 1,
    paymentMethod: "Direct debit · PT50 •••• 4321",
  },
  {
    id: 103,
    number: "LS-2023-009981",
    business: "Financial leasing",
    product: "Leasing — vehicles",
    lender: "Banco Atlântico",
    role: "secondHolder",
    holders: [
      { name: "João Silva", role: "customer" },
      { name: ME, role: "secondHolder" },
    ],
    asset: "Renault Clio 1.0 TCe Evolution · BC-22-DE",
    amount: 24_000,
    rate: 5.9,
    taeg: 7.4,
    term: 60,
    monthsAgo: 39,
    day: 20,
    overdue: 0,
    paymentMethod: "Direct debit · PT50 •••• 8810",
  },
  {
    id: 104,
    number: "PL-2025-011207",
    business: "Personal loan",
    product: "Personal loan — green",
    lender: "Lusa Financeira",
    role: "guarantor",
    holders: [
      { name: "Rui Costa", role: "customer" },
      { name: ME, role: "guarantor" },
    ],
    asset: null,
    amount: 12_000,
    rate: 7.5,
    taeg: 9.1,
    term: 60,
    monthsAgo: 13,
    day: 10,
    overdue: 2,
    paymentMethod: "Direct debit · PT50 •••• 0077",
  },
];

/** The first due date: `monthsAgo` months back, on the contract's payment day */
function firstDueDate(seed: Seed, today: string): string {
  const [y, m] = today.split("-").map(Number);
  return addMonths(`${y}-${String(m).padStart(2, "0")}-${String(seed.day).padStart(2, "0")}`, -seed.monthsAgo);
}

function scheduleOf(seed: Seed, today: string): CashflowRow[] {
  const rows = amortizationSchedule({
    amount: seed.amount,
    rate: seed.rate,
    term: seed.term,
    firstDueDate: firstDueDate(seed, today),
    monthlyFee: Math.round((FEE_NET + FEE_TAX) * 100) / 100,
  });
  const pastDue = rows.filter((r) => r.dueDate < today).length;
  return withStatuses(rows, Math.max(0, pastDue - seed.overdue), today);
}

function contractOf(seed: Seed, today: string): Contract {
  const rows = scheduleOf(seed, today);
  const paid = rows.filter((r) => r.status === "paid");
  const overdue = rows.filter((r) => r.status === "overdue");
  const next = rows.find((r) => r.status === "due") ?? null;
  return {
    id: seed.id,
    number: seed.number,
    business: seed.business,
    product: seed.product,
    lender: seed.lender,
    role: seed.role,
    holders: seed.holders,
    asset: seed.asset,
    startDate: addMonths(rows[0].dueDate, -1),
    endDate: rows.at(-1)!.dueDate,
    term: seed.term,
    financedAmount: seed.amount,
    installment: rows[0].total,
    tan: seed.rate,
    taeg: seed.taeg,
    paidInstallments: paid.length,
    outstanding: paid.length ? paid.at(-1)!.balance : seed.amount,
    nextDueDate: next?.dueDate ?? null,
    nextAmount: next?.total ?? null,
    overdueAmount: Math.round(overdue.reduce((sum, r) => sum + r.total, 0) * 100) / 100,
    overdueCount: overdue.length,
    paymentMethod: seed.paymentMethod,
  };
}

const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

function documentsOf(seed: Seed, today: string): InvoiceDocument[] {
  const prefix = seed.number.slice(0, 2);
  const docs: InvoiceDocument[] = [];
  for (const row of scheduleOf(seed, today)) {
    // Each installment is invoiced 20 days before it is due
    const issueDate = addDays(row.dueDate, -20);
    if (issueDate > today) break;
    const net = Math.round((row.principal + row.interest + FEE_NET) * 100) / 100;
    docs.push({
      id: seed.id * 1000 + row.number,
      number: `FT ${prefix}${issueDate.slice(0, 4)}/${String(seed.id * 100 + row.number).padStart(6, "0")}`,
      type: "invoice",
      issueDate,
      dueDate: row.dueDate,
      description: `Installment ${row.number} of ${seed.term}`,
      installment: row.number,
      lines: [
        { description: "Principal", net: row.principal },
        { description: "Interest", net: row.interest },
        { description: "Processing fee", net: FEE_NET, taxRate: VAT },
      ],
      net,
      tax: FEE_TAX,
      total: Math.round((net + FEE_TAX) * 100) / 100,
      status: row.status === "paid" ? "paid" : row.status === "overdue" ? "overdue" : "open",
    });
    // A late installment also gets a debit note for the late-payment interest
    if (row.status === "overdue") {
      const lateInterest = Math.round(row.total * 0.04 * 100) / 100;
      docs.push({
        id: seed.id * 1000 + 500 + row.number,
        number: `ND ${prefix}${today.slice(0, 4)}/${String(seed.id * 100 + row.number).padStart(6, "0")}`,
        type: "debitNote",
        issueDate: addDays(row.dueDate, 5) < today ? addDays(row.dueDate, 5) : today,
        dueDate: addDays(row.dueDate, 20),
        description: `Late payment interest · installment ${row.number}`,
        installment: row.number,
        lines: [{ description: "Late payment interest", net: lateInterest }],
        net: lateInterest,
        tax: 0,
        total: lateInterest,
        status: addDays(row.dueDate, 20) < today ? "overdue" : "open",
      });
    }
  }
  return docs.sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.id - a.id);
}

const seedOf = (id: number) => SEEDS.find((s) => s.id === id);

export async function sampleContracts(): Promise<Contract[]> {
  await delay(250);
  const today = todayLocal();
  return SEEDS.map((seed) => contractOf(seed, today));
}

export async function sampleCashflow(contractId: number): Promise<CashflowRow[] | null> {
  await delay(200);
  const seed = seedOf(contractId);
  return seed ? scheduleOf(seed, todayLocal()) : null;
}

export async function sampleDocuments(contractId: number): Promise<InvoiceDocument[] | null> {
  await delay(200);
  const seed = seedOf(contractId);
  return seed ? documentsOf(seed, todayLocal()) : null;
}

export const SAMPLE_CUSTOMER_NAME = ME;
