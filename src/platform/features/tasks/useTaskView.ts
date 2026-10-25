import { useState } from "react";
import { useUrlFilters } from "@platform/hooks/useUrlFilters";
import { DEFAULT_TASK_VIEW, taskViewFromParams, taskViewToParams, type TaskView } from "./taskView";

export type TaskViewState = {
  view: TaskView;
  /** Changes part of the view; anything but the page goes back to page 1 */
  update: (patch: Partial<TaskView>) => void;
};

const withPage = (view: TaskView, patch: Partial<TaskView>): TaskView => ({ ...view, ...patch, page: patch.page ?? 1 });

/** Home card: the view lives with the card (kept while another dashboard tab is shown) */
export function useLocalTaskView(): TaskViewState {
  const [view, setView] = useState<TaskView>(DEFAULT_TASK_VIEW);
  return { view, update: (patch) => setView((current) => withPage(current, patch)) };
}

/** /tasks: the view lives in the URL */
export function useUrlTaskView(): TaskViewState {
  const { get, set } = useUrlFilters();
  const view = taskViewFromParams(get);
  return { view, update: (patch) => set(taskViewToParams(withPage(view, patch))) };
}
