// @vitest-environment jsdom
import { cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearNewsImages } from "../api/newsImageCache";
import { makeStore, mockFetch, renderWithApi, TEST_TOKEN } from "../testing/renderWithApi";
import NewsImage from "./NewsImage";

const item = (id: string) => ({ id, image: null, category: "Products" });
const imageRequests = (requests: Request[], id: string) => requests.filter((r) => r.url.endsWith(`/api/news/${id}/image`));

let created: string[];
let revoked: string[];

beforeEach(() => {
  created = [];
  revoked = [];
  // jsdom has no object URLs
  URL.createObjectURL = vi.fn(() => {
    const url = `blob:test/${created.length + 1}`;
    created.push(url);
    return url;
  });
  URL.revokeObjectURL = vi.fn((url: string) => void revoked.push(url));
});

afterEach(() => {
  cleanup();
  clearNewsImages();
  vi.unstubAllGlobals();
});

describe("news pictures (GET /api/news/{id}/image)", () => {
  it("is fetched with the bearer token and shown through an object URL, revoked on unmount", async () => {
    const { requests } = mockFetch((url) =>
      url.pathname === "/api/news/AQ7c2L0x-7/image" ? { blob: new Blob(["png"], { type: "image/png" }) } : undefined,
    );
    const { container, unmount } = renderWithApi(<NewsImage item={item("AQ7c2L0x-7")} />);

    await waitFor(() => expect(container.querySelector("img")?.getAttribute("src")).toBe("blob:test/1"));
    expect(imageRequests(requests, "AQ7c2L0x-7")[0].headers.get("authorization")).toBe(`Bearer ${TEST_TOKEN}`);

    unmount();
    expect(revoked).toEqual(["blob:test/1"]);
  });

  it("a news without a picture (404) shows the placeholder and is never asked again", async () => {
    const { requests } = mockFetch(() => ({ status: 404, json: { title: "Not found", status: 404 } }));
    const store = makeStore();

    const first = renderWithApi(<NewsImage item={item("AQ7c2L0x-8")} />, { store });
    await waitFor(() => expect(imageRequests(requests, "AQ7c2L0x-8")).toHaveLength(1));
    expect(first.container.querySelector(".app-news-image-fallback")).toBeTruthy();
    expect(first.container.querySelector("img")).toBeNull();
    first.unmount();

    // Shown again (same session): no new request, still the placeholder
    const second = renderWithApi(<NewsImage item={item("AQ7c2L0x-8")} />, { store });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(imageRequests(requests, "AQ7c2L0x-8")).toHaveLength(1);
    expect(second.container.querySelector(".app-news-image-fallback")).toBeTruthy();
    expect(created).toEqual([]);
  });

  it("an id the API no longer recognises (400 invalid_id) shows the placeholder", async () => {
    mockFetch(() => ({ status: 400, json: { status: 400, code: "invalid_id" } }));
    const { container } = renderWithApi(<NewsImage item={item("stale")} />);
    await waitFor(() => expect(container.querySelector(".app-news-image-fallback")).toBeTruthy());
    expect(container.querySelector("img")).toBeNull();
  });

  it("each news gets its own URL; showing another news revokes the previous one", async () => {
    mockFetch((url) => (url.pathname.endsWith("/image") ? { blob: new Blob(["x"], { type: "image/jpeg" }) } : undefined));
    const store = makeStore();
    const { container, rerender } = renderWithApi(<NewsImage item={item("AQ7c2L0x-1")} />, { store });
    await waitFor(() => expect(container.querySelector("img")?.getAttribute("src")).toBe("blob:test/1"));

    const { Provider } = await import("react-redux");
    const { MemoryRouter } = await import("react-router-dom");
    rerender(
      <Provider store={store}>
        <MemoryRouter>
          <NewsImage item={item("AQ7c2L0x-2")} />
        </MemoryRouter>
      </Provider>,
    );
    await waitFor(() => expect(container.querySelector("img")?.getAttribute("src")).toBe("blob:test/2"));
    expect(revoked).toContain("blob:test/1");
  });
});
