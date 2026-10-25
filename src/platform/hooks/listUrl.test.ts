import { describe, expect, it } from "vitest";
import { listUrl, rememberListUrl } from "./listUrl";

const memoryStorage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
};

describe("listUrl", () => {
  it("is the bare path when nothing was remembered", () => {
    expect(listUrl("/news", memoryStorage())).toBe("/news");
  });

  it("returns the path with the remembered filters", () => {
    const storage = memoryStorage();
    rememberListUrl("/news", "?category=Compliance", storage);
    expect(listUrl("/news", storage)).toBe("/news?category=Compliance");
  });

  it("forgets the filters once they are cleared", () => {
    const storage = memoryStorage();
    rememberListUrl("/admin/users", "?q=ana", storage);
    rememberListUrl("/admin/users", "", storage);
    expect(listUrl("/admin/users", storage)).toBe("/admin/users");
  });

  it("works without storage (private mode, blocked)", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(() => rememberListUrl("/news", "?q=x", broken)).not.toThrow();
    expect(listUrl("/news", broken)).toBe("/news");
  });
});
