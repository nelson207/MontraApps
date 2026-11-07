import { describe, expect, it } from "vitest";
import {
  advanceOf,
  buildCessionRequest,
  counterpartiesOf,
  pendingCounterpartiesOf,
  emptyInvoice,
  findAgreement,
  sameContract,
  searchCounterparties,
  sumOfAmounts,
  totalOf,
  type Agreement,
  type Counterparty,
  type InvoiceRow,
  type RequestDraft,
} from "./factoring";
import { validateAdvance, validateAgreementStep, validateSupplierStep, validateDocumentsStep } from "./validation";

const factoring: Agreement = { id: "AQ/f+1", number: 100053964, kind: "Factoring", currencyId: "EUR", canSubmit: true, canAdvance: true, availableAmount: 1000, totalAmount: 5000 };
const confirming: Agreement = { ...factoring, id: "AQ/c+1", number: 100053963, kind: "Confirming" };
const debtor: Counterparty = { interventionId: "AQ/d+1", name: "Oficina Évora", taxNumber: "500100200", externalNumber: "E7", kind: "Debtor" };
const supplier: Counterparty = { interventionId: "AQ/s+1", name: "Importadora", taxNumber: "500300400", kind: "Supplier" };

const invoice = (extra: Partial<InvoiceRow> = {}): InvoiceRow => ({
  ...emptyInvoice("k"),
  invoiceNumber: "FT 1",
  issueDate: "2026-11-01",
  dueDate: "2026-12-01",
  amount: 100,
  debtor,
  ...extra,
});
const draft = (documents: InvoiceRow[], chosenSupplier: Counterparty | null = null): RequestDraft => ({ supplier: chosenSupplier, documents });

describe("step 1 of a new request", () => {
  it("needs an agreement", () => expect(validateAgreementStep(undefined).agreement).toBeTruthy());
  it("refuses an agreement with canSubmit false", () => expect(validateAgreementStep({ ...factoring, canSubmit: false }).agreement).toBeTruthy());
  it("confirming needs its supplier, factoring doesn't", () => {
    expect(validateSupplierStep(draft([]), confirming).supplier).toBeTruthy();
    expect(validateSupplierStep(draft([], supplier), confirming)).toEqual({});
    expect(validateSupplierStep(draft([]), factoring)).toEqual({});
  });
});

describe("step 2 of a new request", () => {
  const errorsOf = (...documents: InvoiceRow[]) => validateDocumentsStep(draft(documents), factoring);

  it("needs at least one invoice", () => expect(errorsOf().documents).toBeTruthy());
  it("accepts a complete invoice", () => expect(errorsOf(invoice())).toEqual({}));

  it("needs the invoice number, counted without the outer spaces, up to 30 characters", () => {
    expect(errorsOf(invoice({ invoiceNumber: "   " }))["documents.0.invoiceNumber"]).toBeTruthy();
    expect(errorsOf(invoice({ invoiceNumber: `  ${"x".repeat(30)}  ` }))).toEqual({});
    expect(errorsOf(invoice({ invoiceNumber: "x".repeat(31) }))["documents.0.invoiceNumber"]).toBeTruthy();
  });

  it("refuses a repeated number, ignoring case and outer spaces, even with another debtor", () => {
    const errors = errorsOf(invoice({ invoiceNumber: "FT 1" }), invoice({ invoiceNumber: "  ft 1 ", debtor: { ...debtor, interventionId: "AQ/d+2" } }));
    expect(errors["documents.1.invoiceNumber"]).toBeTruthy();
    expect(errors["documents.0.invoiceNumber"]).toBeUndefined();
  });

  it.each([0, -5, null])("refuses an amount of %s", (amount) => expect(errorsOf(invoice({ amount }))["documents.0.amount"]).toBeTruthy());

  it("the due date can't be before the issue date; the same day is fine", () => {
    expect(errorsOf(invoice({ issueDate: "2026-11-02", dueDate: "2026-11-01" }))["documents.0.dueDate"]).toBeTruthy();
    expect(errorsOf(invoice({ issueDate: "2026-11-02", dueDate: "2026-11-02" }))).toEqual({});
  });

  it("needs both dates", () => {
    const errors = errorsOf(invoice({ issueDate: "", dueDate: "" }));
    expect(errors["documents.0.issueDate"]).toBeTruthy();
    expect(errors["documents.0.dueDate"]).toBeTruthy();
  });

  it("factoring needs a debtor per invoice; confirming asks for none", () => {
    expect(errorsOf(invoice({ debtor: null }))["documents.0.debtor"]).toBeTruthy();
    expect(validateDocumentsStep(draft([invoice({ debtor: null })], supplier), confirming)).toEqual({});
  });

  it("leaves dates against today and totals above what is available to Accipiens", () => {
    expect(errorsOf(invoice({ issueDate: "2030-01-01", dueDate: "2031-01-01", amount: 99_999 }))).toEqual({});
    expect(errorsOf(invoice({ issueDate: "2000-01-01", dueDate: "2000-02-01" }))).toEqual({});
  });
});

