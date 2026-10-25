// The user's Accipiens work items (tasks), shared by every Montra app with a task list:
// positions (whose queue is listed), how items are shown, and what the API's errors mean.
//   GET /api/work-items/positions   the user first (isSelf), then their groups by name
//   GET /api/work-items/dashboard   Active items of one position, in worklist order
//   GET /api/work-items/search      any state, filtered and sorted by the API

import type {
  WorkItemDto,
  WorkItemDtoPagedResult,
  WorkItemPositionDto,
  AplWorkItemSortingType,
  AplWorkItemInternalState,
} from "@platform/api/generated/MontraPOSApi";
import type { Tone } from "@platform/components/results/resultsModel";
import { formatDate, type DateFormat } from "@platform/utils/dateFormat";

/** Rows per page (the API allows up to 200) */
export const TASKS_PAGE_SIZE = 25;

// ---------------------------------------------------------------- positions

export type WorkItemPosition = { id: string; name: string; isSelf: boolean };

/** The API's positions, in its order (the user first); entries without an id are dropped */
export function toPositions(dtos: WorkItemPositionDto[] | undefined): WorkItemPosition[] {
  return (dtos ?? [])
    .filter((p): p is WorkItemPositionDto & { id: string } => typeof p.id === "string" && p.id !== "")
    .map((p) => ({ id: p.id, name: p.name?.trim() || "Unnamed group", isSelf: !!p.isSelf }));
}

export const positionLabel = (position: WorkItemPosition) => (position.isSelf ? "Me" : position.name);

/** The position shown: the chosen one while it's still the user's, otherwise the user's own */
export function currentPosition(positions: WorkItemPosition[], chosenId: string | null): WorkItemPosition | null {
  return (
    positions.find((p) => p.id === chosenId) ?? positions.find((p) => p.isSelf) ?? positions[0] ?? null
  );
}

/**
 * positionId for a list request: the chosen position, or none for the user's own
 * (the API then uses the user, so the list can load before the positions do).
 */
export const positionParam = (position: WorkItemPosition | null): string | undefined =>
  position && !position.isSelf ? position.id : undefined;

// ---------------------------------------------------------------- items

export type WorkItem = WorkItemDto & { id: string };

export const workItemsOf = (page: WorkItemDtoPagedResult | undefined): WorkItem[] =>
  (page?.items ?? []).filter((item): item is WorkItem => typeof item?.id === "string" && item.id !== "");

const MOMENT = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/;

/**
 * An API date: ISO without a time zone, in the server's local time. Read as local time
 * (never converted from UTC). A date without a time counts as the end of that day.
 */
export function parseMoment(iso: string | null | undefined): Date | null {
  const match = MOMENT.exec(iso ?? "");
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  if (h === undefined) return new Date(+y, +mo - 1, +d, 23, 59, 59, 999);
  return new Date(+y, +mo - 1, +d, +h, +mi, +(s ?? 0));
}

/** Past its due moment (nothing due = never overdue) */
export function isOverdue(dueMoment: string | null | undefined, now = new Date()): boolean {
  const due = parseMoment(dueMoment);
  return !!due && due.getTime() < now.getTime();
}

const dayNumber = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;

/**
 * The due moment in words, by calendar day: "Overdue by 2 days" / "Overdue" (earlier today) /
 * "Today" / "Tomorrow" / "In 5 days"; null when nothing is due.
 */
export function dueInWords(
  dueMoment: string | null | undefined,
  now = new Date(),
): { text: string; overdue: boolean; today: boolean } | null {
  const due = parseMoment(dueMoment);
  if (!due) return null;
  const days = dayNumber(due) - dayNumber(now);
  if (due.getTime() < now.getTime()) {
    const late = -days;
    return { text: late <= 0 ? "Overdue" : `Overdue by ${late} ${late === 1 ? "day" : "days"}`, overdue: true, today: false };
  }
  if (days === 0) return { text: "Today", overdue: false, today: true };
  if (days === 1) return { text: "Tomorrow", overdue: false, today: false };
  return { text: `In ${days} days`, overdue: false, today: false };
}

