import { describe, expect, it } from "vitest";
import {
  advanceOf,
  availableOf,
  emptyDocument,
  emptyFactoringDraft,
  formatEuro,
  isConfirming,
  totalOf,
  type Entity,
  type FactoringAgreement,
  type FactoringDocument,
  type FactoringDraft,
} from "./factoring";
import { validateAgreementStep, validateDocumentsStep } from "./validation";

const TODAY = "2026-10-06";

const FACTORING: FactoringAgreement = {
  id: 1,
  number: "FCT-001-1",
  financialCompany: "Banco Atlântico",
  nature: 0,
  creditLimit: 200_000,
  used: 150_000,
  advancePercent: 80,
  maxTermDays: 120,
  rate: 3.9,
};
const CONFIRMING: FactoringAgreement = { ...FACTORING, id: 2, number: "CNF-001-1", nature: 1 };

const DEBTOR: Entity = { id: 7, name: "Construtora Norte, S.A.", taxNumber: "500123456" };
const OTHER_DEBTOR: Entity = { id: 8, name: "Hotel Mar Azul, Lda.", taxNumber: "509876543" };

const doc = (changes: Partial<FactoringDocument> = {}): FactoringDocument => ({
  ...emptyDocument("d1"),
  invoiceNumber: "FT 2026/101",
  issueDate: "2026-09-20",
  dueDate: "2026-12-20",
  amount: 10_000,
  debtor: DEBTOR,
  ...changes,
});

const draft = (documents: FactoringDocument[], changes: Partial<FactoringDraft> = {}): FactoringDraft => ({
  ...emptyFactoringDraft(),
  agreementId: 1,
  documents,
  ...changes,
});

describe("agreement figures", () => {
  it("nature 1 is confirming, 0 is factoring", () => {
    expect(isConfirming(CONFIRMING)).toBe(true);
    expect(isConfirming(FACTORING)).toBe(false);
  });

  it("available is what is left of the limit; the advance is a share of the total", () => {
    expect(availableOf(FACTORING)).toBe(50_000);
    expect(availableOf({ ...FACTORING, used: 300_000 })).toBe(0);
    expect(totalOf([doc(), doc({ amount: 2_500.5 }), doc({ amount: null })])).toBe(12_500.5);
    expect(advanceOf(12_500, FACTORING)).toBe(10_000);
  });

  it("amounts show cents only when they have them", () => {
    expect(formatEuro(25_000)).toBe("€25,000");
    expect(formatEuro(2_500.5)).toBe("€2,500.50");
  });
});

describe("validateAgreementStep", () => {
  it("requires an agreement", () =>
    expect(validateAgreementStep(draft([], { agreementId: null }), undefined)).toEqual({ agreement: "Select an agreement." }));

  it("factoring needs nothing else (the debtor is chosen invoice by invoice)", () =>
    expect(validateAgreementStep(draft([]), FACTORING)).toEqual({}));

  it("confirming needs its supplier", () => {
    expect(validateAgreementStep(draft([], { agreementId: 2 }), CONFIRMING)).toEqual({ supplier: "Select the supplier." });
    expect(validateAgreementStep(draft([], { agreementId: 2, supplier: DEBTOR }), CONFIRMING)).toEqual({});
  });
});

describe("validateDocumentsStep", () => {
  it("accepts complete invoices", () => expect(validateDocumentsStep(draft([doc()]), FACTORING, TODAY)).toEqual({}));

  it("needs at least one invoice", () =>
    expect(validateDocumentsStep(draft([]), FACTORING, TODAY)).toEqual({ documents: "Add at least one invoice." }));

  it("requires number, dates and amount, and the debtor under factoring", () =>
    expect(validateDocumentsStep(draft([emptyDocument("d1")]), FACTORING, TODAY)).toEqual({
      "documents.0.invoiceNumber": "Enter the invoice number.",
      "documents.0.issueDate": "Enter the issue date.",
      "documents.0.dueDate": "Enter the due date.",
      "documents.0.amount": "Enter the amount.",
      "documents.0.debtor": "Select the debtor.",
    }));

  it("under confirming every invoice is the supplier's: no debtor to choose", () =>
    expect(validateDocumentsStep(draft([doc({ debtor: null })], { agreementId: 2, supplier: DEBTOR }), CONFIRMING, TODAY)).toEqual({}));

  it("checks the dates: issued by today, due after the issue, not yet due, within the agreement's term", () => {
    expect(validateDocumentsStep(draft([doc({ issueDate: "2026-10-07", dueDate: "2026-12-01" })]), FACTORING, TODAY)).toEqual({
      "documents.0.issueDate": "The issue date can't be in the future.",
    });
    expect(validateDocumentsStep(draft([doc({ issueDate: "2026-09-20", dueDate: "2026-09-19" })]), FACTORING, TODAY)).toEqual({
      "documents.0.dueDate": "The due date can't be before the issue date.",
    });
    expect(validateDocumentsStep(draft([doc({ dueDate: "2026-10-05" })]), FACTORING, TODAY)).toEqual({
      "documents.0.dueDate": "This invoice is already due.",
    });
    // 120 days from 2026-10-06 is 2027-02-03
    expect(validateDocumentsStep(draft([doc({ dueDate: "2027-02-03" })]), FACTORING, TODAY)).toEqual({});
    expect(validateDocumentsStep(draft([doc({ dueDate: "2027-02-04" })]), FACTORING, TODAY)).toEqual({
      "documents.0.dueDate": "Due beyond the agreement's term (120 days).",
    });
  });

  it("an invoice number appears once per debtor (once in all under confirming)", () => {
    expect(
      validateDocumentsStep(draft([doc(), doc({ key: "d2", invoiceNumber: " ft 2026/101 " })]), FACTORING, TODAY),
    ).toEqual({ "documents.1.invoiceNumber": "This invoice is already in the list." });
    expect(validateDocumentsStep(draft([doc(), doc({ key: "d2", debtor: OTHER_DEBTOR })]), FACTORING, TODAY)).toEqual({});
    expect(
      validateDocumentsStep(
        draft([doc({ debtor: null }), doc({ key: "d2", debtor: null })], { agreementId: 2, supplier: DEBTOR }),
        CONFIRMING,
        TODAY,
      ),
    ).toEqual({ "documents.1.invoiceNumber": "This invoice is already in the list." });
  });

  it("the invoices must fit in what is available", () =>
    expect(
      validateDocumentsStep(draft([doc({ amount: 30_000 }), doc({ key: "d2", invoiceNumber: "FT 2026/102", amount: 25_000 })]), FACTORING, TODAY),
    ).toEqual({ documents: "The invoices add up to €55,000; only €50,000 is available on this agreement." }));
});
