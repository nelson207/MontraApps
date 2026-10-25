// @vitest-environment jsdom
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockFetch, renderWithApi, type MockAnswer } from "@platform/features/news/testing/renderWithApi";
import AssignedTasks, { TasksSearch } from "./AssignedTasks";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const POSITIONS = [
  { id: "pSelf7", name: "Ana Silva", isSelf: true },
  { id: "pBack30", name: "Back office", isSelf: false },
];

const item = (id: number, extra: Record<string, unknown> = {}) => ({
  id: `w${id}`,
  number: 1000 + id,
  title: `Task ${id}`,
  type: "Proposal",
  state: "Active",
  priority: "Alta",
  priorityKind: "High",
  dueMoment: "2099-01-01T10:00:00",
  ...extra,
});

const page = (items: unknown[], totalCount = items.length, pageNumber = 1): MockAnswer => ({
  json: { items, page: pageNumber, pageSize: 25, totalCount },
});

/** The work-items API answered by `lists`; returns the list requests' params */
function api(lists: (path: string, params: URLSearchParams) => MockAnswer, positions: MockAnswer = { json: POSITIONS }) {
  const { requests } = mockFetch((url) => {
    if (url.pathname === "/api/work-items/positions") return positions;
    if (url.pathname === "/api/work-items/dashboard" || url.pathname === "/api/work-items/search")
      return lists(url.pathname, url.searchParams);
    return undefined;
  });
  return {
    requests,
    lists: (path = "/api/work-items/dashboard") =>
      requests.filter((r) => new URL(r.url).pathname === path).map((r) => new URL(r.url).searchParams),
    positionCalls: () => requests.filter((r) => new URL(r.url).pathname === "/api/work-items/positions").length,
  };
}

