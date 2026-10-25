import { equipmentModeOf, hasEquipment } from "../../model/business";
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
    baseLabel: renting ? "Total of the vehicles" : hasEquipment(op) ? "Equipment amount" : "Loan amount",
    initialEntry: first?.retakeAmount ?? null,
    initialEntryPercentage: first?.retakePercentage ?? null,
    term: condition?.term ?? null,
    tan: condition?.implicitRate ?? null,
    taeg: condition?.annualRate ?? null,
  };
}
