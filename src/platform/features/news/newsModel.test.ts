import { describe, expect, it } from "vitest";
import { toNewsItem, webLink } from "./newsModel";

const now = new Date("2026-10-21T12:00:00Z");
const types = new Map([[4, "Products"]]);

describe("toNewsItem", () => {
  it("names the type from the news types and keeps the dates and link", () => {
    const item = toNewsItem(
      {
        id: "news-1",
        title: " New rates ",
        newsTypeId: 4,
        validityBeginDate: "2026-10-01",
        validityEndDate: "2026-12-31",
        linkUrl: "https://example.com/rates",
      },
      types,
      now,
    );
    expect(item).toMatchObject({
      id: "news-1",
      title: "New rates",
      category: "Products",
      status: "active",
      linkUrl: "https://example.com/rates",
      image: null,
    });
  });

  it("shows an unknown type by its number, and no type as General", () => {
    expect(toNewsItem({ id: "news-1", title: "x", newsTypeId: 7 }, types, now)?.category).toBe("Type 7");
    expect(toNewsItem({ id: "news-1", title: "x" }, types, now)?.category).toBe("General");
  });

  it("keeps a direct picture (sample news)", () => {
    expect(toNewsItem({ id: "news-1", title: "x", image: "https://img/1.jpg" }, types, now)?.image).toBe("https://img/1.jpg");
  });

  it("drops items without an id or a title", () => {
    expect(toNewsItem({ title: "x" }, types, now)).toBeNull();
    expect(toNewsItem({ id: "news-2", title: "  " }, types, now)).toBeNull();
    // A numeric id is not an API id any more (ids are opaque strings)
    expect(toNewsItem({ id: 3 as unknown as string, title: "x" }, types, now)).toBeNull();
  });
});

describe("Read more link (webLink)", () => {
  it("keeps http(s) addresses and completes a bare www.", () => {
    expect(webLink("https://montra.pt/news/1")).toBe("https://montra.pt/news/1");
    expect(webLink(" http://montra.pt ")).toBe("http://montra.pt/");
    expect(webLink("www.montra.pt/a")).toBe("https://www.montra.pt/a");
  });

  it("anything else gets no button", () => {
    for (const value of [null, "", "  ", "montra.pt", "/news/1", String.raw`C:\docs\a.pdf`, "javascript:alert(1)", "mailto:a@b.pt", "https://intranet"]) {
      expect(webLink(value)).toBeNull();
    }
  });
});
