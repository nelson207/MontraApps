// Invoice financing under an agreement with a financial company. The agreement's nature decides
// who the invoices are on:
//   factoring  (nature 0): my customers' invoices — each one has its own debtor
//   confirming (nature 1): one supplier's invoices — chosen once, every invoice is theirs

export const NATURE_FACTORING = 0;
export const NATURE_CONFIRMING = 1;
export type AgreementNature = typeof NATURE_FACTORING | typeof NATURE_CONFIRMING;

export const NATURE_LABELS: Record<AgreementNature, string> = { 0: "Factoring", 1: "Confirming" };

/** A company: a debtor (factoring) or the supplier (confirming) */
export type Entity = { id: number; name: string; taxNumber: string; city?: string };

export type FactoringAgreement = {
  id: number;
  number: string;
  financialCompany: string;
  nature: AgreementNature;
  creditLimit: number;
  /** Already financed (open documents) */
  used: number;
  /** Share of each invoice advanced, % */
  advancePercent: number;
  /** Latest due date, in days from today */
  maxTermDays: number;
  /** Annual rate, % */
  rate: number;
};

export type FactoringDocument = {
  /** Client-side key for the list */
  key: string;
  invoiceNumber: string;
  /** yyyy-mm-dd */
  issueDate: string;
  /** yyyy-mm-dd */
  dueDate: string;
  amount: number | null;
  /** Factoring only; under confirming the debtor is not asked */
  debtor: Entity | null;
};

export type FactoringDraft = {
  agreementId: number | null;
  /** Confirming only */
  supplier: Entity | null;
  documents: FactoringDocument[];
};

export const emptyDocument = (key: string, debtor: Entity | null = null): FactoringDocument => ({
  key,
  invoiceNumber: "",
  issueDate: "",
  dueDate: "",
  amount: null,
  debtor,
});

export const emptyFactoringDraft = (): FactoringDraft => ({ agreementId: null, supplier: null, documents: [] });

export const isConfirming = (agreement: FactoringAgreement): boolean => agreement.nature === NATURE_CONFIRMING;

/** What is left of the agreement's limit */
export const availableOf = (agreement: FactoringAgreement): number => Math.max(0, agreement.creditLimit - agreement.used);

/** Sum of the invoices' amounts (blank ones count as 0) */
export const totalOf = (documents: FactoringDocument[]): number =>
  Math.round(documents.reduce((sum, d) => sum + (d.amount ?? 0), 0) * 100) / 100;

/** What the financial company advances on that total */
export const advanceOf = (total: number, agreement: FactoringAgreement): number =>
  Math.round(total * agreement.advancePercent) / 100;

/** yyyy-mm-dd plus `days` */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** Today in local time, yyyy-mm-dd */
export const todayLocal = (now = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const EURO = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const EURO_CENTS = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

/** €25,000 · €2,500.50 */
export const formatEuro = (value: number): string => (Number.isInteger(value) ? EURO : EURO_CENTS).format(value);
