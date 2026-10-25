import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "@platform/app/store";
import ActiveFilters, { type ActiveFilter } from "@platform/components/results/ActiveFilters";
import FilterChips from "@platform/components/results/FilterChips";
import { ResultList, ResultRow } from "@platform/components/results/ResultList";
import ResultsFooter from "@platform/components/results/ResultsFooter";
import ResultsPanel from "@platform/components/results/ResultsPanel";
import ResultsToolbar from "@platform/components/results/ResultsToolbar";
import { useDebouncedValue } from "@platform/hooks/useDebouncedValue";
import type { WorkItemDtoPagedResult } from "@platform/api/generated/MontraPOSApi";
import {
  useWorkItemPositionsQuery,
  useWorkItemsDashboardQuery,
  useWorkItemsSearchQuery,
} from "../api/workItemsApi";
import { DEFAULT_TASK_VIEW, type TaskView } from "../taskView";
import { useLocalTaskView, useUrlTaskView, type TaskViewState } from "../useTaskView";
import {
  currentPosition,
  DEFAULT_SORT,
  dueInWords,
  formatMoment,
  positionLabel,
  positionParam,
  PRIORITY_TONES,
  priorityOf,
  summarize,
  TASKS_PAGE_SIZE,
  toPositions,
  WORK_ITEM_SORTS,
  WORK_ITEM_STATES,
  workItemsOf,
  workItemsProblem,
  workItemSubject,
  workItemTitle,
  type WorkItem,
  type WorkItemPosition,
} from "../workItemsModel";
import PriorityBadge from "./PriorityBadge";
import TaskDetailModal from "./TaskDetailModal";
import { useModuleLabel } from "@platform/features/layout/hooks/useModuleLabel";

// The user's work items in the shared results view, one position (queue) at a time:
//  - home card: the Active items of the position (GET /api/work-items/dashboard), in worklist order
//  - /tasks: any state, filtered and sorted by the API (GET /api/work-items/search)
// The API's order is kept; paging is the API's (totalCount). Lists reload when the window
// regains focus, or with the refresh button. A task opens in a popup that browses the page.

/** An app's own tab next to "Assigned tasks" (e.g. Credit's commercial resume) */
export type DashboardTab = { id: string; label: string; icon: string; content: ReactNode };

type Mode = "dashboard" | "search";

const TASKS_TAB = "tasks";

const LOST_QUEUE_NOTICE = "You no longer have access to that queue. Showing your own tasks.";

const LIST_OPTIONS = { refetchOnFocus: true, refetchOnMountOrArgChange: true } as const;

/** One position's page: dashboard or search, as the mode says (the other query is skipped) */
function useWorkItemsPage(mode: Mode, view: TaskView, positionId: string | undefined) {
  const number = useDebouncedValue(view.number.trim());
  const page = { page: view.page, pageSize: TASKS_PAGE_SIZE };
  const noState = view.states !== null && view.states.length === 0;

  const dashboard = useWorkItemsDashboardQuery({ positionId, ...page }, { ...LIST_OPTIONS, skip: mode !== "dashboard" });
  const search = useWorkItemsSearchQuery(
    {
      positionId,
      // All states = none sent
      states: view.states === null || view.states.length === WORK_ITEM_STATES.length ? undefined : view.states,
      number: number ? Number(number) : undefined,
      sort: view.sort === DEFAULT_SORT ? undefined : view.sort,
      ...page,
    },
    { ...LIST_OPTIONS, skip: mode !== "search" || noState },
  );
  return { ...(mode === "dashboard" ? dashboard : search), noState: mode === "search" && noState };
}

/** Up to this many queues: buttons side by side; more: a dropdown */
const QUEUE_BUTTONS_MAX = 4;

function PositionSelect({
  positions,
  value,
  onChange,
}: {
  positions: WorkItemPosition[];
  value: WorkItemPosition | null;
  onChange: (position: WorkItemPosition) => void;
}) {
  // Only the user's own queue: nothing to choose
  if (positions.length < 2) return null;
  if (positions.length <= QUEUE_BUTTONS_MAX) {
    return (
      <div className="btn-group btn-group-sm app-task-queues" role="group" aria-label="Whose tasks">
        {positions.map((position) => (
          <button
            key={position.id}
            type="button"
            className={`btn btn-outline-primary ${position.id === value?.id ? "active" : ""}`}
            aria-pressed={position.id === value?.id}
            onClick={() => position.id !== value?.id && onChange(position)}
          >
            {positionLabel(position)}
          </button>
        ))}
      </div>
    );
  }
  return (
    <select
      className="form-select form-select-sm w-auto"
      aria-label="Whose tasks"
      value={value?.id ?? ""}
      onChange={(e) => {
        const next = positions.find((p) => String(p.id) === e.target.value);
        if (next) onChange(next);
      }}
    >
      {positions.map((position) => (
        <option key={position.id} value={position.id}>
          {positionLabel(position)}
        </option>
      ))}
    </select>
  );
}

