import type { SymbolLimit } from "@platform/api/legacy/legacyApi";

export function buildTermTicks(restrictions: SymbolLimit): number[] {
  const min = restrictions.minValue ?? 12;
  const max = restrictions.maxValue ?? 120;
  const step = restrictions.stepValue ?? 12;

  const values: number[] = [];
  for (let t = min; t <= max; t += step) values.push(t);
  return values;
}
