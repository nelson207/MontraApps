import type { NewStockUnitDto, StockContractDto } from "@platform/api/generated/MontraPOSApi";
import type { EquipmentValue } from "@platform/features/equipment/equipmentModel";

// A new stock unit: one vehicle financed on one of the dealer's contracts. The contract already
// sets the terms, so a unit only needs the vehicle, the amount, the supplier and its invoice.
// The vehicle is the equipment detail shared with Montra Credit (platform/features/equipment), plus the VIN.

export type StockUnitDraft = {
  contract: StockContractDto | null;
  equipment: EquipmentValue;
  amount: number | null;
  /** The supplier chosen, when the contract has more than one */
  supplierInterventionId: string | null;
  invoiceNumber: string;
};

export const emptyStockUnit = (contract: StockContractDto | null = null): StockUnitDraft => ({
  contract,
  equipment: {},
  amount: null,
  supplierInterventionId: null,
  invoiceNumber: "",
});

/** The contract's only supplier, otherwise the one chosen */
export function supplierIdOf(draft: Pick<StockUnitDraft, "contract" | "supplierInterventionId">): string | null {
  const suppliers = draft.contract?.suppliers ?? [];
  if (suppliers.length === 1) return suppliers[0].interventionId ?? null;
  return draft.supplierInterventionId;
}

const textOrNull = (text: string | null | undefined) => text?.trim() || null;

/**
 * The POST body. Its equipment is the API's EquipmentDto, the same object as Credit's, so the shared
 * equipment detail's names change the same way (see Credit's credOperMapping.ts). Only here: the VIN
 * is its serial number and the km travel next to it.
 */
export function toNewStockUnit(draft: StockUnitDraft, correlationId: string): NewStockUnitDto {
  const { equipment } = draft;
  return {
    correlationId,
    supplierInterventionId: supplierIdOf(draft),
    amount: draft.amount,
    invoiceNumber: draft.invoiceNumber.trim(),
    km: equipment.odometer ?? null,
    equipment: {
      equipmentTypeId: equipment.equipmentTypeId ?? null,
      equipmentCategoryId: equipment.equipmentCategoryId ?? null,
      equipmentStateId: equipment.equipmentStateId ?? null,
      equipmentBrand: textOrNull(equipment.brand),
      equipmentModel: textOrNull(equipment.model),
      equipVersion: textOrNull(equipment.version),
      serialNumber: textOrNull(equipment.vin)?.toUpperCase() ?? null,
      licencePlate: textOrNull(equipment.licencePlate),
      equipYear: equipment.equipYear ?? null,
      equipMonth: equipment.equipMonth ?? null,
      descr: textOrNull(equipment.description),
      engineSize: equipment.enginesize ?? null,
      numOfDoors: equipment.doors ?? null,
    },
  };
}

/** Today in local time, yyyy-mm-dd */
export const todayLocal = (now = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
