import type { AplWorkItemSortingType, AplWorkItemInternalState } from "@platform/api/generated/MontraPOSApi";
import { DEFAULT_SORT, WORK_ITEM_SORTS, WORK_ITEM_STATES } from "./workItemsModel";

// What a task list shows: the home card (kept in memory) and the /tasks search page
// (kept in the URL, so Back and shared links keep it).

export type TaskView = {
  /** Chosen position; null = the user's own */
  positionId: string | null;
  /** Search only: states listed; null = all */
  states: AplWorkItemInternalState[] | null;
  /** Search only: exact task number ("" = any) */
  number: string;
  /** Search only */
  sort: AplWorkItemSortingType;
  page: number;
};

export const DEFAULT_TASK_VIEW: TaskView = {
  positionId: null,
  states: null,
  number: "",
  sort: DEFAULT_SORT,
  page: 1,
};

/** URL value of an empty state list (absent = all states) */
const NONE = "none";

/** URL changes for `view` (null removes a parameter); the default view writes nothing */
export function taskViewToParams(view: TaskView): Record<string, string | null> {
  const states = view.states === null || view.states.length === WORK_ITEM_STATES.length ? null : view.states;
  return {
    position: view.positionId,
    state:
      states === null
        ? null
        : states.length === 0
          ? NONE
          : WORK_ITEM_STATES.filter((s) => states.includes(s.value))
              .map((s) => s.name)
              .join(","),
    number: view.number.trim() || null,
    sort: view.sort === DEFAULT_SORT ? null : (WORK_ITEM_SORTS.find((s) => s.value === view.sort)?.name ?? null),
    page: view.page > 1 ? String(view.page) : null,
  };
}

/** The view in the URL (unknown values fall back to the defaults) */
export function taskViewFromParams(get: (key: string) => string | null): TaskView {
  const value = (key: string) => get(key) || null;
  const stateParam = value("state");
  const named = WORK_ITEM_STATES.filter((s) => (stateParam ?? "").split(",").includes(s.name)).map((s) => s.value);
  // An opaque id from the API, as it came (the API rejects a bad one: invalid_id)
  const positionId = value("position");
  return {
    positionId,
    // Unknown names only: all states
    states: stateParam === NONE ? [] : named.length ? named : null,
    number: /^\d+$/.test(value("number") ?? "") ? value("number")! : "",
    sort: WORK_ITEM_SORTS.find((s) => s.name === value("sort"))?.value ?? DEFAULT_SORT,
    page: Math.max(1, Number(value("page")) || 1),
  };
}
