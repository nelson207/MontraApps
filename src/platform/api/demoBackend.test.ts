import { describe, expect, it } from "vitest";
import { demoResponse, registerDemoHandlers, toDemoRequest } from "./demoBackend";

describe("toDemoRequest", () => {
  it("reads a plain url with its query string", () =>
    expect(toDemoRequest("/api/News?page=2&size=4")).toEqual({
      method: "GET",
      path: "/api/News",
      params: { page: "2", size: "4" },
      body: undefined,
    }));

  it("reads fetch args: method, params and body", () =>
    expect(
      toDemoRequest({ url: "/api/CreditOperations/GetNewCredOper", params: { includeCustomer: true } }),
    ).toEqual({ method: "GET", path: "/api/CreditOperations/GetNewCredOper", params: { includeCustomer: "true" }, body: undefined }));

  it("keeps the body of a POST and upper-cases the method", () =>
    expect(toDemoRequest({ url: "/api/X", method: "post", body: { a: 1 } })).toMatchObject({ method: "POST", body: { a: 1 } }));
});

describe("demoResponse", () => {
  registerDemoHandlers({
    "GET /api/Demo/Echo": (req) => ({ echoed: req.params.value }),
    "POST /api/Demo/Save": (req) => ({ saved: req.body }),
  });

  it("answers a registered method + path", async () => {
    expect(await demoResponse({ url: "/api/Demo/Echo", params: { value: "x" } })).toEqual({ data: { echoed: "x" } });
    expect(await demoResponse({ url: "/api/Demo/Save", method: "POST", body: 1 })).toEqual({ data: { saved: 1 } });
  });

  it("is null for anything not registered (same path, other method too)", async () => {
    expect(await demoResponse("/api/Demo/Unknown")).toBeNull();
    expect(await demoResponse({ url: "/api/Demo/Save" })).toBeNull();
  });
});