/** Overdue / due today / critical-high / no due date, above the home card's list */
function TaskSummary({ tasks }: { tasks: WorkItem[] }) {
  const { overdue, dueToday, urgent, noDueDate } = summarize(tasks);
  const stat = (icon: string, tone: string, count: number, label: string) => (
    <li className="app-task-stat">
      <i className={`bi ${icon} ${tone}`} aria-hidden="true" />
      <strong>{count}</strong>
      {label}
    </li>
  );
  return (
    <ul className="app-task-summary list-unstyled mb-0" aria-label="Summary">
      {stat("bi-alarm", "text-danger", overdue, "overdue")}
      {stat("bi-calendar-day", "text-primary", dueToday, "due today")}
      {stat("bi-exclamation-triangle", "app-text-orange", urgent, "critical / high")}
      {stat("bi-calendar-x", "text-body-secondary", noDueDate, "no due date")}
    </ul>
  );
}

type TaskListProps = {
  mode: Mode;
  /** Where the view lives: the card (memory) or the page (URL) */
  state: TaskViewState;
  /** Home card: the app's tabs next to "Assigned tasks" */
  extraTabs?: DashboardTab[];
  /** Home card: link to the full page */
  viewAll?: boolean;
};

// With `extraTabs` the title becomes a tab bar: "Assigned tasks (n)" + the app's tabs.
function TaskList({ mode, state, extraTabs = [], viewAll = false }: TaskListProps) {
  const { view, update } = state;
  const moduleLabel = useModuleLabel();
  const tasksTitle = moduleLabel({ label: mode === "search" ? "Tasks" : "Assigned tasks" });
  const [activeTab, setActiveTab] = useState(TASKS_TAB);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dateFormat = useAppSelector((s) => s.theme.dateFormat);

  // Positions: loaded once when the list opens. Until then (or if they fail) the chosen id is
  // sent as is, or none for the user's own queue.
  const positionsQuery = useWorkItemPositionsQuery();
  const positions = toPositions(positionsQuery.data);
  const position = positionsQuery.data ? currentPosition(positions, view.positionId) : null;
  const positionId = positionsQuery.data ? positionParam(position) : (view.positionId ?? undefined);

  const { currentData, isFetching, isError, error, refetch, noState } = useWorkItemsPage(mode, view, positionId);
  const result = currentData as WorkItemDtoPagedResult | undefined;
  const tasks = workItemsOf(result);
  const total = result?.totalCount ?? tasks.length;
  const problem = isError ? workItemsProblem(error) : null;

  // 403: the position is no longer the user's → say so (once per failed request), reload the
  // positions and go back to their own queue
  const [noticedError, setNoticedError] = useState<unknown>(null);
  if (problem === "positionForbidden" && error !== noticedError) {
    setNoticedError(error);
    setNotice(LOST_QUEUE_NOTICE);
  }
  // A chosen position (e.g. from a bookmark) that isn't one of the user's positions: same
  const chosenIsGone =
    !!positionsQuery.data && view.positionId !== null && !positions.some((p) => p.id === view.positionId);
  const [noticedGone, setNoticedGone] = useState<string | null>(null);
  if (chosenIsGone && view.positionId !== noticedGone) {
    setNoticedGone(view.positionId);
    setNotice(LOST_QUEUE_NOTICE);
  }
  useEffect(() => {
    if (chosenIsGone) update({ positionId: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- when the positions show it's gone
  }, [chosenIsGone]);
  useEffect(() => {
    if (problem === "positionForbidden") {
      positionsQuery.refetch();
      update({ positionId: null });
    }
    // 400: a request we built wrong (paging, state, sort): a bug to fix, not the user's doing
    if (problem === "invalidRequest") console.error("Work items request rejected (validation_failed)", error);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per failed request
  }, [problem, error]);

  // Items moved away and this page is now past the end: go to the last page
  const lastPage = Math.max(1, Math.ceil(total / TASKS_PAGE_SIZE));
  useEffect(() => {
    if (result && tasks.length === 0 && view.page > lastPage) update({ page: lastPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- when a page arrives
  }, [result]);

  const choosePosition = (next: WorkItemPosition) => {
    setNotice(null);
    update({ positionId: next.isSelf ? null : next.id });
  };

  const hasTabs = extraTabs.length > 0;
  const extraTab = extraTabs.find((tab) => tab.id === activeTab);

  const tab = (id: string, icon: string, label: ReactNode) => (
    <li className="nav-item" role="presentation" key={id}>
      <button
        type="button"
        role="tab"
        id={`dashboard-tab-${id}`}
        aria-selected={activeTab === id}
        aria-controls={`dashboard-panel-${id}`}
        className={`nav-link py-1 ${activeTab === id ? "active" : ""}`}
        onClick={() => setActiveTab(id)}
      >
        <i className={`bi ${icon} me-2`} aria-hidden="true" />
        {label}
      </button>
    </li>
  );

  const tabs = hasTabs && (
    <ul className="nav nav-pills gap-1" role="tablist" aria-label={moduleLabel({ label: "Home" })}>
      {tab(
        TASKS_TAB,
        "bi-list-check",
        <>
          Assigned tasks
          {result && <span className="ms-2 opacity-75">{total}</span>}
        </>,
      )}
      {extraTabs.map((extra) => tab(extra.id, extra.icon, extra.label))}
    </ul>
  );

  // Another tab: only the tab bar, with that tab's content (the task view is kept)
  if (extraTab) {
    return (
      <section className="card border-0 shadow-sm app-results" aria-label={moduleLabel({ label: "Home" })}>
        <div className="app-results-toolbar">{tabs}</div>
        <div
          className="card-body"
          role="tabpanel"
          id={`dashboard-panel-${extraTab.id}`}
          aria-labelledby={`dashboard-tab-${extraTab.id}`}
        >
          {extraTab.content}
        </div>
      </section>
    );
  }

  const isSearch = mode === "search";
  const clearSearch = () => update({ ...DEFAULT_TASK_VIEW, positionId: view.positionId });
  const active: ActiveFilter[] = [];
  if (isSearch && view.number.trim()) {
    active.push({ key: "number", label: `Number ${view.number.trim()}`, onRemove: () => update({ number: "" }) });
  }
  if (isSearch && view.sort !== DEFAULT_SORT) {
    active.push({
      key: "sort",
      label: `Sorted by ${WORK_ITEM_SORTS.find((s) => s.value === view.sort)?.label.toLowerCase()}`,
      onRemove: () => update({ sort: DEFAULT_SORT }),
    });
  }
  const selectedStates = view.states ?? WORK_ITEM_STATES.map((s) => s.value);

  const toolbar = (
    <ResultsToolbar
      title={tasksTitle}
      titleSlot={tabs || undefined}
      count={result ? total : undefined}
      activeFilterCount={isSearch ? active.length : undefined}
      actions={
        <div className="d-flex align-items-center gap-1">
          <PositionSelect positions={positions} value={position} onChange={choosePosition} />
          <button
            type="button"
            className="btn btn-link btn-sm text-body-secondary px-1"
            aria-label="Refresh tasks"
            title="Refresh"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            <i className={`bi bi-arrow-clockwise ${isFetching ? "app-spin" : ""}`} aria-hidden="true" />
          </button>
          {viewAll && (
            <Link to="/tasks" className="btn btn-link btn-sm text-decoration-none text-nowrap px-1">
              View all <i className="bi bi-arrow-right" aria-hidden="true" />
            </Link>
          )}
        </div>
      }
      filters={
        isSearch && (
          <div className="row g-2">
            <div className="col-6">
              <label htmlFor="tasks-filter-number" className="form-label">
                Task number
              </label>
              <input
                id="tasks-filter-number"
                className="form-control"
                inputMode="numeric"
                value={view.number}
                onChange={(e) => update({ number: e.target.value.replace(/\D/g, "") })}
              />
            </div>
            <div className="col-6">
              <label htmlFor="tasks-filter-sort" className="form-label">
                Sort by
              </label>
              <select
                id="tasks-filter-sort"
                className="form-select"
                value={view.sort}
                onChange={(e) => update({ sort: Number(e.target.value) as TaskView["sort"] })}
              >
                {WORK_ITEM_SORTS.map((sort) => (
                  <option key={sort.value} value={sort.value}>
                    {sort.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )
      }
    >
      {isSearch && (
        <FilterChips
          groups={[
            {
              label: "State",
              options: WORK_ITEM_STATES.map((s) => ({ value: String(s.value), label: s.label })),
              selected: selectedStates.map(String),
              onChange: (next) => update({ states: next.map(Number) as TaskView["states"] }),
            },
          ]}
        />
      )}
      {isSearch && <ActiveFilters items={active} onClearAll={clearSearch} />}
      {!isSearch && result && tasks.length > 0 && total <= tasks.length && <TaskSummary tasks={tasks} />}
      {notice && (
        <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mx-3 mb-2 small" role="status">
          <i className="bi bi-info-circle" aria-hidden="true" />
          <span className="flex-grow-1">{notice}</span>
          <button type="button" className="btn-close btn-sm" aria-label="Dismiss" onClick={() => setNotice(null)} />
        </div>
      )}
    </ResultsToolbar>
  );

  // Others: say what failed in our words (the API's text is not for users)
  const errorText =
    problem === "unavailable" ? "Tasks are temporarily unavailable." : "Couldn't load your tasks.";

  return (
    <div
      role={hasTabs ? "tabpanel" : undefined}
      id={hasTabs ? `dashboard-panel-${TASKS_TAB}` : undefined}
      aria-labelledby={hasTabs ? `dashboard-tab-${TASKS_TAB}` : undefined}
    >
      <ResultsPanel
        toolbar={toolbar}
        status={{
          isLoading: !result && isFetching,
          // A forbidden position is handled above (back to the user's own queue)
          isError: isError && problem !== "positionForbidden",
          // Only connectivity errors keep their own message ("Can't reach the server…")
          error: problem === "other" && (error as { status?: unknown })?.status === "FETCH_ERROR" ? error : undefined,
          errorText,
          onRetry: () => refetch(),
          isEmpty: noState || tasks.length === 0,
          empty: noState
            ? { icon: "bi-funnel", text: "Select at least one state.", onClear: clearSearch }
            : isSearch
              ? { icon: "bi-search", text: "No tasks match your filters.", onClear: active.length ? clearSearch : undefined }
              : { icon: "bi-check2-circle", text: "No active tasks" },
        }}
        footer={
          <ResultsFooter
            page={view.page}
            pageSize={TASKS_PAGE_SIZE}
            total={total}
            onPageChange={(next) => update({ page: next })}
            label="Task pages"
          />
        }
      >
        <ResultList label={tasksTitle}>
          {tasks.map((task, i) => {
            const priority = priorityOf(task.priorityKind);
            const due = dueInWords(task.dueMoment);
            const subject = workItemSubject(task);
            // Only what the task has: operation or entity, type, state (and who has it, in a group's queue)
            const pills = [
              subject && (
                <span key="subject" className="text-truncate">
                  <i className="bi bi-file-earmark-text me-1" aria-hidden="true" />
                  {subject}
                </span>
              ),
              ...[task.type, task.state, position && !position.isSelf ? task.assignedUser : null]
                .filter(Boolean)
                .map((text) => (
                  <span key={text} className="app-task-pill">
                    {text}
                  </span>
                )),
            ].filter(Boolean);
            return (
              <ResultRow
                key={task.id}
                accent={priority ? PRIORITY_TONES[priority] : undefined}
                accentLabel={priority ? `${priority} priority` : undefined}
                leading={task.number != null && <span className="app-task-number">#{task.number}</span>}
                title={workItemTitle(task)}
                secondary={
                  <span className="app-task-pills">
                    {pills.length ? pills : <span className="fst-italic">No details</span>}
                  </span>
                }
                trailing={
                  <>
                    {priority ? (
                      <PriorityBadge priority={priority} />
                    ) : (
                      task.priority && <span className="small text-body-secondary">{task.priority}</span>
                    )}
                    <span className="app-task-due">
                      {due ? (
                        <>
                          <strong className={due.overdue ? "text-danger" : undefined}>{due.text}</strong>
                          <span>{formatMoment(task.dueMoment, dateFormat)}</span>
                        </>
                      ) : (
                        <span>No due date</span>
                      )}
                    </span>
                  </>
                }
                dialog
                onClick={() => setOpenIndex(i)}
              />
            );
          })}
        </ResultList>
      </ResultsPanel>

      {openIndex !== null && tasks[openIndex] && (
        <TaskDetailModal
          tasks={tasks}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </div>
  );
}

/** Home card: the Active tasks of the chosen position; "View all" opens the /tasks page */
function AssignedTasks({ extraTabs = [] }: { extraTabs?: DashboardTab[] }) {
  return <TaskList mode="dashboard" state={useLocalTaskView()} extraTabs={extraTabs} viewAll />;
}

/** /tasks page: tasks in any state, searched by the API, the view in the URL */
export function TasksSearch() {
  return <TaskList mode="search" state={useUrlTaskView()} />;
}

export default AssignedTasks;
