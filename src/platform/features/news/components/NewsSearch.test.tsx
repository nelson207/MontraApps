// @vitest-environment jsdom
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearNewsImages } from "../api/newsImageCache";
import { apiNews, mockFetch, NEWS_TYPES, renderWithApi, type MockAnswer } from "../testing/renderWithApi";
import NewsSearch from "./NewsSearch";

afterEach(() => {
  cleanup();
  clearNewsImages();
  vi.unstubAllGlobals();
});

/** The search answered by `answer` (types and pictures answered too); returns the search requests' params */
function api(answer: (params: URLSearchParams) => MockAnswer = () => ({ json: { items: [], page: 1, pageSize: 20, totalCount: 0 } })) {
  const { requests } = mockFetch((url) => {
    if (url.pathname === "/api/news/search") return answer(url.searchParams);
    if (url.pathname === "/api/news/types") return { json: NEWS_TYPES };
    if (url.pathname.endsWith("/image")) return { status: 404, json: { status: 404 } };
    return undefined;
  });
  return () => requests.filter((r) => new URL(r.url).pathname === "/api/news/search").map((r) => new URL(r.url).searchParams);
}

const page = (items: unknown[], totalCount = items.length) => ({ json: { items, page: 1, pageSize: 20, totalCount } });

describe("news search (GET /api/news/search)", () => {
  it("leaves empty params out (no search, no 'all types')", async () => {
    const searches = api();
    renderWithApi(<NewsSearch />, { route: "/news" });
    await waitFor(() => expect(searches()).toHaveLength(1));
    const params = searches()[0];
    expect([...params.keys()].sort()).toEqual(["page", "pageSize", "portal"]);
    expect(params.get("portal")).toBe("MONTRA_APPLICATION_CREDIT");
    expect(params.get("pageSize")).toBe("20");
  });

  it("reads its state from the URL (?q=&type=&page=)", async () => {
    const searches = api();
    renderWithApi(<NewsSearch />, { route: "/news?q=golf&type=2&page=2" });
    await waitFor(() => expect(searches()).toHaveLength(1));
    expect(Object.fromEntries(searches()[0])).toMatchObject({ search: "golf", newsTypeId: "2", page: "2" });
    expect((screen.getByRole("searchbox", { name: "Search news" }) as HTMLInputElement).value).toBe("golf");
  });

  it("calls the API once for debounced typing", async () => {
    const searches = api();
    renderWithApi(<NewsSearch />, { route: "/news" });
    await waitFor(() => expect(searches()).toHaveLength(1));

    await userEvent.type(screen.getByRole("searchbox", { name: "Search news" }), "rates");
    await waitFor(() => expect(searches().some((p) => p.get("search") === "rates")).toBe(true));
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(searches().filter((p) => p.has("search"))).toHaveLength(1);
  });

  it("changing a filter goes back to page 1", async () => {
    const searches = api();
    renderWithApi(<NewsSearch />, { route: "/news?page=3" });
    await waitFor(() => expect(searches()[0]?.get("page")).toBe("3"));

    await userEvent.click(await screen.findByRole("button", { name: /Compliance/ }));
    await waitFor(() => expect(searches().at(-1)?.get("newsTypeId")).toBe("2"));
    expect(searches().at(-1)?.get("page")).toBe("1");
  });

  it("ignores a slow answer to an older request", async () => {
    const searches = api((params) =>
      params.get("search") === "slow"
        ? { ...page([apiNews(1, { title: "Old answer" })]), delay: 300 }
        : page([apiNews(2, { title: "New answer" })]),
    );
    renderWithApi(<NewsSearch />, { route: "/news?q=slow" });
    await waitFor(() => expect(searches()).toHaveLength(1));

    const box = screen.getByRole("searchbox", { name: "Search news" });
    await userEvent.clear(box);
    await userEvent.type(box, "fast");
    expect(await screen.findByText("New answer")).toBeTruthy();
    // The slow answer arrives after the new one
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(screen.queryByText("Old answer")).toBeNull();
    expect(screen.getByText("New answer")).toBeTruthy();
  });
});
