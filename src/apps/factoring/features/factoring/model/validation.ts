import { tx } from "../factoringText";
import { isConfirming, type Agreement, type RequestDraft } from "./factoring";

// What is checked before anything is sent. Only these rules: dates against today, the agreement's
// term and its plafond on a request are Accipiens' to decide, and it answers with its own messages.
// Keys: "agreement", "supplier", "documents" (the list as a whole), "documents.<i>.<field>".
export type FactoringErrors = Partial<Record<string, string>>;

export const INVOICE_NUMBER_MAX = 30;

/** A new request's agreement */
export function validateAgreementStep(agreement: Agreement | undefined): FactoringErrors {
  if (!agreement) return { agreement: tx("validation.agreement", "Select an agreement.") };
  if (agreement.canSubmit !== true) return { agreement: tx("validation.agreementClosed", "This agreement can't take new requests. Select another.") };
  return {};
}

/** A new request's supplier, under confirming */
export function validateSupplierStep(draft: RequestDraft, agreement: Agreement | undefined): FactoringErrors {
  return agreement && isConfirming(agreement) && !draft.supplier ? { supplier: tx("validation.supplier", "Select the supplier.") } : {};
}

/** A new request's invoices */
export function validateDocumentsStep(draft: RequestDraft, agreement: Agreement | undefined): FactoringErrors {
  if (draft.documents.length === 0) return { documents: tx("validation.noInvoices", "Add at least one invoice.") };

  const errors: FactoringErrors = {};
  const confirming = !!agreement && isConfirming(agreement);
  const seen = new Set<string>();

  draft.documents.forEach((doc, i) => {
    const set = (field: string, message: string) => (errors[`documents.${i}.${field}`] = message);
    const number = doc.invoiceNumber.trim();

    if (!number) set("invoiceNumber", tx("validation.invoiceNumber", "Enter the invoice number."));
    else if (number.length > INVOICE_NUMBER_MAX) set("invoiceNumber", tx("validation.invoiceNumberLength", "Up to {{max}} characters.", { max: INVOICE_NUMBER_MAX }));
    else if (seen.has(number.toLowerCase())) set("invoiceNumber", tx("validation.invoiceRepeated", "This invoice number is already in this request."));
    seen.add(number.toLowerCase());

    if (!doc.issueDate) set("issueDate", tx("validation.issueDate", "Enter the issue date."));
    if (!doc.dueDate) set("dueDate", tx("validation.dueDate", "Enter the due date."));
    else if (doc.issueDate && doc.dueDate < doc.issueDate) set("dueDate", tx("validation.dueBeforeIssue", "The due date can't be before the issue date."));

    if (doc.amount === null || !(doc.amount > 0)) set("amount", tx("validation.amount", "Enter an amount above zero."));
    if (!confirming && !doc.debtor) set("debtor", tx("validation.debtor", "Select the debtor."));
  });

  return errors;
}

export type AdvanceForm = {
  agreement: Agreement;
  amount: number | null;
  valueDate: string;
  /** Confirming only */
  invoiceCount: number;
};

export type AdvanceErrors = Partial<Record<"invoices" | "amount" | "valueDate", string>>;

/**
 * Step 2 of an advance. Under factoring an amount above what is available is refused here (when the
 * API gave one); under confirming Accipiens judges the plafond.
 */
export function validateAdvance({ agreement, amount, valueDate, invoiceCount }: AdvanceForm): AdvanceErrors {
  const errors: AdvanceErrors = {};
  const confirming = isConfirming(agreement);
  const available = agreement.availableAmount;
  if (confirming && invoiceCount === 0) errors.invoices = tx("validation.selectInvoices", "Select at least one invoice.");
  if (amount === null || !(amount > 0)) errors.amount = tx("validation.amount", "Enter an amount above zero.");
  else if (!confirming && available !== null && available !== undefined && amount > available)
    errors.amount = tx("validation.aboveAvailable", "The amount is above what is available on this agreement.");
  if (!valueDate) errors.valueDate = tx("validation.valueDate", "Enter the value date.");
  return errors;
}
