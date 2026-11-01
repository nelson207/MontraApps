import type { CredOperDto, EquipmentDto, FinConditionDto } from "@platform/api/legacy/legacyApi";
import { isEmptyValue } from "../validation/fieldRules";
import { retakeBaseOf, withAssetAmount, withRetakeAmount, withRetakeInLine } from "./business";

// A new financial product brings its defaults (POST /api/financial-products/defaults). The
// amounts the user sees and types (Financing fields) are only replaced without asking when they
// are blank or already the same: a value the user has that the product would change is asked
// about, field by field (ProductDefaultsPrompt).

// The initial entry is defaulted by its percentage: its amount (what's sent) follows it.

export type DefaultedField = "netAmount" | "retakePercentage" | "term";

type FieldAccess = {
  label: string;
  unit: string;
  get: (op: CredOperDto) => number | null | undefined;
  set: (op: CredOperDto, value: number | null | undefined) => CredOperDto;
};

/** `op` with the first vehicle's `name` set */
const withEquipment = (op: CredOperDto, name: keyof EquipmentDto, value: number | null | undefined): CredOperDto => {
  const [first, ...rest] = op.assets ?? [];
  return { ...op, assets: [{ ...first, equipment: { ...first?.equipment, [name]: value } }, ...rest] };
};

/** `op` with the first condition's `name` set */
const withCondition = (op: CredOperDto, name: keyof FinConditionDto, value: number | null | undefined): CredOperDto => {
  const [first, ...rest] = op.conditions ?? [];
  return { ...op, conditions: [{ ...first, [name]: value }, ...rest] };
};

const equipmentField = (name: "netAmount" | "retakePercentage", label: string, unit: string): FieldAccess => ({
  label,
  unit,
  get: (op) => op.assets?.[0]?.equipment?.[name],
  set: (op, value) => withEquipment(op, name, value),
});

/** The on-screen values a product's defaults may change, in the order of the form */
export const DEFAULTED_FIELDS: Record<DefaultedField, FieldAccess> = {
  // With the amounts it fills (withAssetAmount)
  netAmount: { ...equipmentField("netAmount", "Equipment amount", "€"), set: (op, value) => ({ ...op, assets: withAssetAmount(op, 0, value) }) },
  // The amount is set from it once the rest is settled (withRetakeSettled)
  retakePercentage: equipmentField("retakePercentage", "Initial entry percentage", "%"),
  term: {
    label: "Term",
    unit: "months",
    get: (op) => op.conditions?.[0]?.term,
    set: (op, value) => withCondition(op, "term", value),
  },
};

/** A value on screen the new product's default would change */
export type DefaultConflict = { field: DefaultedField; current: number; proposed: number };

/**
 * The product's `defaults` (the answer, merged over the draft) split against the `current`
 * draft: `silent` is the answer with every value on screen the product would change kept as it
 * is; `conflicts` are those values, to ask about.
 */
export function splitProductDefaults(current: CredOperDto, defaults: CredOperDto) {
  // Compared by the percentage: the user's entry with only its amount gets it; the product's
  // percentage sets its amount (or, with none, its amount sets it)
  if (current.assets?.[0]?.equipment?.retakePercentage == null) current = withRetakeInLine(current);
  defaults = withRetakeInLine(defaults);
  const conflicts: DefaultConflict[] = [];
  let silent = defaults;
  for (const [field, access] of Object.entries(DEFAULTED_FIELDS) as [DefaultedField, FieldAccess][]) {
    const value = access.get(current);
    const proposed = access.get(defaults);
    if (isEmptyValue(value) || value === proposed) continue;
    // No default for it: what the user has stays, nothing to ask
    if (!isEmptyValue(proposed)) conflicts.push({ field, current: value!, proposed: proposed! });
    silent = access.set(silent, value);
  }
  return { silent: withRetakeSettled(silent, current), conflicts };
}

/** `op` with the defaults the user accepted */
export const withAcceptedDefaults = (op: CredOperDto, accepted: DefaultConflict[]): CredOperDto =>
  withRetakeSettled(
    accepted.reduce((out, c) => DEFAULTED_FIELDS[c.field].set(out, c.proposed), op),
    op,
  );

/**
 * `op` with the initial entry amount of its (settled) percentage and base: `before`'s amount when
 * neither changed (the user's, not one rounded back from its percentage)
 */
function withRetakeSettled(op: CredOperDto, before: CredOperDto): CredOperDto {
  const percentage = op.assets?.[0]?.equipment?.retakePercentage;
  const kept = percentage === before.assets?.[0]?.equipment?.retakePercentage && retakeBaseOf(op) === retakeBaseOf(before);
  return kept ? withRetakeAmount(op, before.assets?.[0]?.equipment?.retakeAmount) : withRetakeInLine(op);
}
