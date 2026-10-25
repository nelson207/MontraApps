import { availableOf, formatEuro, type Agreement, type StockUnitDraft } from "./stockUnit";

// The two steps of a new stock unit, validated before moving on. Keys are the fields' paths
// (the equipment's as `equipment.<field>`, like the shared equipment detail names them).
export type StockErrors = Partial<Record<string, string>>;

const VIN = /^[A-HJ-NPR-Z0-9]{17}$/i;
const INVOICE_MAX = 30;

const blank = (text: string | null | undefined) => !text?.trim();

/** Equipment fields Stock Credit requires (the rest of the shared equipment detail is optional) */
export const REQUIRED_EQUIPMENT = ["brand", "model", "equipmentTypeId", "equipmentStateId", "vin"] as const;

/** Step 1: the agreement, the equipment detail and the amount to finance */
export function validateContractStep(draft: StockUnitDraft, agreement: Agreement | undefined, today: string): StockErrors {
  const errors: StockErrors = {};
  const { equipment, amount } = draft;

  if (draft.agreementId === null || !agreement) errors.agreement = "Select an agreement.";

  if (blank(equipment.brand)) errors["equipment.brand"] = "Select the brand.";
  if (blank(equipment.model)) errors["equipment.model"] = "Select the model.";
  if (equipment.equipmentTypeId == null) errors["equipment.equipmentTypeId"] = "Select the equipment type.";
  if (equipment.equipmentStateId == null) errors["equipment.equipmentStateId"] = "Select the equipment state.";
  else if (agreement && !agreement.equipmentStateIds.includes(equipment.equipmentStateId))
    errors["equipment.equipmentStateId"] = "This agreement doesn't finance vehicles in this state.";
  if (!VIN.test(equipment.vin?.trim() ?? "")) errors["equipment.vin"] = "17 characters, letters and digits (no I, O or Q).";
  if (equipment.registrationDate && equipment.registrationDate.slice(0, 10) > today)
    errors["equipment.registrationDate"] = "The registration date can't be in the future.";

  if (amount === null || !(amount > 0)) errors.amount = "Enter the amount to finance.";
  else if (agreement) {
    if (amount > agreement.maxPerUnit) errors.amount = `Up to ${formatEuro(agreement.maxPerUnit)} per vehicle on this agreement.`;
    else if (amount > availableOf(agreement)) errors.amount = `Only ${formatEuro(availableOf(agreement))} available on this agreement.`;
  }

  return errors;
}

/** Step 2: the supplier and its invoice */
export function validateInvoiceStep(draft: StockUnitDraft): StockErrors {
  const errors: StockErrors = {};
  if (!draft.supplier) errors.supplier = "Select the supplier.";
  if (blank(draft.invoiceNumber)) errors.invoiceNumber = "Enter the invoice number.";
  else if (draft.invoiceNumber.trim().length > INVOICE_MAX) errors.invoiceNumber = `Up to ${INVOICE_MAX} characters.`;
  return errors;
}
