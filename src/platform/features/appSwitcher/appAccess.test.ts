import { describe, expect, it } from "vitest";
import { accessibleApps, appIdsFromClaim, appIdsFromToken, MONTRA_APPLICATIONS, type MontraApp } from "./appAccess";

const app = (id: string, name: string, url: string | null = `/${id}`): MontraApp => ({
  id,
  name,
  description: "",
  icon: "bi-app",
  url,
});
const CREDIT = app("credit", "Montra Credit", "/");
const LAWYER = app("lawyer", "Montra Lawyer");
const REGISTRY = [CREDIT, LAWYER];

describe("appIdsFromClaim (apps: MontraAplApplications codes)", () => {
  it("reads the enum codes of the token's apps claim", () =>
    expect(appIdsFromClaim([700, 701, 702, 703, 704, 705])).toEqual(["app", "credit", "lawyer", "stockcredit", "factoring", "customer"]));

  it("reads the enum names and codes as text", () =>
    expect(appIdsFromClaim(["MONTRA_APPLICATION_CREDIT", "703", "MONTRA_APPLICATION_STOCK"])).toEqual(["credit", "stockcredit"]));

  it("ignores codes that aren't Montra applications", () => expect(appIdsFromClaim([701, 999])).toEqual(["credit"]));

  it("each enum value names its app and its screen customization identifier", () =>
    expect(MONTRA_APPLICATIONS.find((a) => a.code === 703)).toEqual({
      code: 703,
      identifier: "MONTRA_APPLICATION_STOCK",
      appId: "stockcredit",
    }));
});

describe("appIdsFromToken", () => {
  it("reads the apps claim, or the older AplApplications one", () => {
    expect(appIdsFromToken({ apps: [701, 702] })).toEqual(["credit", "lawyer"]);
    expect(appIdsFromToken({ AplApplications: ["Credit"] })).toEqual(["credit"]);
    expect(appIdsFromToken({})).toBeNull();
  });
});

describe("appIdsFromClaim (AplApplications, older names)", () => {
  it("reads a list of app names or ids, in any case, with or without 'Montra'", () =>
    expect(appIdsFromClaim(["Credit", "MONTRA LAWYER", "montraFactoring"])).toEqual(["credit", "lawyer", "factoring"]));

  it("reads a comma / space separated string and a JSON array string", () => {
    expect(appIdsFromClaim("Credit, Lawyer")).toEqual(["credit", "lawyer"]);
    expect(appIdsFromClaim('["Credit","Lawyer"]')).toEqual(["credit", "lawyer"]);
  });

  it("reads Stock Credit in its usual spellings as one id", () =>
    expect(appIdsFromClaim(["StockCredit", "Montra Stock Credit", "stock_credit"])).toEqual(["stockcredit"]));

  it("reads objects with a code or name", () =>
    expect(appIdsFromClaim([{ code: "Credit" }, { name: "Lawyer" }])).toEqual(["credit", "lawyer"]));

  it("is null when the claim is missing or unreadable", () => {
    expect(appIdsFromClaim(undefined)).toBeNull();
    expect(appIdsFromClaim(true)).toBeNull();
  });
});

describe("accessibleApps", () => {
  it("lists the apps the user has that exist, current first", () =>
    expect(accessibleApps(REGISTRY, ["lawyer", "credit", "factoring"], "credit").map((a) => a.id)).toEqual(["credit", "lawyer"]));

  it("without the claim, only the current app", () =>
    expect(accessibleApps(REGISTRY, null, "credit").map((a) => a.id)).toEqual(["credit"]));

  it("always includes the app the user is in", () =>
    expect(accessibleApps(REGISTRY, ["lawyer"], "credit").map((a) => a.id)).toEqual(["credit", "lawyer"]));

  it("leaves out apps that aren't available yet (no url)", () =>
    expect(accessibleApps([CREDIT, app("lawyer", "Montra Lawyer", null)], ["credit", "lawyer"], "credit").map((a) => a.id)).toEqual(["credit"]));

  it("lists the current app even before it has a url (e.g. running Lawyer locally)", () =>
    expect(accessibleApps([CREDIT, app("lawyer", "Montra Lawyer", null)], ["credit"], "lawyer").map((a) => a.id)).toEqual([
      "lawyer",
      "credit",
    ]));
});
