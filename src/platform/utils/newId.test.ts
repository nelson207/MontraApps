import { afterEach, describe, expect, it, vi } from "vitest";
import { newId } from "./newId";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("newId", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is a v4 UUID", () => {
    expect(newId()).toMatch(UUID_V4);
  });

  it("works where crypto.randomUUID is missing (http page opened by IP)", () => {
    vi.stubGlobal("crypto", { getRandomValues: globalThis.crypto.getRandomValues.bind(globalThis.crypto) });
    const ids = new Set(Array.from({ length: 100 }, () => newId()));
    expect(ids.size).toBe(100);
    ids.forEach((id) => expect(id).toMatch(UUID_V4));
  });
});
