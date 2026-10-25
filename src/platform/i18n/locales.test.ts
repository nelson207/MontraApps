import { describe, expect, it } from "vitest";
import pt from "./locales/pt-PT/index";
import { EN } from "./resources";

/** "a.b.c" for every text of a namespace */
const keys = (value: unknown, prefix = ""): string[] =>
  value && typeof value === "object"
    ? Object.entries(value).flatMap(([key, child]) => keys(child, prefix ? `${prefix}.${key}` : key))
    : [prefix];

/** {{name}} placeholders of a text */
const placeholders = (text: string) => [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort();

const at = (value: unknown, path: string) => path.split(".").reduce<unknown>((v, k) => (v as Record<string, unknown>)?.[k], value);

describe("Portuguese texts", () => {
  for (const [ns, en] of Object.entries(EN)) {
    const translated = pt[ns as keyof typeof pt];

    it(`${ns}: every English text is translated`, () => {
      const missing = keys(en).filter((key) => typeof at(translated, key) !== "string" || !(at(translated, key) as string).trim());
      expect(missing).toEqual([]);
    });

    it(`${ns}: the same placeholders`, () => {
      const different = keys(en).filter(
        (key) => JSON.stringify(placeholders(at(en, key) as string)) !== JSON.stringify(placeholders(String(at(translated, key) ?? ""))),
      );
      expect(different).toEqual([]);
    });
  }
});
