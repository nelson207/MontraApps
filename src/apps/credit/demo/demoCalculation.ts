import type { CredOperDto } from "@platform/api/legacy/legacyApi";

// DEVELOPMENT ONLY: the demo backend's stand-in for CalculateOperations — a plain annuity on the
// financed amount at the product's rate (TAN), with an indicative TAEG. Not the real pricing.

const RENTING = 13;

/** Monthly payment of `amount` over `months` at `annualRate` % (rounded to cents) */
export function monthlyPayment(amount: number, annualRate: number, months: number): number {
  if (!(amount > 0) || !(months > 0)) return 0;
  const r = annualRate / 100 / 12;
  const payment = r === 0 ? amount / months : (amount * r) / (1 - (1 + r) ** -months);
  return Math.round(payment * 100) / 100;
}

/** The operation as the API would return it after a calculation */
export function demoCalculate(op: CredOperDto): CredOperDto {
  const assets = op.assets ?? [];
  const first = assets[0]?.equipment;
  // Renting finances every vehicle; otherwise the equipment (or the loan) amount
  const base =
    op.aplBusinessId === RENTING
      ? assets.reduce((sum, a) => sum + (a.equipment?.netAmount ?? 0), 0)
      : (first?.netAmount ?? op.amount ?? 0);
  const financed = Math.max(0, base - (first?.retakeAmount ?? 0));

  const [condition = {}, ...others] = op.conditions ?? [];
  const term = condition.term ?? 60;
  const tan = condition.implicitRate ?? 7.9;
  const monthly = monthlyPayment(financed, tan, term);
  // Indicative: fees and the rest of the costs on top of the rate
  const taeg = Math.round((tan + 1.6 + (term < 36 ? 0.8 : 0)) * 10) / 10;

  return {
    ...op,
    amount: financed,
    conditions: [
      {
        ...condition,
        term,
        implicitRate: tan,
        annualRate: taeg,
        flows: [{ amount: monthly, numOfRepetitions: term }],
      },
      ...others,
    ],
  };
}
