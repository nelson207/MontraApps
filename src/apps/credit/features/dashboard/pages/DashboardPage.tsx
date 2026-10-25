import NewsGallery from "@platform/features/news/components/NewsGallery";
import InsightsBoard from "@platform/features/insights/components/InsightsBoard";
import AssignedTasks from "@platform/features/tasks/components/AssignedTasks";
import { INSIGHTS } from "../../../insights";

// Montra Credit home: news, then one card with tabs: my assigned tasks and the commercial
// resume (quotations, proposals and contracts dashboards). Both are shared features; the
// commercial figures are Credit's (apps/credit/insights.ts).
export default function DashboardPage() {
  return (
    <div className="app-page">
      <NewsGallery />
      <AssignedTasks extraTabs={[{ id: "insights", ...INSIGHTS.tab, content: <InsightsBoard /> }]} />
    </div>
  );
}
