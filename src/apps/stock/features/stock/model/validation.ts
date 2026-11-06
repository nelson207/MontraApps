import { isUsedEquipmentState, isValidVehicleMonth, isValidVehicleYear, vehicleFieldsRequired } from "@platform/features/equipment/equipmentModel";
import { currentLanguage } from "@platform/i18n/i18n";
import { tx } from "../stockText";
import { formatMoney } from "./format";
import { supplierIdOf, type StockUnitDraft } from "./stockUnit";

// The two steps of a new stock unit, validated before moving on. Keys are the fields' paths
// (the equipment's as `equipment.<field>`, like the shared equipment detail names them).
export type StockErrors = Partial<Record<string, string>>;

const VIN_LENGTH = 17;
const INVOICE_MAX = 30;

const blank = (text: string | null | undefined) => !text?.trim();

/** Equipment fields the screen requires (the rest of the shared equipment detail is optional) */
export const isRequiredEquipment = (field: string, stateId: number | null | undefined): boolean =>
  field === "vin" || (vehicleFieldsRequired(stateId) as string[]).includes(field);

/** An empty (or missing) list means the contract doesn't restrict the option */
export const isAllowed = (allowed: number[] | null | undefined, id: number): boolean => !allowed?.length || allowed.includes(id);

/** Step 1: the contract, the equipment detail and the amount to finance */
export function validateContractStep(draft: StockUnitDraft, today: string): StockErrors {
  const errors: StockErrors = {};
  const { equipment, amount, contract } = draft;

  if (!contract) errors.contract = tx("validation.contract", "Select an agreement.");

  if (blank(equipment.brand)) errors["equipment.brand"] = tx("validation.brand", "Select the brand.");
  if (blank(equipment.model)) errors["equipment.model"] = tx("validation.model", "Select the model.");
  if (blank(equipment.version)) errors["equipment.version"] = tx("validation.version", "Select the version.");
  if (equipment.equipmentCategoryId == null) errors["equipment.equipmentCategoryId"] = tx("validation.category", "Select the equipment category.");
  if (equipment.equipmentTypeId == null) errors["equipment.equipmentTypeId"] = tx("validation.type", "Select the equipment type.");
  else if (!isAllowed(contract?.equipmentTypeIds, equipment.equipmentTypeId))
    errors["equipment.equipmentTypeId"] = tx("validation.typeNotAllowed", "This agreement doesn't finance this equipment type.");
  if (equipment.equipmentStateId == null) errors["equipment.equipmentStateId"] = tx("validation.state", "Select the equipment state.");
  else if (!isAllowed(contract?.equipmentStateIds, equipment.equipmentStateId))
    errors["equipment.equipmentStateId"] = tx("validation.stateNotAllowed", "This agreement doesn't finance vehicles in this state.");
  if ((equipment.vin?.trim().length ?? 0) !== VIN_LENGTH) errors["equipment.vin"] = tx("validation.vin", "The VIN has exactly 17 characters.");
  const { equipYear: year, equipMonth: month } = equipment;
  if (year == null) errors["equipment.equipYear"] = tx("validation.year", "Enter the year.");
  else if (!isValidVehicleYear(year, today)) errors["equipment.equipYear"] = tx("validation.yearInvalid", "Enter a valid year.");
  if (month == null) {
    if (isUsedEquipmentState(equipment.equipmentStateId)) errors["equipment.equipMonth"] = tx("validation.month", "Enter the month.");
  } else if (!isValidVehicleMonth(month)) errors["equipment.equipMonth"] = tx("validation.monthInvalid", "Enter a month from 1 to 12.");

  if (amount === null || !(amount > 0)) errors.amount = tx("validation.amount", "Enter an amount above zero.");
  else if (contract?.maxPerVehicle != null && amount > contract.maxPerVehicle)
    errors.amount = tx("validation.amountMax", "Up to {{max}} per vehicle on this agreement.", {
      max: formatMoney(contract.maxPerVehicle, contract.currencyId, currentLanguage()) ?? "",
    });

  return errors;
}

/** Step 2: the supplier (required when the contract has more than one) and its invoice */
export function validateInvoiceStep(draft: StockUnitDraft): StockErrors {
  const errors: StockErrors = {};
  if ((draft.contract?.suppliers?.length ?? 0) > 1 && !supplierIdOf(draft)) errors.supplier = tx("validation.supplier", "Select the supplier.");
  if (blank(draft.invoiceNumber)) errors.invoiceNumber = tx("validation.invoice", "Enter the invoice number.");
  else if (draft.invoiceNumber.trim().length > INVOICE_MAX)
    errors.invoiceNumber = tx("validation.invoiceMax", "Up to {{max}} characters.", { max: INVOICE_MAX });
  return errors;
}
