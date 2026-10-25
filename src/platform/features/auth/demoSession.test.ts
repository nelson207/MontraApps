import { jwtDecode } from "jwt-decode";
import { describe, expect, it } from "vitest";
import { APPS_CLAIM } from "../appSwitcher/appAccess";
import { DEMO_USER, demoToken, isDemoToken } from "./demoSession";

const NAME_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";

describe("demoToken", () => {
  const now = Date.UTC(2026, 9, 6, 9, 0, 0);
  const claims = jwtDecode<Record<string, unknown>>(demoToken(now));

  it("signs in as the demo user, with access to every Montra app", () => {
    expect(claims[NAME_CLAIM]).toBe(DEMO_USER);
    expect(claims[APPS_CLAIM]).toEqual([700, 701, 702, 703, 704, 705]);
  });

  it("expires 8 hours later", () => expect(claims.exp).toBe(now / 1000 + 8 * 3600));
});

describe("isDemoToken", () => {
  it("recognises the demo session token, and nothing else", () => {
    expect(isDemoToken(demoToken())).toBe(true);
    expect(isDemoToken("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl")).toBe(false);
    expect(isDemoToken(null)).toBe(false);
  });
});
