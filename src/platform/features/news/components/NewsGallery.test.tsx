// @vitest-environment jsdom
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearNewsImages } from "../api/newsImageCache";
import { apiNews, mockFetch, NEWS_TYPES, renderWithApi } from "../testing/renderWithApi";
import NewsGallery from "./NewsGallery";

afterEach(() => {
  cleanup();
  clearNewsImages();
  vi.unstubAllGlobals();
});

const answers = (news: () => { status?: number; json?: unknown }) =>
  mockFetch((url) => {
    if (url.pathname === "/api/news") return news();
    if (url.pathname === "/api/news/types") return { json: NEWS_TYPES };
    if (url.pathname.endsWith("/image")) return { status: 404, json: { status: 404 } };
    return undefined;
  });

describe("dashboard news (GET /api/news?portal=)", () => {
  it("asks for the app's portal and shows the news", async () => {
    const { requests } = answers(() => ({ json: [apiNews(1, { title: "New rates" }), apiNews(2, { title: "Maintenance" })] }));
    renderWithApi(<NewsGallery />);

    expect(await screen.findByText("New rates")).toBeTruthy();
    expect(screen.getByText("Maintenance")).toBeTruthy();
    const feed = requests.find((r) => new URL(r.url).pathname === "/api/news")!;
    expect(new URL(feed.url).searchParams.get("portal")).toBe("MONTRA_APPLICATION_CREDIT");
  });

  it("shows up to four at a time; the rest are on the next page", async () => {
    answers(() => ({ json: [1, 2, 3, 4, 5].map((id) => apiNews(id, { title: `News ${id}` })) }));
    renderWithApi(<NewsGallery />);

    expect(await screen.findAllByRole("button", { name: /News \d/ })).toHaveLength(4);
    await userEvent.click(screen.getByRole("button", { name: "Next news" }));
    expect(await screen.findAllByRole("button", { name: /News \d/ })).toHaveLength(1);
  });

  it("a tile has the category, title and the summary to reveal, and opens the preview", async () => {
    answers(() => ({ json: [apiNews(1, { title: "New rates", subtitle: "A lower TAN from today" })] }));
    renderWithApi(<NewsGallery />);

    const tile = await screen.findByRole("button", { name: /New rates/ });
    expect(tile.querySelector(".app-news-card-meta")).toBeTruthy();
    expect(tile.querySelector(".app-news-card-reveal")?.textContent).toBe("A lower TAN from today");
    await userEvent.click(tile);
    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  it("a tile with no summary has nothing to reveal", async () => {
    answers(() => ({ json: [apiNews(1, { title: "New rates", subtitle: null })] }));
    renderWithApi(<NewsGallery />);

    const tile = await screen.findByRole("button", { name: /New rates/ });
    expect(tile.querySelector(".app-news-card-reveal")).toBeNull();
  });

  it("four fit on one page, with no paging", async () => {
    answers(() => ({ json: [1, 2, 3, 4].map((id) => apiNews(id, { title: `News ${id}` })) }));
    renderWithApi(<NewsGallery />);

    expect(await screen.findAllByRole("button", { name: /News \d/ })).toHaveLength(4);
    expect(screen.queryByRole("button", { name: "Next news" })).toBeNull();
  });

  it("shows the empty state for [] (no news is not an error)", async () => {
    answers(() => ({ json: [] }));
    renderWithApi(<NewsGallery />);

    expect(await screen.findByText("No news available at this time")).toBeTruthy();
    expect(screen.getByText("Latest news")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows a retryable error state (502 backend_unavailable)", async () => {
    let failing = true;
    answers(() =>
      failing
        ? { status: 502, json: { title: "Bad gateway", status: 502, code: "backend_unavailable", traceId: "t-1" } }
        : { json: [apiNews(3, { title: "Back again" })] },
    );
    renderWithApi(<NewsGallery />);

    const retry = await screen.findByRole("button", { name: "Retry" });
    failing = false;
    await userEvent.click(retry);
    await waitFor(() => expect(screen.getByText("Back again")).toBeTruthy());
  });
});
