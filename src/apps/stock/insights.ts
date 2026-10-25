import type { InsightsConfig } from "@platform/features/insights/insightsConfig";
import type { InsightsData, Kpi } from "@platform/features/insights/insightsModel";
import {
  SAMPLE_ORGANIZATIONS,
  sampleMembersOf,
  sampleUnitsOf,
} from "@platform/features/workContext/api/sampleHierarchy";

// Montra Stock Credit's dashboards: the financed stock, the credit lines' usage, ageing stock and
// the units coming due (the "Stock" tab).

const YEARLY_UNITS = 2_400;
const AVERAGE_AMOUNT = 21_500;

const COMPANIES = ["Banco Atlântico", "Lusa Financeira", "Crédito Norte"];
const VEHICLES = ["Renault Clio", "Peugeot 208", "Volkswagen Golf", "BMW Série 1", "Toyota Yaris", "SEAT Ibiza", "Mercedes-Benz Classe A"];

const isoDay = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const INSIGHTS: InsightsConfig = {
  tab: { label: "Stock", icon: "bi-car-front" },
  // TODO: placeholder endpoint (not exposed by the backend yet)
  url: "/api/Insights/StockCredit",
  sample: (filters, { around, random, labels, scale }) => {
    const funded = around(YEARLY_UNITS);
    const settled = Math.round(funded * (0.88 + random() * 0.14));
    const submitted = Math.round(funded * (1.06 + random() * 0.06));
    const approved = Math.round(funded * (1.01 + random() * 0.03));
    // In stock now: independent of the period, scoped by the filters
    const inStock = Math.max(1, Math.round(640 * scale * (0.9 + random() * 0.2)));
    const stockValue = Math.round(inStock * AVERAGE_AMOUNT * (0.92 + random() * 0.16));
    const usage = Math.round((68 + random() * 20) * 10) / 10;
    const averageDays = Math.round(48 + random() * 30);
    const dueSoon = Math.round(stockValue * (0.14 + random() * 0.08));
    const overdue = Math.round(inStock * (0.02 + random() * 0.03));

    const spread = (total: number) => {
      const weights = labels.map(() => 0.75 + random() * 0.5);
      const sum = weights.reduce((a, b) => a + b, 0);
      return weights.map((w) => Math.round((total * w) / sum));
    };
    const fundedTrend = spread(funded);
    const settledTrend = spread(settled);

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
    const ages = share(inStock, [34, 27, 18, 12, 9].map((p) => p * (0.85 + random() * 0.3)));
    const byCompany = share(inStock, [48, 31, 21].map((p) => p * (0.8 + random() * 0.4)));
    const [pending, awaitingFunding, fundedNow] = share(inStock - overdue, [7, 5, 88].map((p) => p * (0.85 + random() * 0.3)));

    // Ranking one level below the chosen scope
    const ranking: InsightsData["ranking"] =
      filters.memberId !== null
        ? undefined
        : {
            title: filters.unitId !== null ? "Vendors" : filters.organizationId !== null ? "Suppliers" : "Credit intermediaries",
            subtitle: "Stock financed",
            format: "currency",
            rows: (filters.unitId !== null
              ? sampleMembersOf(filters.unitId).slice(0, 6)
              : filters.organizationId !== null
                ? sampleUnitsOf(filters.organizationId).slice(0, 6)
                : SAMPLE_ORGANIZATIONS.slice(0, 6)
            ).map((node, i) => ({
              label: node.name,
              value: Math.max(AVERAGE_AMOUNT, Math.round((stockValue / (2.4 + i * 0.8)) * (0.85 + random() * 0.3))),
            })),
          };

    return {
      kpis: [
        kpi("value", "Stock financed", stockValue, "currency", true, labels.map((_, i) => Math.round(stockValue * (0.86 + (i / labels.length) * 0.14 + random() * 0.04)))),
        kpi("units", "Units in stock", inStock, "number", true, labels.map((_, i) => Math.round(inStock * (0.88 + (i / labels.length) * 0.12 + random() * 0.04)))),
        kpi("usage", "Credit line usage", usage, "percent", false, []),
        kpi("days", "Average days in stock", averageDays, "number", false, []),
        kpi("due", "Due in the next 30 days", dueSoon, "currency", false, []),
      ],
      breakdowns: [
        {
          id: "age",
          title: "Units in stock by age",
          segments: [
            { label: "Up to 30 days", value: ages[0] },
            { label: "31–60 days", value: ages[1] },
            { label: "61–90 days", value: ages[2] },
            { label: "91–120 days", value: ages[3] },
            { label: "Over 120 days", value: ages[4] },
          ],
        },
        {
          id: "company",
          title: "Units in stock by financial company",
          segments: COMPANIES.map((label, i) => ({ label, value: byCompany[i] })),
        },
        {
          id: "status",
          title: "Units in stock by status",
          segments: [
            { label: "Submitted", value: pending },
            { label: "Approved", value: awaitingFunding },
            { label: "Funded", value: fundedNow },
            { label: "Overdue", value: overdue },
          ],
        },
      ],
      funnel: {
        title: "From submission to funding",
        subtitle: "Units in the period",
        stages: [
          { label: "Submitted", value: submitted },
          { label: "Approved", value: approved },
          { label: "Funded", value: funded },
        ],
      },
      ranking,
      upcoming: {
        title: "Coming due",
        rows: Array.from({ length: 5 }, (_, i) => ({
          id: `due-${i}`,
          title: VEHICLES[Math.floor(random() * VEHICLES.length)],
          detail: `${COMPANIES[i % COMPANIES.length]} · €${(9 + Math.floor(random() * 30)).toLocaleString("en-US")}K`,
          date: isoDay(1 + i * 5 + Math.floor(random() * 4)),
        })),
      },
      trend: {
        title: "Units funded and settled",
        subtitle: scale < 1 ? "In the selected scope" : "All credit intermediaries",
        labels,
        series: [
          { label: "Funded", values: fundedTrend },
          { label: "Settled", values: settledTrend },
        ],
      },
    };
  },
};
