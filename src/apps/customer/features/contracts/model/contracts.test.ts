import { describe, expect, it } from "vitest";
import {
  cashflowOf,
  contractCardOf,
  contractOf,
  dashboardOf,
  documentDetailOf,
  documentOf,
  formatMoney,
  joined,
  openingPage,
  repaidShare,
} from "./contracts";

describe("contractCardOf", () => {
  it("maps the API's card, with the asset and its plate together", () => {
    const card = contractCardOf({
      id: "a/b+c",
      number: 100018734,
      role: "SecondHolder",
      businessName: "Auto credit",
      assetDescription: "Peugeot 208",
      licencePlate: "AA-11-BB",
      nextPayment: { amount: 310.5, dueDate: "2026-11-15T00:00:00" },
      stillOwed: 9000,
      currencyId: "EUR",
    });
    expect(card).toMatchObject({
      id: "a/b+c",
      number: 100018734,
      role: "secondHolder",
      asset: "Peugeot 208 · AA-11-BB",
      next: { amount: 310.5, dueDate: "2026-11-15" },
      stillOwed: 9000,
      overdueAmount: 0,
      currency: "EUR",
    });
  });

  it("no asset is null, for the screens' own text", () => expect(contractCardOf({}).asset).toBeNull());

  it("a missing or .NET's empty next payment is no next payment", () => {
    expect(contractCardOf({}).next).toBeNull();
    expect(contractCardOf({ nextPayment: { amount: 0, dueDate: "0001-01-01T00:00:00" } }).next).toBeNull();
  });
});

describe("contractOf", () => {
  it("adds the conditions: the payment method with its account, and the people", () => {
    const contract = contractOf({
      termMonths: 72,
      nominalRate: 6.9,
      startDate: "2024-12-15T00:00:00",
      paymentMethod: "Direct debit",
      maskedAccount: "PT50 •••• 4321",
      people: [{ name: "Ana", role: "Guarantor" }],
    });
    expect(contract).toMatchObject({
      term: 72,
      tan: 6.9,
      taeg: null,
      startDate: "2024-12-15",
      endDate: null,
      paymentMethod: "Direct debit · PT50 •••• 4321",
      people: [{ name: "Ana", role: "guarantor" }],
    });
  });

  it("no payment method at all is null", () => expect(contractOf({}).paymentMethod).toBeNull());
});

describe("cashflowOf", () => {
  it("keeps the API's figures and maps every installment status", () => {
    const statuses = ["Paid", "Overdue", "InCollection", "NotInvoiced", "Next", "Scheduled"] as const;
    const cashflow = cashflowOf({
      currencyId: "EUR",
      paidAmount: 100,
      paidInstallments: 1,
      overdueAmount: 50,
      overdueInstallments: 1,
      stillToPay: 300,
      unpaidInstallments: 5,
      totalInstallments: 6,
      totalCount: 6,
      nextPosition: 5,
      installments: statuses.map((status, i) => ({ number: i + 1, dueDate: "2026-11-15T00:00:00", payment: 50, status })),
    });
    expect(cashflow.paid).toEqual({ count: 1, amount: 100 });
    expect(cashflow.overdue).toEqual({ count: 1, amount: 50 });
    expect(cashflow.remaining).toEqual({ count: 5, amount: 300 });
    expect(cashflow.rows.map((row) => row.status)).toEqual(["paid", "overdue", "inCollection", "notInvoiced", "due", "scheduled"]);
    expect(cashflow.rows[0]).toMatchObject({ dueDate: "2026-11-15", total: 50 });
    expect(cashflow.nextPosition).toBe(5);
  });
});

describe("cashflowOf, the residual value", () => {
  it("tells it from the rent with the same number", () => {
    const { rows } = cashflowOf({
      installments: [
        { number: 1, flowClass: "Rents" },
        { number: 1, flowClass: "ResidualValue" },
      ],
    });
    expect(rows.map((row) => row.isResidualValue)).toEqual([false, true]);
  });
});

describe("openingPage", () => {
  it.each([
    [null, 1],
    [0, 1],
    [1, 1],
    [12, 1],
    [13, 2],
    [25, 3],
  ])("position %s of pages of 12 is on page %s", (position, page) => expect(openingPage(position, 12)).toBe(page));
});

