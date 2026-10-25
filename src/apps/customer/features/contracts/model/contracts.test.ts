import { describe, expect, it } from "vitest";
import {
  amortizationSchedule,
  cashflowSummary,
  paymentsAhead,
  portfolioSummary,
  withStatuses,
  type CashflowRow,
  type Contract,
} from "./contracts";

const TODAY = "2026-10-06";

describe("amortizationSchedule", () => {
  const rows = amortizationSchedule({ amount: 12_000, rate: 6, term: 12, firstDueDate: "2026-01-15", monthlyFee: 2.5 });

  it("one row per month, due on the same day", () => {
    expect(rows).toHaveLength(12);
    expect(rows.map((r) => r.dueDate).slice(0, 3)).toEqual(["2026-01-15", "2026-02-15", "2026-03-15"]);
  });

  it("repays the whole amount: principals add up to it and the balance ends at 0", () => {
    expect(rows.reduce((sum, r) => sum + r.principal, 0)).toBeCloseTo(12_000, 2);
    expect(rows.at(-1)!.balance).toBe(0);
  });

  it("each payment is principal + interest + fees, with interest on the balance", () => {
    expect(rows[0].interest).toBe(60);
    for (const r of rows) expect(r.total).toBeCloseTo(r.principal + r.interest + r.fees, 2);
    expect(rows[0].fees).toBe(2.5);
  });

  it("the month-end day moves to the last day of shorter months", () =>
    expect(amortizationSchedule({ amount: 1_000, rate: 0, term: 3, firstDueDate: "2026-01-31" }).map((r) => r.dueDate)).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
    ]));
});

describe("withStatuses", () => {
  const rows = amortizationSchedule({ amount: 6_000, rate: 5, term: 6, firstDueDate: "2026-07-01" });

  it("paid up to the paid count, then overdue while past due, then the next one due, then scheduled", () =>
    expect(withStatuses(rows, 2, TODAY).map((r) => r.status)).toEqual(["paid", "paid", "overdue", "overdue", "due", "scheduled"]));

  it("everything paid in time: the next one is due", () =>
    expect(withStatuses(rows, 4, TODAY).map((r) => r.status)).toEqual(["paid", "paid", "paid", "paid", "due", "scheduled"]));
});

describe("cashflowSummary", () => {
  const rows: CashflowRow[] = withStatuses(
    amortizationSchedule({ amount: 6_000, rate: 0, term: 6, firstDueDate: "2026-07-01" }),
    2,
    TODAY,
  );

  it("adds up what is paid, overdue and still to pay, and finds the next payment", () => {
    const summary = cashflowSummary(rows);
    expect(summary.paid).toEqual({ count: 2, amount: 2_000 });
    expect(summary.overdue).toEqual({ count: 2, amount: 2_000 });
    expect(summary.remaining).toEqual({ count: 4, amount: 4_000 });
    expect(summary.next?.dueDate).toBe("2026-11-01");
    expect(summary.paidShare).toBe(33);
  });
});

describe("portfolioSummary", () => {
  const contract = (changes: Partial<Contract>): Contract => ({
    id: 1,
    number: "C-1",
    business: "Auto credit",
    product: "Auto credit — new",
    lender: "Montra Finance",
    role: "customer",
    holders: [],
    asset: null,
    startDate: "2025-01-01",
    endDate: "2030-01-01",
    term: 60,
    financedAmount: 20_000,
    installment: 380,
    tan: 6.9,
    taeg: 8.5,
    paidInstallments: 20,
    outstanding: 13_000,
    nextDueDate: "2026-10-15",
    nextAmount: 380,
    overdueAmount: 0,
    overdueCount: 0,
    paymentMethod: "Direct debit",
    ...changes,
  });

  const summary = portfolioSummary([
    contract({ id: 1 }),
    contract({ id: 2, role: "secondHolder", nextDueDate: "2026-10-09", nextAmount: 150, installment: 150, outstanding: 4_000, overdueAmount: 300, overdueCount: 2 }),
    contract({ id: 3, role: "guarantor", nextDueDate: "2026-10-07", nextAmount: 900, installment: 900, outstanding: 40_000, overdueAmount: 900, overdueCount: 1 }),
  ]);

  it("my commitments are the contracts I hold (customer or second holder), not the ones I guarantee", () => {
    expect(summary.holding).toBe(2);
    expect(summary.monthly).toBe(530);
    expect(summary.outstanding).toBe(17_000);
    expect(summary.overdue).toEqual({ amount: 300, contracts: 1 });
  });

  it("the next payment is the earliest among my contracts", () =>
    expect(summary.next).toMatchObject({ contractId: 2, date: "2026-10-09", amount: 150 }));

  it("guarantees are counted apart, with their overdue amount", () =>
    expect(summary.guarantees).toEqual({ contracts: 1, outstanding: 40_000, overdueAmount: 900 }));
});

describe("paymentsAhead", () => {
  const base = { role: "customer" as const, installment: 100, nextDueDate: "2026-10-15", endDate: "2027-01-15" };
  const contracts = [
    base,
    { ...base, installment: 50, nextDueDate: "2026-10-20", endDate: "2028-01-20" },
    { ...base, role: "guarantor" as const, installment: 900 },
  ] as Contract[];

  it("my monthly payments for the coming months, each contract until it ends (not the ones I guarantee)", () =>
    expect(paymentsAhead(contracts, TODAY, 5)).toEqual([
      { month: "2026-10", amount: 150 },
      { month: "2026-11", amount: 150 },
      { month: "2026-12", amount: 150 },
      { month: "2027-01", amount: 150 },
      { month: "2027-02", amount: 50 },
    ]));
});
