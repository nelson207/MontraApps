import type { Priority } from "../workItemsModel";

// Priority colours (styles: app-priority-* in platform/styles/news.scss):
// Critical red, High orange, Medium yellow, Low green.
const PRIORITY_CLASS: Record<Priority, string> = {
  Low: "app-priority-low",
  Medium: "app-priority-medium",
  High: "app-priority-high",
  Critical: "app-priority-critical",
};

function PriorityBadge({ priority, className = "" }: { priority: Priority; className?: string }) {
  return <span className={`badge ${PRIORITY_CLASS[priority]} ${className}`}>{priority}</span>;
}

export default PriorityBadge;
