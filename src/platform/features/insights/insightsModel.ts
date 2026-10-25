// Insights dashboards (every Montra app: Credit's commercial resume, Lawyer's legal actions):
// the data shape an app returns and the pure helpers the charts use.

export type ValueFormat = "number" | "currency" | "percent";

export type InsightsPeriod = "30d" | "90d" | "12m" | "ytd";

export const PERIODS: { id: InsightsPeriod; label: string }[] = [
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "12m", label: "Last 12 months" },
  { id: "ytd", label: "Year to date" },
];

/** Scope of the board: the working-context levels (null = all) and the period */
export type InsightsFilters = {
  organizationId: string | null;
  unitId: string | null;
  memberId: string | null;
  period: InsightsPeriod;
};

export type Kpi = {
  id: string;
  label: string;
  value: number;
  /** Same measure in the previous period of the same length */
  previous: number;
  format: ValueFormat;
  /** Whether a rise is good news (drives the delta colour) */
  upIsGood: boolean;
  /** Values over the period, oldest first (sparkline) */
  trend: number[];
};

/** Part-to-whole: e.g. quotations by state (counts unless `format` says otherwise) */
export type Breakdown = {
  id: string;
  title: string;
  subtitle?: string;
  format?: ValueFormat;
  segments: { label: string; value: number }[];
};

/** Ordered stages, each a subset of the previous one */
export type Funnel = { title: string; subtitle?: string; stages: { label: string; value: number }[] };

/** Several series over the same time points (one axis; counts unless `format` says otherwise) */
export type Trend = {
  title: string;
  subtitle?: string;
  format?: ValueFormat;
  labels: string[];
  series: { label: string; values: number[] }[];
};

/** Nominal categories by one measure, biggest first */
export type Ranking = { title: string; subtitle?: string; format: ValueFormat; rows: { label: string; value: number }[] };

/** Dated items coming up (e.g. hearings) */
export type Upcoming = { title: string; rows: { id: string; title: string; detail: string; date: string }[] };

export type InsightsData = {
  kpis: Kpi[];
  breakdowns: Breakdown[];
  funnel?: Funnel;
  trend: Trend;
  ranking?: Ranking;
  upcoming?: Upcoming;
};

const trimZero = (text: string) => text.replace(/\.0(?=[KM]?$)/, "");

const compact = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return trimZero(`${(value / 1_000_000).toFixed(1)}M`);
  if (abs >= 10_000) return trimZero(`${(value / 1_000).toFixed(1)}K`);
  return Math.round(value).toLocaleString("en-US");
};

/** 1,284 · 12.9K · €4.2M · 37.3% */
export function formatValue(value: number, format: ValueFormat): string {
  switch (format) {
    case "currency":
      return `€${compact(value)}`;
    case "percent":
      return `${value.toFixed(1)}%`;
    default:
      return compact(value);
  }
}

export type Change = { text: string; direction: "up" | "down" | "flat"; good: boolean | null };

/** Signed change vs the previous period (points for percentages); null without a base */
export function changeOf(value: number, previous: number, upIsGood: boolean, format: ValueFormat = "number"): Change | null {
  if (format !== "percent" && previous === 0) return null;
  const diff = format === "percent" ? Math.round((value - previous) * 10) / 10 : Math.round(((value - previous) / previous) * 100);
  const unit = format === "percent" ? " pp" : "%";
  if (diff === 0) return { text: `0${unit}`, direction: "flat", good: null };
  const direction = diff > 0 ? "up" : "down";
  return {
    text: `${diff > 0 ? "+" : "−"}${Math.abs(diff)}${unit}`,
    direction,
    good: direction === "up" ? upIsGood : !upIsGood,
  };
}

/** Whole percentages of the total that always add up to 100 (largest remainder) */
export function sharesOf(values: number[]): number[] {
  const total = values.reduce((sum, v) => sum + v, 0);
  if (total === 0) return values.map(() => 0);
  const exact = values.map((v) => (v / total) * 100);
  const shares = exact.map(Math.floor);
  let missing = 100 - shares.reduce((sum, v) => sum + v, 0);
  const order = exact.map((v, i) => ({ i, rest: v - Math.floor(v) })).sort((a, b) => b.rest - a.rest || a.i - b.i);
  for (const { i } of order) {
    if (missing <= 0) break;
    shares[i] += 1;
    missing -= 1;
  }
  return shares;
}

/** A clean axis: max rounded up to a 1 / 2 / 2.5 / 5 step, with 3–5 ticks from 0 */
export function niceScale(max: number): { max: number; ticks: number[] } {
  if (max <= 0) return { max: 1, ticks: [0, 1] };
  const rough = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((n) => n * magnitude).find((s) => s >= rough)!;
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => Math.round(i * step * 1000) / 1000);
  return { max: top, ticks };
}

/** Share of the previous stage, % with one decimal */
export function conversion(value: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round((value / previous) * 1000) / 10;
}
