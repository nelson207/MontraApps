import { describe, expect, it } from "vitest";
import pt from "../../i18n/pt-PT.json";

const files = import.meta.glob(["./**/*.{ts,tsx}", "!./**/*.test.*"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;

const uses = Object.values(files).flatMap((source) =>
  [...source.matchAll(/\btx\(\s*"([^"]+)",\s*"((?:[^"\\]|\\.)*)"/g)].map(([, key, english]) => ({ key, english })),
);

const portuguese = (key: string) => key.split(".").reduce<unknown>((value, part) => (value as Record<string, unknown> | undefined)?.[part], pt.stock);
const placeholders = (text: string) => [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort();

describe("stock texts", () => {
  it("finds the texts", () => expect(uses.length).toBeGreaterThan(100));

  it("every text is translated to Portuguese, with the same placeholders", () => {
    const wrong = uses.filter(({ key, english }) => {
      const text = portuguese(key);
      return typeof text !== "string" || !text.trim() || JSON.stringify(placeholders(text)) !== JSON.stringify(placeholders(english));
    });
    expect(wrong).toEqual([]);
  });

  it("one key always has the same English text", () => {
    const first = new Map<string, string>();
    const conflicts = uses.filter(({ key, english }) => {
      if (!first.has(key)) first.set(key, english);
      return first.get(key) !== english;
    });
    expect(conflicts).toEqual([]);
  });
});
