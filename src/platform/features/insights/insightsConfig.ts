import type { InsightsData, InsightsFilters } from "./insightsModel";
import type { SampleTools } from "./api/sampleTools";

// What an app tells the shared insights board (apps/<app>/insights.ts → INSIGHTS).
export type InsightsConfig = {
  /** The dashboard tab next to "Assigned tasks" */
  tab: { label: string; icon: string };
  /**
   * The app's endpoint (not exposed by the backend yet):
   *   GET {url}?organizationId=&unitId=&memberId=&period=30d|90d|12m|ytd  →  InsightsData
   */
  url: string;
  /** Development sample for the filters (deterministic: same filters, same numbers) */
  sample: (filters: InsightsFilters, tools: SampleTools) => InsightsData;
};
