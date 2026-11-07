import type {
  FactoringContractDto,
  FactoringCounterpartyDto,
  FactoringDocumentDto,
  FactoringDocumentStatus,
  NewFactoringCessionDto,
} from "@platform/api/generated/MontraPOSApi";
import type { FactoringText } from "../factoringText";

// Invoices sent to the financial institution under an agreement (a contract). Its kind decides who
// the invoices are on:
//   Factoring:  the dealer's customers owe them, so each invoice has its own debtor
//   Confirming: the dealer owes them to one supplier, chosen once for the whole request

export type Agreement = FactoringContractDto;
export type Counterparty = FactoringCounterpartyDto;

export type InvoiceRow = {
  /** Client-side key for the list */
  key: string;
  invoiceNumber: string;
  /** yyyy-MM-dd */
  issueDate: string;
  /** yyyy-MM-dd */
  dueDate: string;
  amount: number | null;
  /** Factoring only */
  debtor: Counterparty | null;
};

export type RequestDraft = {
  /** Confirming only */
  supplier: Counterparty | null;
  documents: InvoiceRow[];
};

export const emptyInvoice = (key: string): InvoiceRow => ({ key, invoiceNumber: "", issueDate: "", dueDate: "", amount: null, debtor: null });

export const isConfirming = (agreement: Pick<Agreement, "kind">): boolean => agreement.kind === "Confirming";

/** The badge's classes (.is-nature-0 is factoring, .is-nature-1 confirming) */
export const kindClass = (kind: Agreement["kind"]) => `app-nature-badge is-nature-${kind === "Confirming" ? 1 : 0}`;

export const kindLabel = (kind: Agreement["kind"], tx: FactoringText) =>
  kind === "Confirming" ? tx("kind.confirming", "Confirming") : tx("kind.factoring", "Factoring");

/**
 * Do these name the same agreement? Ids are opaque: compared as they are, never parsed. The number
 * is the fallback, as nothing promises that a record's token is the same in every answer.
 */
export function sameContract(document: Pick<FactoringDocumentDto, "contractId" | "contractNumber">, agreement: Pick<Agreement, "id" | "number">): boolean {
  if (document.contractId && document.contractId === agreement.id) return true;
  return document.contractNumber !== null && document.contractNumber !== undefined && document.contractNumber === agreement.number;
}

/** The chosen agreement in a fresh list: undefined once it is no longer there */
export const findAgreement = (agreements: Agreement[] | undefined, chosen: Pick<Agreement, "id" | "number"> | null): Agreement | undefined =>
  chosen ? agreements?.find((a) => sameContract({ contractId: chosen.id, contractNumber: chosen.number }, a)) : undefined;

/** Only the kind this agreement asks for: debtors under factoring, suppliers under confirming */
const ofItsKind = (counterparties: Counterparty[] | undefined, agreement: Pick<Agreement, "kind">) =>
  (counterparties ?? []).filter((c) => c.kind === (isConfirming(agreement) ? "Supplier" : "Debtor"));

/** Those that can take invoices */
export const counterpartiesOf = (counterparties: Counterparty[] | undefined, agreement: Pick<Agreement, "kind">) =>
  ofItsKind(counterparties, agreement).filter((c) => (c.state ?? "Active") === "Active");

/** Those waiting for back-office activation. They have a tax number, but no name or entity yet. */
export const pendingCounterpartiesOf = (counterparties: Counterparty[] | undefined, agreement: Pick<Agreement, "kind">) =>
  ofItsKind(counterparties, agreement).filter((c) => c.state === "Pending");

const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Every word somewhere in the name, tax number or external number */
export function searchCounterparties(counterparties: Counterparty[], search: string): Counterparty[] {
  const words = normalize(search).split(/\s+/).filter(Boolean);
  return counterparties.filter((c) => {
    const text = normalize([c.name, c.taxNumber, c.externalNumber].filter(Boolean).join(" "));
    return words.every((word) => text.includes(word));
  });
}

/** Rounded to cents, so 0.1 + 0.2 isn't 0.30000000000000004. Blank amounts count as 0 while typing. */
export const totalOf = (documents: { amount?: number | null }[]): number =>
  documents.reduce((cents, d) => cents + Math.round((d.amount ?? 0) * 100), 0) / 100;

/** Total x advance %, read as 0-100; null when the agreement doesn't say (hidden, never 0) */
export const advanceOf = (total: number, advancePercentage: number | null | undefined): number | null =>
  advancePercentage === null || advancePercentage === undefined ? null : Math.round(total * advancePercentage) / 100;

/** null when an amount is missing: a guess would move money */
export function sumOfAmounts(documents: Pick<FactoringDocumentDto, "amount">[]): number | null {
  if (documents.length === 0 || documents.some((d) => d.amount === null || d.amount === undefined)) return null;
  return totalOf(documents);
}

/** What POST /cessions gets, without its correlationId. Each kind sends only its own party. */
export function buildCessionRequest(draft: RequestDraft, agreement: Agreement): Omit<NewFactoringCessionDto, "correlationId"> {
  const confirming = isConfirming(agreement);
  return {
    ...(confirming ? { supplierInterventionId: draft.supplier?.interventionId } : {}),
    documents: draft.documents.map((doc) => ({
      ...(confirming ? {} : { debtorInterventionId: doc.debtor?.interventionId }),
      invoiceNumber: doc.invoiceNumber.trim(),
      issueDate: doc.issueDate,
      dueDate: doc.dueDate,
      amount: doc.amount,
    })),
  };
}

export const DOCUMENT_STATUSES: FactoringDocumentStatus[] = ["Submitted", "Approved", "Financed", "Paid", "Overdue", "Attention", "Closed"];

export const STATUS_BADGES: Record<FactoringDocumentStatus, string> = {
  Submitted: "bg-secondary-subtle text-secondary-emphasis border-secondary-subtle",
  Approved: "bg-info-subtle text-info-emphasis border-info-subtle",
  Financed: "bg-primary-subtle text-primary-emphasis border-primary-subtle",
  Paid: "bg-success-subtle text-success-emphasis border-success-subtle",
  Overdue: "bg-danger-subtle text-danger-emphasis border-danger-subtle",
  Attention: "bg-warning-subtle text-warning-emphasis border-warning-subtle",
  Closed: "bg-body-tertiary text-body-secondary",
};

export const statusLabel = (status: FactoringDocumentStatus, tx: FactoringText): string =>
  ({
    Submitted: tx("status.submitted", "Submitted"),
    Approved: tx("status.approved", "Approved"),
    Financed: tx("status.financed", "Financed"),
    Paid: tx("status.paid", "Paid"),
    Overdue: tx("status.overdue", "Overdue"),
    Attention: tx("status.attention", "Attention"),
    Closed: tx("status.closed", "Closed"),
  })[status];
