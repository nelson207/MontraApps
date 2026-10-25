import type { InsightsFilters, InsightsPeriod } from "../insightsModel";

// Helpers for the apps' development samples (apps/<app>/insights.ts): numbers that look real,
// change with the filters, and stay the same for the same filters.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type SampleTools = {
  /** 0–1, deterministic for these filters */
  random: () => number;
  /** Size of the scope: 1 for everything, smaller for an organization / unit / member */
  scale: number;
  /** Length of the period relative to 12 months */
  periodShare: number;
  /** Labels of the trend points for the period (weeks or months, oldest first) */
  labels: string[];
  /** A whole number around `base` (±spread share), scaled by scope and period */
  around: (base: number, spread?: number) => number;
};

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash = (text: string) => [...text].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

function labelsFor(period: InsightsPeriod, now: Date): string[] {
  if (period === "30d" || period === "90d") {
    const weeks = period === "30d" ? 5 : 13;
    return Array.from({ length: weeks }, (_, i) => {
      const day = new Date(now);
      day.setDate(day.getDate() - (weeks - 1 - i) * 7);
      return `${day.getDate()} ${MONTHS[day.getMonth()]}`;
    });
  }
  const months = period === "12m" ? 12 : now.getMonth() + 1;
  return Array.from({ length: months }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return MONTHS[month.getMonth()];
  });
}

const PERIOD_SHARE: Record<InsightsPeriod, number> = { "30d": 1 / 12, "90d": 3 / 12, "12m": 1, ytd: 0 };

export function sampleTools(filters: InsightsFilters, now = new Date()): SampleTools {
  const random = mulberry32(hash(JSON.stringify(filters)));
  const scale = filters.memberId !== null ? 0.04 : filters.unitId !== null ? 0.12 : filters.organizationId !== null ? 0.35 : 1;
  const periodShare = filters.period === "ytd" ? (now.getMonth() + 1) / 12 : PERIOD_SHARE[filters.period];
  return {
    random,
    scale,
    periodShare,
    labels: labelsFor(filters.period, now),
    around: (base, spread = 0.25) => Math.max(0, Math.round(base * scale * periodShare * (1 - spread + random() * spread * 2))),
  };
}
