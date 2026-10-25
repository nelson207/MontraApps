import HomeGreeting from "@platform/features/layout/components/HomeGreeting";
import NewsGallery from "@platform/features/news/components/NewsGallery";
import InsightsBoard from "@platform/features/insights/components/InsightsBoard";
import AssignedTasks from "@platform/features/tasks/components/AssignedTasks";
import { INSIGHTS } from "../../../insights";

// Montra Stock Credit home: news, then one card with tabs: my assigned tasks and the stock
// dashboards (same layout as Credit's; figures from apps/stock/insights.ts).
function DashboardPage() {
  return (
    <div className="app-page">
      <HomeGreeting />
      <NewsGallery />
      <AssignedTasks extraTabs={[{ id: "insights", ...INSIGHTS.tab, content: <InsightsBoard /> }]} />
    </div>
  );
}

export default DashboardPage;