describe("documentOf / documentDetailOf", () => {
  it("maps the status, day-only dates and missing dates", () => {
    expect(documentOf({ id: "d", number: "FT 1", status: "InCollection", issueDate: "2026-10-01T00:00:00", dueDate: null, hasPdf: true })).toMatchObject({
      id: "d",
      status: "inCollection",
      issueDate: "2026-10-01",
      dueDate: null,
      hasPdf: true,
    });
  });

  it("a document without the PDF flag has none", () => expect(documentOf({}).hasPdf).toBe(false));

  it("the detail adds its lines, totals and payment method", () => {
    const detail = documentDetailOf({
      contractNumber: 7,
      lines: [{ description: "Fee", amount: 2.5, taxRate: 23 }, { description: "Interest", amount: 10, isExempt: true }],
      net: 12.5,
      tax: 0.58,
      total: 13.08,
      paymentMethod: "Direct debit",
    });
    expect(detail.lines).toEqual([
      { description: "Fee", amount: 2.5, taxRate: 23, isExempt: false },
      { description: "Interest", amount: 10, taxRate: null, isExempt: true },
    ]);
    expect(detail).toMatchObject({ contractNumber: 7, net: 12.5, tax: 0.58, total: 13.08, paymentMethod: "Direct debit" });
  });
});

describe("dashboardOf", () => {
  const dashboard = dashboardOf({
    totals: [
      {
        currencyId: "EUR",
        nextPayment: { contractId: "c1", contractNumber: 1, amount: 300, dueDate: "2026-11-15T00:00:00" },
        overdueAmount: 40,
        stillOwed: 1000,
        stillOwedContracts: 2,
        paidEachMonth: 500,
        guarantor: { stillOwed: 90, overdueAmount: 9, contracts: 1 },
      },
      { currencyId: "USD", stillOwed: 2000 },
    ],
    overdueContracts: [{ contractId: "c1", contractNumber: 1, amount: 40, currencyId: "EUR" }],
    monthlyPayments: [
      { month: "2026-11-01T00:00:00", currencyId: "EUR", amount: 500 },
      { month: "2026-11-01T00:00:00", currencyId: "USD", amount: 800 },
    ],
    stillOwedByContract: [
      { contractId: "c1", contractNumber: 1, amount: 1000, currencyId: "EUR" },
      { contractId: "c2", contractNumber: 2, amount: 2000, currencyId: "USD" },
    ],
  });

  it("keeps each currency apart", () => {
    const [eur, usd] = dashboard.overviews;
    expect(eur.currency).toBe("EUR");
    expect(eur.monthlyPayments).toEqual([{ month: "2026-11", amount: 500 }]);
    expect(eur.owedByContract.map((c) => c.id)).toEqual(["c1"]);
    expect(eur.overdue).toEqual({ amount: 40, contracts: [{ id: "c1", number: 1 }] });
    expect(usd.monthlyPayments).toEqual([{ month: "2026-11", amount: 800 }]);
    expect(usd.owedByContract.map((c) => c.id)).toEqual(["c2"]);
    expect(usd.overdue.contracts).toEqual([]);
  });

  it("gives the next payment its contract, or none", () => {
    expect(dashboard.overviews[0].next).toEqual({ amount: 300, dueDate: "2026-11-15", contractId: "c1", contractNumber: 1 });
    expect(dashboard.overviews[1].next).toBeNull();
  });

  it("an account without contracts has an empty dashboard", () =>
    expect(dashboardOf({ totals: [], repaid: [], comingUp: [] })).toEqual({ overviews: [], comingUp: [], repaid: [] }));
});

describe("repaidShare", () => {
  it("is a whole percentage", () => expect(repaidShare(1, 3)).toBe(33));
  it("no installments is 0, not a division by zero", () => expect(repaidShare(0, 0)).toBe(0));
});

describe("joined", () => {
  it("leaves out what is missing, not a 0", () => expect(joined("a", null, undefined, "", 0, "b")).toBe("a · 0 · b"));
});

describe("formatMoney", () => {
  const spaces = (text: string) => text.replace(/\s/g, " ");
  it("uses the record's currency", () => {
    expect(spaces(formatMoney(1234.5, "EUR"))).toBe("1234,50 €");
    expect(spaces(formatMoney(1234.5, "USD"))).toContain("US$");
  });
  it("copes with no currency, and with a code Intl refuses", () => {
    expect(spaces(formatMoney(10, null))).toBe("10,00");
    expect(spaces(formatMoney(10, "EURO"))).toBe("10,00 EURO");
  });
});
