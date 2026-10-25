import { describe, expect, it } from "vitest";
import { DEFAULT_TASK_VIEW, taskViewFromParams, taskViewToParams, type TaskView } from "./taskView";

const roundTrip = (view: TaskView) => {
  const params = taskViewToParams(view);
  return taskViewFromParams((key) => params[key] ?? null);
};

describe("task view in the URL (/tasks)", () => {
  it("the default view writes nothing", () =>
    expect(Object.values(taskViewToParams(DEFAULT_TASK_VIEW)).every((value) => value === null)).toBe(true));

  it("position, states, number, sort and page survive the URL", () => {
    const view: TaskView = { positionId: "AQ7c2L0x-_pos", states: [12, 13], number: "1234", sort: 2, page: 3 };
    expect(taskViewToParams(view)).toEqual({
      position: "AQ7c2L0x-_pos",
      state: "resolved,closed",
      number: "1234",
      sort: "agenda",
      page: "3",
    });
    expect(roundTrip(view)).toEqual(view);
  });

  it("every state selected is the same as all (nothing written)", () =>
    expect(taskViewToParams({ ...DEFAULT_TASK_VIEW, states: [10, 11, 12, 13, 14] }).state).toBeNull());

  it("no state selected is kept apart from all", () => expect(roundTrip({ ...DEFAULT_TASK_VIEW, states: [] }).states).toEqual([]));

  it("unknown or malformed values fall back to the defaults", () =>
    expect(
      taskViewFromParams((key) => ({ state: "bogus", number: "12a", sort: "random", page: "-4" })[key] ?? null),
    ).toEqual(DEFAULT_TASK_VIEW));

  it("the position is the API's opaque id, kept as it came (the API validates it)", () =>
    expect(taskViewFromParams((key) => (key === "position" ? "AQ7c2L0x-_x" : null)).positionId).toBe("AQ7c2L0x-_x"));
});