describe("the body of a new request", () => {
  it("factoring sends a debtor per invoice and no supplier; the number is trimmed", () => {
    expect(buildCessionRequest(draft([invoice({ invoiceNumber: "  FT 1 " })]), factoring)).toEqual({
      documents: [{ debtorInterventionId: "AQ/d+1", invoiceNumber: "FT 1", issueDate: "2026-11-01", dueDate: "2026-12-01", amount: 100 }],
    });
  });

  it("confirming sends the supplier and no debtor", () => {
    expect(buildCessionRequest(draft([invoice({ debtor: null })], supplier), confirming)).toEqual({
      supplierInterventionId: "AQ/s+1",
      documents: [{ invoiceNumber: "FT 1", issueDate: "2026-11-01", dueDate: "2026-12-01", amount: 100 }],
    });
  });
});

describe("the advance form", () => {
  const form = (extra = {}) => ({ agreement: factoring, amount: 500 as number | null, valueDate: "2026-11-10", invoiceCount: 0, ...extra });

  it("factoring refuses an amount above what is available; exactly that is fine", () => {
    expect(validateAdvance(form({ amount: 1000.01 })).amount).toBeTruthy();
    expect(validateAdvance(form({ amount: 1000 }))).toEqual({});
  });
  it("factoring with no known available amount leaves it to Accipiens", () =>
    expect(validateAdvance(form({ agreement: { ...factoring, availableAmount: null }, amount: 9_999_999 }))).toEqual({}));
  it("confirming needs invoices, and doesn't cap the amount here", () => {
    expect(validateAdvance(form({ agreement: confirming })).invoices).toBeTruthy();
    expect(validateAdvance(form({ agreement: confirming, invoiceCount: 1, amount: 9_999 }))).toEqual({});
  });
  it("needs an amount above 0 and a value date", () => {
    expect(validateAdvance(form({ amount: 0 })).amount).toBeTruthy();
    expect(validateAdvance(form({ amount: null })).amount).toBeTruthy();
    expect(validateAdvance(form({ valueDate: "" })).valueDate).toBeTruthy();
  });
});

describe("amounts", () => {
  it("adds up in cents", () => expect(totalOf([{ amount: 0.1 }, { amount: 0.2 }, { amount: null }])).toBe(0.3));
  it("the advance is hidden (null), not 0, when the percentage is null", () => {
    expect(advanceOf(1000, null)).toBeNull();
    expect(advanceOf(1000, undefined)).toBeNull();
    expect(advanceOf(1000, 80)).toBe(800);
    expect(advanceOf(1000, 0)).toBe(0);
  });
  it("a sum with a missing amount isn't guessed", () => {
    expect(sumOfAmounts([{ amount: 10 }, { amount: null }])).toBeNull();
    expect(sumOfAmounts([])).toBeNull();
    expect(sumOfAmounts([{ amount: 10.1 }, { amount: 20.2 }])).toBe(30.3);
  });
});

describe("counterparties", () => {
  it("each kind of agreement offers only its own", () => {
    expect(counterpartiesOf([debtor, supplier], factoring)).toEqual([debtor]);
    expect(counterpartiesOf([debtor, supplier], confirming)).toEqual([supplier]);
    expect(counterpartiesOf(undefined, factoring)).toEqual([]);
    const waiting = { ...supplier, state: "Pending" as const };
    const ended = { ...supplier, state: "Ended" as const };
    const active = { ...supplier, state: "Active" as const };
    expect(counterpartiesOf([waiting, ended, active], confirming)).toEqual([active]);
    expect(pendingCounterpartiesOf([waiting, ended, active, debtor], confirming)).toEqual([waiting]);
  });
  it.each(["evora", "ÉVORA", "500100", "e7", "oficina evora"])("finds by name, tax number or external number: %s", (search) =>
    expect(searchCounterparties([debtor, supplier], search)).toEqual([debtor]),
  );
  it("copes with a name that is null", () => expect(searchCounterparties([{ ...debtor, name: null }], "500100")).toHaveLength(1));
});

describe("opaque ids", () => {
  it("compares them as they are, with the number as the fallback", () => {
    expect(sameContract({ contractId: "AQ/f+1", contractNumber: null }, factoring)).toBe(true);
    expect(sameContract({ contractId: "other", contractNumber: 100053964 }, factoring)).toBe(true);
    expect(sameContract({ contractId: "other", contractNumber: 1 }, factoring)).toBe(false);
    expect(sameContract({ contractId: "other", contractNumber: null }, { id: "x", number: null })).toBe(false);
  });
  it("finds the chosen agreement in a fresh list, or nothing", () => {
    expect(findAgreement([factoring], { id: "AQ/f+1", number: 100053964 })).toBe(factoring);
    expect(findAgreement([factoring], { id: "AQ/gone", number: 5 })).toBeUndefined();
    expect(findAgreement([factoring], null)).toBeUndefined();
  });
});
