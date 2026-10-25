import {
  addDays,
  availableOf,
  formatEuro,
  isConfirming,
  totalOf,
  type FactoringAgreement,
  type FactoringDraft,
} from "./factoring";

// The two steps of a factoring request, validated before moving on.
// Keys: "agreement", "supplier", "documents" (the list as a whole), "documents.<i>.<field>".
export type FactoringErrors = Partial<Record<string, string>>;

const INVOICE_MAX = 30;

/** Step 1: the agreement, and the supplier under confirming */
export function validateAgreementStep(draft: FactoringDraft, agreement: FactoringAgreement | undefined): FactoringErrors {
  if (draft.agreementId === null || !agreement) return { agreement: "Select an agreement." };
  if (isConfirming(agreement) && !draft.supplier) return { supplier: "Select the supplier." };
  return {};
}

/** Step 2: the invoices */
export function validateDocumentsStep(
  draft: FactoringDraft,
  agreement: FactoringAgreement | undefined,
  today: string,
): FactoringErrors {
  const errors: FactoringErrors = {};
  if (draft.documents.length === 0) return { documents: "Add at least one invoice." };

  const confirming = !!agreement && isConfirming(agreement);
  const lastDueDate = agreement ? addDays(today, agreement.maxTermDays) : null;
  const seen = new Set<string>();

  draft.documents.forEach((doc, i) => {
    const set = (field: string, message: string) => (errors[`documents.${i}.${field}`] = message);
    const number = doc.invoiceNumber.trim();

    if (!number) set("invoiceNumber", "Enter the invoice number.");
    else if (number.length > INVOICE_MAX) set("invoiceNumber", `Up to ${INVOICE_MAX} characters.`);
    else {
      // One invoice per debtor (all of them are the supplier's under confirming)
      const id = `${confirming ? "" : (doc.debtor?.id ?? "")}|${number.toLowerCase()}`;
      if (seen.has(id)) set("invoiceNumber", "This invoice is already in the list.");
      seen.add(id);
    }

    if (!doc.issueDate) set("issueDate", "Enter the issue date.");
    else if (doc.issueDate > today) set("issueDate", "The issue date can't be in the future.");

    if (!doc.dueDate) set("dueDate", "Enter the due date.");
    else if (doc.issueDate && doc.dueDate < doc.issueDate) set("dueDate", "The due date can't be before the issue date.");
    else if (doc.dueDate < today) set("dueDate", "This invoice is already due.");
    else if (lastDueDate && doc.dueDate > lastDueDate) set("dueDate", `Due beyond the agreement's term (${agreement!.maxTermDays} days).`);

    if (doc.amount === null || !(doc.amount > 0)) set("amount", "Enter the amount.");
    if (!confirming && !doc.debtor) set("debtor", "Select the debtor.");
  });

  if (agreement) {
    const total = totalOf(draft.documents);
    const available = availableOf(agreement);
    if (total > available)
      errors.documents = `The invoices add up to ${formatEuro(total)}; only ${formatEuro(available)} is available on this agreement.`;
  }

  return errors;
}
