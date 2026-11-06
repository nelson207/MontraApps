import { amountLabel, equipmentModeOf, hasEquipment } from "../../model/business";
import type { CredOperDraft } from "../../model/credOperDraft";

export type FinancingFigures = {
  /** A calculation has run (there is a monthly payment) */
  calculated: boolean;
  monthly: number | null;
  financed: number | null;
  /** What's financed: the equipment, all vehicles (renting) or the loan */
  base: number | null;
  baseLabel: string;
  initialEntry: number | null;
  initialEntryPercentage: number | null;
  term: number | null;
  tan: number | null;
  taeg: number | null;
  /** All the customer pays, as the API works it out */
  total: number | null;
};

/** The operation's financing as it stands (Summary: read-only, no recalculation). */
export function financingFigures(op: CredOperDraft): FinancingFigures {
  const condition = op.conditions?.[0];
  const first = op.assets?.[0]?.equipment;
  const renting = equipmentModeOf(op) === "multiple";
  const monthly = condition?.flows?.[0]?.amount ?? null;

  return {
    calculated: monthly != null,
    monthly,
    financed: op.amount ?? null,
    base: renting ? (op.assets ?? []).reduce((sum, a) => sum + (a.equipment?.netAmount ?? 0), 0) : (first?.netAmount ?? null),
    baseLabel: renting ? "Total of the vehicles" : amountLabel(op),
    initialEntry: first?.retakeAmount ?? null,
    initialEntryPercentage: first?.retakePercentage ?? null,
    term: condition?.term ?? null,
    tan: condition?.implicitRate ?? null,
    taeg: condition?.annualRate ?? null,
    total: condition?.totalAmountChargedToCustomer ?? null,
  };
}

const cents = (value: number) => Math.round(value * 100) / 100;

export type PaymentBreakdown = {
  entry: number;
  /** The part of the equipment that's financed */
  asset: number;
  /** What's financed beyond the equipment (fees, insurance…): worked out, the API doesn't list it */
  costs: number;
  total: number;
};

/**
 * How one piece of equipment is paid: its initial entry and what's financed. Null when that can't
 * be told: no equipment or amount yet, renting (the entry is one vehicle's, the amount all of them),
 * or parts that don't reach the equipment's amount.
 */
export function paymentBreakdown(op: CredOperDraft): PaymentBreakdown | null {
  const equipment = op.assets?.[0]?.equipment;
  const net = equipment?.netAmount;
  const financed = op.amount;
  if (!hasEquipment(op) || equipmentModeOf(op) === "multiple" || !net || !financed) return null;
  const entry = equipment?.retakeAmount ?? 0;
  const asset = cents(net - entry);
  const costs = cents(entry + financed - net);
  if (asset < 0 || costs < 0) return null;
  return { entry, asset, costs, total: cents(entry + financed) };
}

/** The deal in a sentence, with what's known of it. Null without an amount to talk about. */
export function dealSentence(
  { amount, term, thing, customer }: { amount?: number | null; term?: number | null; thing?: string | null; customer?: string | null },
  format: (value: number) => string,
): string | null {
  if (amount == null) return null;
  const parts = [
    format(amount),
    term != null ? `over ${term} months` : null,
    thing ? `to finance ${thing}` : null,
    customer ? `for ${customer}` : null,
  ];
  return `${parts.filter(Boolean).join(" ")}.`;
}
