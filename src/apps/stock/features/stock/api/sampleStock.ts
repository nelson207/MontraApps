import { delay, sampleSeed } from "@platform/api/devFallback";
import { sampleUnitsOf } from "@platform/features/workContext/api/sampleHierarchy";
import type { Agreement, StockUnitDraft } from "../model/stockUnit";
import type { StockUnit, StockUnitStatus } from "./stockApi";

// Development-only stand-ins for the stock endpoints: three agreements per credit intermediary
// and a few dozen units, plus the ones created in this session (kept in memory).

const COMPANIES = ["Banco Atlântico", "Lusa Financeira", "Crédito Norte"];

const VEHICLES = [
  ["Renault", "Clio", "1.0 TCe Evolution"],
  ["Peugeot", "208", "1.2 PureTech Active"],
  ["Volkswagen", "Golf", "2.0 TDI Life"],
  ["BMW", "Série 1", "116d Advantage"],
  ["Mercedes-Benz", "Classe A", "A 180 d Style"],
  ["Toyota", "Yaris", "1.5 Hybrid Comfort"],
  ["SEAT", "Ibiza", "1.0 TSI FR"],
  ["Tesla", "Model 3", "Long Range AWD"],
] as const;

const STATUSES: StockUnitStatus[] = ["funded", "funded", "funded", "approved", "submitted", "overdue", "settled", "settled"];

export function sampleAgreements(intermediaryId: string): Agreement[] {
  const seed = sampleSeed(intermediaryId);
  return COMPANIES.map((financialCompany, i) => {
    const creditLimit = [750_000, 400_000, 250_000][i];
    return {
      id: seed * 10 + i + 1,
      number: `STK-${String(seed).padStart(3, "0")}-${i + 1}`,
      financialCompany,
      creditLimit,
      // The third one is almost used up, to see the limits at work
      used: i === 2 ? creditLimit - 18_000 : Math.round(creditLimit * (0.35 + ((seed * 7 + i * 13) % 40) / 100)),
      maxPerUnit: [60_000, 45_000, 35_000][i],
      termDays: [180, 120, 90][i],
      rate: [4.25, 4.9, 5.4][i],
      // Equipment states (sample codes): 1 new, 2 used, 3 demonstration
      equipmentStateIds: i === 1 ? [1] : [1, 2, 3],
    };
  });
}

const isoDay = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

/** Created in this session, per intermediary */
const created = new Map<string, StockUnit[]>();

function seeded(intermediaryId: string): StockUnit[] {
  const seed = sampleSeed(intermediaryId);
  const agreements = sampleAgreements(intermediaryId);
  const suppliers = sampleUnitsOf(intermediaryId).slice(0, 6);
  return Array.from({ length: 36 }, (_, i) => {
    const [brand, model, version] = VEHICLES[(i * 5) % VEHICLES.length];
    const agreement = agreements[i % agreements.length];
    const status = STATUSES[(i * 3 + seed) % STATUSES.length];
    const age = 4 + ((i * 17) % 150);
    return {
      id: seed * 1000 + i + 1,
      reference: `SU-${String(seed).padStart(3, "0")}-${String(i + 1).padStart(4, "0")}`,
      vehicle: `${brand} ${model} ${version}`,
      vin: `VF1${String(seed).padStart(3, "0")}X${String(100_000_000 + i * 7919).slice(-9)}`.slice(0, 17),
      licencePlate: i % 3 === 0 ? null : `${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(66 + (i % 24))}-${String(10 + (i % 89)).padStart(2, "0")}-${String.fromCharCode(67 + (i % 23))}D`,
      supplier: suppliers[i % suppliers.length],
      agreementNumber: agreement.number,
      financialCompany: agreement.financialCompany,
      amount: 9_000 + ((i * 3_571) % 38_000),
      invoiceNumber: `FT ${2026}/${String(300 + i * 11)}`,
      fundedOn: status === "submitted" ? null : isoDay(-age),
      dueOn: status === "submitted" ? null : isoDay(agreement.termDays - age),
      status,
    };
  });
}

export async function sampleStockUnits(intermediaryId: string): Promise<StockUnit[]> {
  await delay(250);
  return [...(created.get(intermediaryId) ?? []), ...seeded(intermediaryId)];
}

export async function sampleCreateStockUnit(
  intermediaryId: string,
  draft: StockUnitDraft,
  agreement: Agreement,
): Promise<StockUnit> {
  await delay(400);
  const seed = sampleSeed(intermediaryId);
  const n = (created.get(intermediaryId)?.length ?? 0) + 1;
  const { brand, model, version, vin, licencePlate } = draft.equipment;
  const unit: StockUnit = {
    id: seed * 1_000_000 + n,
    reference: `SU-${String(seed).padStart(3, "0")}-N${String(n).padStart(3, "0")}`,
    vehicle: [brand, model, version].filter(Boolean).join(" "),
    vin: (vin ?? "").toUpperCase(),
    licencePlate: licencePlate || null,
    supplier: draft.supplier!,
    agreementNumber: agreement.number,
    financialCompany: agreement.financialCompany,
    amount: draft.amount ?? 0,
    invoiceNumber: draft.invoiceNumber.trim(),
    fundedOn: null,
    dueOn: null,
    status: "submitted",
  };
  created.set(intermediaryId, [unit, ...(created.get(intermediaryId) ?? [])]);
  return unit;
}