/** The summary above the home card's list: overdue, due today (not yet overdue), critical or high, nothing due */
export function summarize(items: WorkItem[], now = new Date()) {
  const due = items.map((item) => dueInWords(item.dueMoment, now));
  return {
    overdue: due.filter((d) => d?.overdue).length,
    dueToday: due.filter((d) => d?.today).length,
    urgent: items.filter((item) => ["Critical", "High"].includes(priorityOf(item.priorityKind) ?? "")).length,
    noDueDate: due.filter((d) => !d).length,
  };
}

/** "23/10/2026 14:30" in the user's date format, as the server wrote it (no time when midnight or absent) */
export function formatMoment(iso: string | null | undefined, format: DateFormat): string {
  const date = formatDate(iso, format);
  if (!date) return "";
  const match = MOMENT.exec(iso ?? "");
  const time = match?.[4] !== undefined ? `${match[4]}:${match[5]}` : "";
  return time && time !== "00:00" ? `${date} ${time}` : date;
}

// ---------------------------------------------------------------- priority

export const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
export type Priority = (typeof PRIORITIES)[number];

/** Accipiens WorkItemPriorityKind: Critical = 1, High = 2, Medium = 3, Low = 4 */
const PRIORITY_KINDS: Record<number, Priority> = { 1: "Critical", 2: "High", 3: "Medium", 4: "Low" };

/**
 * The item's priority (priorityKind), or null when it has none. The API writes the kind's
 * name ("Critical"), although its schema says number: both are read.
 */
export function priorityOf(kind: unknown): Priority | null {
  if (typeof kind === "number") return PRIORITY_KINDS[kind] ?? null;
  if (typeof kind === "string") return PRIORITIES.find((p) => p.toLowerCase() === kind.trim().toLowerCase()) ?? null;
  return null;
}

/** Results-view tone per priority (Critical red, High orange, Medium yellow, Low green) */
export const PRIORITY_TONES: Record<Priority, Tone> = {
  Low: "success",
  Medium: "warning",
  High: "orange",
  Critical: "danger",
};

/** The operation or entity the item is about, when it has one */
export const workItemSubject = (item: WorkItemDto): string | null => item.credOper || item.entity || null;

export const workItemTitle = (item: WorkItemDto) => item.title?.trim() || "Untitled task";

// ---------------------------------------------------------------- errors

/**
 * What a failed work-items request means (ProblemDetails `code`):
 *  - positionForbidden: the position is no longer the user's → back to their own
 *  - unavailable: the API can't reach Accipiens → "temporarily unavailable" + retry
 *  - invalidRequest: bad paging/state/sort → a bug on our side (logged)
 */
export type WorkItemsProblem = "positionForbidden" | "unavailable" | "invalidRequest" | "other";

export function workItemsProblem(error: unknown): WorkItemsProblem | null {
  if (!error || typeof error !== "object") return null;
  const { status, data } = error as { status?: unknown; data?: { code?: unknown } };
  const code = data && typeof data === "object" ? data.code : undefined;
  if (status === 403 && code === "work_item_position_forbidden") return "positionForbidden";
  // A position id the API no longer recognises (an old bookmark, keys changed): same handling
  if (status === 400 && code === "invalid_id") return "positionForbidden";
  if (status === 502 || code === "backend_unavailable") return "unavailable";
  if (status === 400 && code === "validation_failed") return "invalidRequest";
  return "other";
}

// ---------------------------------------------------------------- search

export const WORK_ITEM_STATES: { value: AplWorkItemInternalState; name: string; label: string }[] = [
  { value: 10, name: "initial", label: "Initial" },
  { value: 11, name: "active", label: "Active" },
  { value: 12, name: "resolved", label: "Resolved" },
  { value: 13, name: "closed", label: "Closed" },
  { value: 14, name: "canceled", label: "Canceled" },
];

export const WORK_ITEM_SORTS: { value: AplWorkItemSortingType; name: string; label: string }[] = [
  { value: 1, name: "worklist", label: "Worklist" },
  { value: 2, name: "agenda", label: "Agenda" },
  { value: 3, name: "creation", label: "Creation" },
  { value: 4, name: "type-priority", label: "Type, priority, begin" },
  { value: 5, name: "priority-creation", label: "Priority, creation date" },
];

export const DEFAULT_SORT: AplWorkItemSortingType = 1;
