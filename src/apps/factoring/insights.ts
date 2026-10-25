import type { InsightsConfig } from "@platform/features/insights/insightsConfig";
import type { Kpi } from "@platform/features/insights/insightsModel";

// Montra Factoring's dashboards: the financed invoices, the agreements' usage, the maturity of what
// is outstanding, the biggest debtors and the invoices coming due (the "Factoring" tab).

const YEARLY_DOCUMENTS = 9_000;
const AVERAGE_AMOUNT = 6_800;

const COMPANIES = ["Banco Atlântico", "Lusa Financeira", "Crédito Norte"];
const DEBTORS = [
  "Construtora Norte, Lda.",
  "Hotel Mar Azul, S.A.",
  "Transportes Lusos, Lda.",
  "Têxteis do Ave, S.A.",
  "Metalúrgica Central, Lda.",
  "Vinhos do Douro, S.A.",
  "Logística Atlântica, Lda.",
  "Agro Alentejo, S.A.",
];

const isoDay = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const INSIGHTS: InsightsConfig = {
  tab: { label: "Factoring", icon: "bi-receipt" },
  // TODO: placeholder endpoint (not exposed by the backend yet)
  url: "/api/Insights/Factoring",
  sample: (_filters, { around, random, labels, scale }) => {
    const financed = around(YEARLY_DOCUMENTS);
    const collected = Math.round(financed * (0.9 + random() * 0.12));
    const submitted = Math.round(financed * (1.05 + random() * 0.06));
    const approved = Math.round(financed * (1.01 + random() * 0.03));
    // Outstanding now: independent of the period, scoped by the filters
    const open = Math.max(1, Math.round(2_300 * scale * (0.9 + random() * 0.2)));
    const outstanding = Math.round(open * AVERAGE_AMOUNT * (0.9 + random() * 0.2));
    const usage = Math.round((62 + random() * 25) * 10) / 10;
    const daysToDue = Math.round(38 + random() * 25);
    const overdue = Math.round(outstanding * (0.03 + random() * 0.04));

    const spread = (total: number) => {
      const weights = labels.map(() => 0.75 + random() * 0.5);
      const sum = weights.reduce((a, b) => a + b, 0);
      return weights.map((w) => Math.round((total * w) / sum));
    };
    const financedTrend = spread(financed);
    const collectedTrend = spread(collected);

    const kpi = (id: string, label: string, value: number, format: Kpi["format"], upIsGood: boolean, trend: number[]): Kpi => ({
      id,
      label,
      value,
      previous: format === "percent" ? value - 3 + random() * 6 : Math.round(value * (0.85 + random() * 0.3)),
      format,
      upIsGood,
      trend,
    });

    // Split a total into parts that add up to exactly that total (so every breakdown agrees)
    const share = (total: number, parts: number[]) => {
      const sum = parts.reduce((a, b) => a + b, 0);
      const split = parts.map((p) => Math.floor((total * p) / sum));
      split[split.indexOf(Math.max(...split))] += total - split.reduce((a, b) => a + b, 0);
      return split;
    };
    const overdueDocs = Math.max(1, Math.round(open * (overdue / outstanding)));
    const maturity = [overdueDocs, ...share(open - overdueDocs, [32, 28, 22, 18].map((p) => p * (0.85 + random() * 0.3)))];
    const [factoring, confirming] = share(open, [62, 38].map((p) => p * (0.85 + random() * 0.3)));
    const byCompany = share(open, [46, 33, 21].map((p) => p * (0.8 + random() * 0.4)));

    return {
      kpis: [
        kpi("outstanding", "Outstanding", outstanding, "currency", true, labels.map((_, i) => Math.round(outstanding * (0.86 + (i / labels.length) * 0.14 + random() * 0.04)))),
        kpi("financed", "Invoices financed", financed, "number", true, financedTrend),
        kpi("usage", "Agreement usage", usage, "percent", false, []),
        kpi("days", "Average days to due", daysToDue, "number", true, []),
        kpi("overdue", "Overdue", overdue, "currency", false, []),
      ],
      breakdowns: [
        {
          id: "maturity",
          title: "Outstanding invoices by maturity",
          segments: [
            { label: "Overdue", value: maturity[0] },
            { label: "Due in 30 days", value: maturity[1] },
            { label: "31–60 days", value: maturity[2] },
            { label: "61–90 days", value: maturity[3] },
            { label: "Over 90 days", value: maturity[4] },
          ],
        },
        {
          id: "nature",
          title: "Outstanding invoices by agreement type",
          segments: [
            { label: "Factoring", value: factoring },
            { label: "Confirming", value: confirming },
          ],
        },
        {
          id: "company",
          title: "Outstanding invoices by financial company",
          segments: COMPANIES.map((label, i) => ({ label, value: byCompany[i] })),
        },
      ],
      funnel: {
        title: "From submission to financing",
        subtitle: "Invoices in the period",
        stages: [
          { label: "Submitted", value: submitted },
          { label: "Approved", value: approved },
          { label: "Financed", value: financed },
        ],
      },
      ranking: {
        title: "Biggest debtors",
        subtitle: "Outstanding",
        format: "currency",
        rows: DEBTORS.slice(0, 6).map((label, i) => ({
          label,
          value: Math.max(AVERAGE_AMOUNT, Math.round((outstanding / (6 + i * 2.2)) * (0.85 + random() * 0.3))),
        })),
      },
      upcoming: {
        title: "Coming due",
        rows: Array.from({ length: 5 }, (_, i) => ({
          id: `due-${i}`,
          title: DEBTORS[Math.floor(random() * DEBTORS.length)],
          detail: `FT 2026/${600 + Math.floor(random() * 300)} · €${(2 + Math.floor(random() * 20)).toLocaleString("en-US")}K`,
          date: isoDay(1 + i * 3 + Math.floor(random() * 3)),
        })),
      },
      trend: {
        title: "Invoices financed and collected",
        subtitle: scale < 1 ? "In the selected scope" : "All credit intermediaries",
        labels,
        series: [
          { label: "Financed", values: financedTrend },
          { label: "Collected", values: collectedTrend },
        ],
      },
    };
  },
};
