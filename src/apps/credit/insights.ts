import type { InsightsConfig } from "@platform/features/insights/insightsConfig";
import type { InsightsData, Kpi } from "@platform/features/insights/insightsModel";
import {
  SAMPLE_ORGANIZATIONS,
  sampleMembersOf,
  sampleUnitsOf,
} from "@platform/features/workContext/api/sampleHierarchy";

// Montra Credit's dashboards: where my credit intermediary stands on quotations, proposals and
// contracts (the "Commercial resume" tab of the dashboard).

/** Yearly volume for the whole network (the sample scales it down for a narrower scope) */
const YEARLY_QUOTATIONS = 2_400;
const AVERAGE_FINANCED = 18_500;

export const INSIGHTS: InsightsConfig = {
  tab: { label: "Commercial resume", icon: "bi-bar-chart" },
  // TODO: placeholder endpoint (not exposed by the backend yet)
  url: "/api/Insights/Commercial",
  sample: (filters, { around, random, labels, scale }) => {
    const quotations = around(YEARLY_QUOTATIONS);
    const proposals = Math.round(quotations * (0.5 + random() * 0.12));
    const approved = Math.round(proposals * (0.66 + random() * 0.1));
    const contracts = Math.round(approved * (0.82 + random() * 0.1));
    const financed = contracts * AVERAGE_FINANCED * (0.9 + random() * 0.2);

    // Each breakdown adds up to exactly its KPI (the last state takes the rest)
    const openQ = Math.round(quotations * 0.22);
    const pendingQ = Math.round(quotations * 0.12);
    const inAnalysis = Math.round(proposals * 0.14);
    const rejected = Math.round(proposals * 0.12);
    const awaitingSignature = Math.round(contracts * 0.12);
    const inValidation = Math.round(contracts * 0.08);
    const active = Math.round(contracts * 0.62);

    // Per trend point, oldest first, with some movement
    const spread = (total: number) => {
      const weights = labels.map((_, i) => 0.8 + random() * 0.4 + i * 0.01);
      const sum = weights.reduce((a, b) => a + b, 0);
      return weights.map((w) => Math.round((total * w) / sum));
    };
    const quotationsTrend = spread(quotations);
    const proposalsTrend = spread(proposals);
    const contractsTrend = spread(contracts);

    const kpi = (id: string, label: string, value: number, format: Kpi["format"], trend: number[]): Kpi => ({
      id,
      label,
      value,
      previous: format === "percent" ? value - 4 + random() * 6 : Math.round(value * (0.82 + random() * 0.3)),
      format,
      upIsGood: true,
      trend,
    });

    // Ranking one level below the chosen scope
    const ranking: InsightsData["ranking"] =
      filters.memberId !== null
        ? undefined
        : {
            title:
              filters.unitId !== null
                ? "Top vendors"
                : filters.organizationId !== null
                  ? "Top suppliers"
                  : "Top credit intermediaries",
            subtitle: "By financed amount",
            format: "currency",
            rows: (filters.unitId !== null
              ? sampleMembersOf(filters.unitId).slice(0, 6)
              : filters.organizationId !== null
                ? sampleUnitsOf(filters.organizationId).slice(0, 6)
                : SAMPLE_ORGANIZATIONS.slice(0, 6)
            ).map((node, i) => ({ label: node.name, value: Math.round((financed / (2.2 + i * 0.9)) * (0.85 + random() * 0.3)) })),
          };

    return {
      kpis: [
        kpi("quotations", "Quotations", quotations, "number", quotationsTrend),
        kpi("proposals", "Proposals", proposals, "number", proposalsTrend),
        kpi("contracts", "Contracts", contracts, "number", contractsTrend),
        kpi("financed", "Financed amount", Math.round(financed), "currency", contractsTrend.map((c) => c * AVERAGE_FINANCED)),
        kpi("conversion", "Quotation → contract", Math.round((contracts / Math.max(quotations, 1)) * 1000) / 10, "percent", []),
      ],
      breakdowns: [
        {
          id: "quotations",
          title: "Quotations",
          segments: [
            { label: "Open", value: openQ },
            { label: "Pending customer", value: pendingQ },
            { label: "Converted to proposal", value: proposals },
            { label: "Expired", value: Math.max(0, quotations - openQ - pendingQ - proposals) },
          ],
        },
        {
          id: "proposals",
          title: "Proposals",
          segments: [
            { label: "In analysis", value: inAnalysis },
            { label: "Approved", value: approved },
            { label: "Rejected", value: rejected },
            { label: "Cancelled", value: Math.max(0, proposals - inAnalysis - approved - rejected) },
          ],
        },
        {
          id: "contracts",
          title: "Contracts",
          segments: [
            { label: "Awaiting signature", value: awaitingSignature },
            { label: "In validation", value: inValidation },
            { label: "Active", value: active },
            { label: "Completed", value: Math.max(0, contracts - awaitingSignature - inValidation - active) },
          ],
        },
      ],
      funnel: {
        title: "From quotation to contract",
        stages: [
          { label: "Quotations", value: quotations },
          { label: "Proposals", value: proposals },
          { label: "Approved", value: approved },
          { label: "Contracts", value: contracts },
        ],
      },
      ranking,
      trend: {
        title: "New operations",
        subtitle: scale < 1 ? "In the selected scope" : "Whole network",
        labels,
        series: [
          { label: "Quotations", values: quotationsTrend },
          { label: "Proposals", values: proposalsTrend },
          { label: "Contracts", values: contractsTrend },
        ],
      },
    };
  },
};