describe("task dashboard (GET /api/work-items/dashboard)", () => {
  it("lists the user's Active tasks in the API's order, with number, type, state, priority and subject", async () => {
    const { lists } = api(() => page([item(2, { credOper: "OP-77" }), item(1, { dueMoment: "2001-01-01T09:00:00" })]));
    renderWithApi(<AssignedTasks />);

    const rows = await screen.findAllByRole("button", { name: /Task \d/ });
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("Task 2"),
      expect.stringContaining("Task 1"),
    ]);
    expect(rows[0].textContent).toContain("#1002");
    expect(rows[0].textContent).toContain("OP-77");
    expect(rows[0].textContent).toContain("Proposal");
    // Priority in its colour, and the row's accent bar
    expect(rows[0].querySelector(".badge.app-priority-high")?.textContent).toBe("High");
    expect(rows[0].querySelector(".app-results-accent.tone-orange")).toBeTruthy();
    expect(rows[1].textContent).toContain("Overdue");
    expect(rows[1].querySelector(".text-danger")).toBeTruthy();
    // The user's own queue: no positionId
    expect(lists()[0].has("positionId")).toBe(false);
    expect(lists()[0].get("page")).toBe("1");
  });

  it("switching position reloads the list for it, from page 1", async () => {
    const { lists } = api((_, params) => page([item(Number(params.get("page")))], 60, Number(params.get("page"))));
    renderWithApi(<AssignedTasks />);
    await screen.findByText("Task 1");

    await userEvent.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() => expect(lists().at(-1)?.get("page")).toBe("2"));

    await userEvent.click(screen.getByRole("button", { name: "Back office" }));
    await waitFor(() => expect(lists().at(-1)?.get("positionId")).toBe("pBack30"));
    expect(lists().at(-1)?.get("page")).toBe("1");
  });

  it("no position selector when the user has only their own queue", async () => {
    api(() => page([item(1)]), { json: [POSITIONS[0]] });
    renderWithApi(<AssignedTasks />);
    await screen.findByText("Task 1");
    expect(screen.queryByRole("group", { name: "Whose tasks" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Me" })).toBeNull();
  });

  it("empty: 'No active tasks'", async () => {
    api(() => page([]));
    renderWithApi(<AssignedTasks />);
    expect(await screen.findByText("No active tasks")).toBeTruthy();
  });

  it("403 work_item_position_forbidden: positions reloaded, back to the user's own queue, with a notice", async () => {
    const { lists, positionCalls } = api((_, params) =>
      params.get("positionId") === "pBack30"
        ? { status: 403, json: { status: 403, code: "work_item_position_forbidden" } }
        : page([item(1)]),
    );
    renderWithApi(<AssignedTasks />);
    await screen.findByText("Task 1");

    await userEvent.click(screen.getByRole("button", { name: "Back office" }));
    expect(await screen.findByText(/no longer have access to that queue/)).toBeTruthy();
    await waitFor(() => expect(lists().at(-1)?.has("positionId")).toBe(false));
    expect(positionCalls()).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("502 backend_unavailable: 'temporarily unavailable' with a retry", async () => {
    let down = true;
    api(() => (down ? { status: 502, json: { status: 502, code: "backend_unavailable" } } : page([item(5)])));
    renderWithApi(<AssignedTasks />);

    expect(await screen.findByText("Tasks are temporarily unavailable.")).toBeTruthy();
    down = false;
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Task 5")).toBeTruthy();
  });

  it("400 validation_failed is logged (a bug on our side)", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    api(() => ({ status: 400, json: { status: 400, code: "validation_failed" } }));
    renderWithApi(<AssignedTasks />);

    expect(await screen.findByText("Couldn't load your tasks.")).toBeTruthy();
    expect(log).toHaveBeenCalledWith(expect.stringContaining("validation_failed"), expect.anything());
    log.mockRestore();
  });

  it("the refresh button reloads the list", async () => {
    const { lists } = api(() => page([item(1)]));
    renderWithApi(<AssignedTasks />);
    await screen.findByText("Task 1");
    const before = lists().length;

    await userEvent.click(screen.getByRole("button", { name: "Refresh tasks" }));
    await waitFor(() => expect(lists().length).toBe(before + 1));
  });
});

describe("a bookmarked position the API no longer recognises (400 invalid_id)", () => {
  it("goes back to the user's own queue with a notice", async () => {
    const { lists } = api((_, params) =>
      params.get("PositionId") === "stale-id"
        ? { status: 400, json: { status: 400, code: "invalid_id" } }
        : page([item(1)]),
    );
    renderWithApi(<TasksSearch />, { route: "/tasks?position=stale-id" });

    expect(await screen.findByText(/no longer have access to that queue/)).toBeTruthy();
    await waitFor(() => expect(lists("/api/work-items/search").at(-1)?.has("PositionId")).toBe(false));
    expect(await screen.findByText("Task 1")).toBeTruthy();
  });
});

describe("task search (GET /api/work-items/search)", () => {
  it("sends the states as repeated keys and the URL's filters", async () => {
    const { lists } = api(() => page([item(1)]));
    renderWithApi(<TasksSearch />, { route: "/tasks?position=pBack30&state=resolved,closed&number=1001&sort=agenda" });
    await screen.findByText("Task 1");

    const params = lists("/api/work-items/search")[0];
    expect(params.getAll("States")).toEqual(["12", "13"]);
    expect(params.get("PositionId")).toBe("pBack30");
    expect(params.get("Number")).toBe("1001");
    expect(params.get("Sort")).toBe("2");
  });

  it("all states: none sent; no state selected: nothing asked", async () => {
    const { lists } = api(() => page([item(1)]));
    renderWithApi(<TasksSearch />, { route: "/tasks" });
    await screen.findByText("Task 1");
    expect(lists("/api/work-items/search")[0].has("States")).toBe(false);

    cleanup();
    const second = api(() => page([item(1)]));
    renderWithApi(<TasksSearch />, { route: "/tasks?state=none" });
    expect(await screen.findByText("Select at least one state.")).toBeTruthy();
    expect(second.lists("/api/work-items/search")).toHaveLength(0);
  });
});

describe("home card layout", () => {
  it("summary of the queue when it all fits on the page; rows show only what the task has", async () => {
    api(() =>
      page([
        item(1, { dueMoment: "2001-01-01T09:00:00", priorityKind: "Critical" }),
        item(2, { dueMoment: null, type: null, state: null, credOper: null, priorityKind: "Low" }),
      ]),
    );
    renderWithApi(<AssignedTasks />);
    const summary = await screen.findByRole("list", { name: "Summary" });
    expect(summary.textContent).toContain("1overdue");
    expect(summary.textContent).toContain("1critical / high");
    expect(summary.textContent).toContain("1no due date");

    const sparse = screen.getByRole("button", { name: /Task 2/ });
    expect(sparse.textContent).toContain("No details");
    expect(sparse.textContent).toContain("No due date");
  });

  it("no summary while only part of the queue is on screen (until the API totals it)", async () => {
    api(() => page([item(1)], 60));
    renderWithApi(<AssignedTasks />);
    await screen.findByText("Task 1");
    expect(screen.queryByRole("list", { name: "Summary" })).toBeNull();
  });
});
