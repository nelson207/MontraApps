import { describe, expect, it } from "vitest";
import {
  currentPosition,
  dueInWords,
  summarize,
  formatMoment,
  isOverdue,
  positionLabel,
  PRIORITIES,
  PRIORITY_TONES,
  priorityOf,
  positionParam,
  toPositions,
  workItemsOf,
  workItemsProblem,
  workItemSubject,
} from "./workItemsModel";

const positions = toPositions([
  { id: "AQ7c2L0xSelf", name: "Ana Silva", isSelf: true },
  { id: "Bk0ffice30xx", name: "Back office", isSelf: false },
  { name: "no id" },
]);

describe("positions", () => {
  it("keeps the API's order, drops entries without an id, labels the user 'Me'", () => {
    expect(positions.map((p) => p.id)).toEqual(["AQ7c2L0xSelf", "Bk0ffice30xx"]);
    expect(positions.map(positionLabel)).toEqual(["Me", "Back office"]);
  });

  it("the chosen position while it's still the user's, otherwise their own", () => {
    expect(currentPosition(positions, "Bk0ffice30xx")?.id).toBe("Bk0ffice30xx");
    expect(currentPosition(positions, null)?.id).toBe("AQ7c2L0xSelf");
    expect(currentPosition(positions, "unknown")?.id).toBe("AQ7c2L0xSelf");
    expect(currentPosition([], null)).toBeNull();
  });

  it("the user's own queue is asked without positionId (the API's default)", () => {
    expect(positionParam(positions[0])).toBeUndefined();
    expect(positionParam(positions[1])).toBe("Bk0ffice30xx");
  });
});

describe("work items", () => {
  it("items without an id are dropped", () =>
    expect(workItemsOf({ items: [{ id: "w1" }, { title: "x" }, { id: "" }], totalCount: 3 }).map((i) => i.id)).toEqual(["w1"]));

  it("the operation, else the entity", () => {
    expect(workItemSubject({ credOper: "OP-1", entity: "Ana" })).toBe("OP-1");
    expect(workItemSubject({ credOper: null, entity: "Ana" })).toBe("Ana");
    expect(workItemSubject({})).toBeNull();
  });
});

describe("dates are the server's local time, shown as written", () => {
  const now = new Date(2026, 9, 23, 12, 0); // 23 Oct 2026 12:00 local

  it("overdue compares local times (no UTC conversion)", () => {
    expect(isOverdue("2026-10-23T11:59:00", now)).toBe(true);
    expect(isOverdue("2026-10-23T12:30:00", now)).toBe(false);
    expect(isOverdue(null, now)).toBe(false);
  });

  it("a due date without a time is due at the end of that day", () => {
    expect(isOverdue("2026-10-23", now)).toBe(false);
    expect(isOverdue("2026-10-22", now)).toBe(true);
  });

  it("formatted in the user's date format, with the time when there is one", () => {
    expect(formatMoment("2026-10-23T14:30:00", "dd/MM/yyyy")).toBe("23/10/2026 14:30");
    expect(formatMoment("2026-10-23T00:00:00", "yyyy-MM-dd")).toBe("2026-10-23");
    expect(formatMoment(null, "dd/MM/yyyy")).toBe("");
  });
});

describe("errors (ProblemDetails code)", () => {
  it("maps the documented answers", () => {
    expect(workItemsProblem({ status: 403, data: { code: "work_item_position_forbidden" } })).toBe("positionForbidden");
    expect(workItemsProblem({ status: 502, data: { code: "backend_unavailable" } })).toBe("unavailable");
    expect(workItemsProblem({ status: 400, data: { code: "validation_failed" } })).toBe("invalidRequest");
    // A position id the API no longer recognises (old bookmark): back to the user's own queue too
    expect(workItemsProblem({ status: 400, data: { code: "invalid_id" } })).toBe("positionForbidden");
    expect(workItemsProblem({ status: 500, data: {} })).toBe("other");
    expect(workItemsProblem(undefined)).toBeNull();
  });
});

describe("priority (Accipiens WorkItemPriorityKind)", () => {
  it("reads the kind as the API writes it (name) or as its schema says (number)", () => {
    expect(["Critical", "high", " Medium ", "Low"].map(priorityOf)).toEqual(["Critical", "High", "Medium", "Low"]);
    expect([1, 2, 3, 4].map(priorityOf)).toEqual(["Critical", "High", "Medium", "Low"]);
  });

  it("no kind, or an unknown one: no priority", () => {
    expect([null, undefined, 0, 9, "Urgent"].map(priorityOf)).toEqual([null, null, null, null, null]);
  });

  it("every priority has its tone", () =>
    expect(PRIORITIES.map((p) => PRIORITY_TONES[p])).toEqual(["success", "warning", "orange", "danger"]));
});

describe("due in words (calendar days, local time)", () => {
  const now = new Date(2026, 9, 23, 12, 0);
  it("overdue, today, tomorrow, in N days", () => {
    expect(dueInWords("2026-10-21T17:00:00", now)?.text).toBe("Overdue by 2 days");
    expect(dueInWords("2026-10-22T17:00:00", now)?.text).toBe("Overdue by 1 day");
    expect(dueInWords("2026-10-23T09:00:00", now)).toEqual({ text: "Overdue", overdue: true, today: false });
    expect(dueInWords("2026-10-23T18:00:00", now)).toEqual({ text: "Today", overdue: false, today: true });
    expect(dueInWords("2026-10-24", now)?.text).toBe("Tomorrow");
    expect(dueInWords("2026-10-30T08:00:00", now)?.text).toBe("In 7 days");
    expect(dueInWords(null, now)).toBeNull();
  });

  it("the summary counts each kind once", () =>
    expect(
      summarize(
        [
          { id: "w1", dueMoment: "2026-10-22T10:00:00", priorityKind: 1 },
          { id: "w2", dueMoment: "2026-10-23T18:00:00", priorityKind: 2 },
          { id: "w3", dueMoment: null, priorityKind: 4 },
        ],
        now,
      ),
    ).toEqual({ overdue: 1, dueToday: 1, urgent: 2, noDueDate: 1 }));
});
