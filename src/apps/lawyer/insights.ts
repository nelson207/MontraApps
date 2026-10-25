import type { InsightsConfig } from "@platform/features/insights/insightsConfig";
import type { InsightsData, Kpi } from "@platform/features/insights/insightsModel";
import {
  SAMPLE_ORGANIZATIONS,
  sampleMembersOf,
  sampleUnitsOf,
} from "@platform/features/workContext/api/sampleHierarchy";

// Montra Lawyer's dashboards: the status of the current legal actions (the "Legal actions" tab).

const YEARLY_NEW_ACTIONS = 900;

const PARTIES = ["Silva", "Construtora Norte", "Banco Atlântico", "Ferreira & Filhos", "Município de Braga", "Transportes Lusos", "Costa", "Hotel Mar Azul"];
const COURTS = ["Lisbon District Court", "Porto Labour Court", "Braga Administrative Court", "Lisbon Court of Appeal", "Coimbra District Court"];

const isoDay = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const INSIGHTS: InsightsConfig = {
  tab: { label: "Legal actions", icon: "bi-briefcase" },
  // TODO: placeholder endpoint (not exposed by the backend yet)
  url: "/api/Insights/LegalActions",
  sample: (filters, { around, random, labels, scale }) => {
    const opened = around(YEARLY_NEW_ACTIONS);
    const closed = Math.round(opened * (0.78 + random() * 0.25));
    // Open now: a backlog independent of the period, scoped by the filters
    const open = Math.max(1, Math.round(1_150 * scale * (0.9 + random() * 0.2)));
    const won = Math.round(closed * (0.48 + random() * 0.1));
    const settled = Math.round(closed * (0.25 + random() * 0.08));
    const lost = Math.max(0, closed - won - settled);
    const hearings = Math.max(1, Math.round(open * (0.12 + random() * 0.05)));

    const spread = (total: number) => {
      const weights = labels.map(() => 0.75 + random() * 0.5);
      const sum = weights.reduce((a, b) => a + b, 0);
      return weights.map((w) => Math.round((total * w) / sum));
    };
    const openedTrend = spread(opened);
    const closedTrend = spread(closed);

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
    const [filed, inProgress, awaiting, appeal, suspended] = share(open, [12, 46, 22, 14, 6].map((p) => p * (0.85 + random() * 0.3)));
    const [litigation, labour, tax, corporate, realEstate] = share(open, [38, 24, 14, 14, 10].map((p) => p * (0.8 + random() * 0.4)));

    // Ranking one level below the chosen scope
    const ranking: InsightsData["ranking"] =
      filters.memberId !== null
        ? undefined
        : {
            title:
              filters.unitId !== null ? "Lawyers" : filters.organizationId !== null ? "Lawyer departments" : "Lawyers offices",
            subtitle: "Open legal actions",
            format: "number",
            rows: (filters.unitId !== null
              ? sampleMembersOf(filters.unitId).slice(0, 6)
              : filters.organizationId !== null
                ? sampleUnitsOf(filters.organizationId).slice(0, 6)
                : SAMPLE_ORGANIZATIONS.slice(0, 6)
            ).map((node, i) => ({ label: node.name, value: Math.max(1, Math.round((open / (2.4 + i * 0.8)) * (0.85 + random() * 0.3))) })),
          };

    return {
      kpis: [
        kpi("open", "Open legal actions", open, "number", false, labels.map((_, i) => Math.round(open * (0.88 + (i / labels.length) * 0.12 + random() * 0.04)))),
        kpi("opened", "New legal actions", opened, "number", true, openedTrend),
        kpi("closed", "Closed", closed, "number", true, closedTrend),
        kpi("success", "Success rate", Math.round(((won + settled) / Math.max(closed, 1)) * 1000) / 10, "percent", true, []),
        kpi("hearings", "Hearings in the next 30 days", hearings, "number", false, []),
      ],
      breakdowns: [
        {
          id: "status",
          title: "Open legal actions by status",
          segments: [
            { label: "Filed", value: filed },
            { label: "In progress", value: inProgress },
            { label: "Awaiting decision", value: awaiting },
            { label: "In appeal", value: appeal },
            { label: "Suspended", value: suspended },
          ],
        },
        {
          id: "area",
          title: "Open legal actions by practice area",
          segments: [
            { label: "Litigation", value: litigation },
            { label: "Labour", value: labour },
            { label: "Tax", value: tax },
            { label: "Corporate", value: corporate },
            { label: "Real estate", value: realEstate },
          ],
        },
        {
          id: "outcomes",
          title: "Outcomes of closed actions",
          segments: [
            { label: "Won", value: won },
            { label: "Settled", value: settled },
            { label: "Lost", value: lost },
          ],
        },
      ],
      ranking,
      upcoming: {
        title: "Upcoming hearings",
        rows: Array.from({ length: Math.min(5, hearings) }, (_, i) => {
          const a = PARTIES[Math.floor(random() * PARTIES.length)];
          const b = PARTIES[(PARTIES.indexOf(a) + 3) % PARTIES.length];
          return {
            id: `hearing-${i}`,
            title: `${a} v. ${b}`,
            detail: COURTS[Math.floor(random() * COURTS.length)],
            date: isoDay(2 + i * 4 + Math.floor(random() * 3)),
          };
        }),
      },
      trend: {
        title: "Legal actions opened and closed",
        subtitle: scale < 1 ? "In the selected scope" : "All offices",
        labels,
        series: [
          { label: "Opened", values: openedTrend },
          { label: "Closed", values: closedTrend },
        ],
      },
    };
  },
};
