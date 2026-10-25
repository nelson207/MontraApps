import type { EquipmentValue } from "@platform/features/equipment/equipmentModel";
import type { HierarchyNode } from "@platform/features/workContext/hierarchy";

// A stock unit: a vehicle the supplier has in stock, financed (factored) under one of the credit
// intermediary's agreements with a financial company. No quotation or proposal: the agreement
// already sets the terms, so a unit only needs the vehicle, the amount and the supplier's invoice.
// The vehicle is the equipment detail shared with Montra Credit (platform/features/equipment), plus the VIN.

/** A credit line agreed between the credit intermediary and a financial company */
export type Agreement = {
  id: number;
  number: string;
  financialCompany: string;
  creditLimit: number;
  /** Already financed (open stock units) */
  used: number;
  /** Highest amount for one vehicle */
  maxPerUnit: number;
  /** Days a unit can stay financed */
  termDays: number;
  /** Annual rate, % */
  rate: number;
  /** Equipment states it finances (equipment state codes, e.g. new and used) */
  equipmentStateIds: number[];
};

export type StockUnitDraft = {
  agreementId: number | null;
  equipment: EquipmentValue;
  amount: number | null;
  supplier: HierarchyNode | null;
  invoiceNumber: string;
};

export const emptyStockUnit = (supplier: HierarchyNode | null = null): StockUnitDraft => ({
  agreementId: null,
  equipment: {},
  amount: null,
  supplier,
  invoiceNumber: "",
});

/** What is left of the agreement's credit limit */
export const availableOf = (agreement: Agreement): number => Math.max(0, agreement.creditLimit - agreement.used);

/** The most one vehicle can take now: the available amount, capped by the per-vehicle limit */
export const amountLimitOf = (agreement: Agreement): number => Math.min(availableOf(agreement), agreement.maxPerUnit);

const EURO = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** €25,000 */
export const formatEuro = (value: number): string => EURO.format(value);

/** Today in local time, yyyy-mm-dd */
export const todayLocal = (now = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
