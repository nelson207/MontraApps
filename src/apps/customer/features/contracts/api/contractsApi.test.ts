import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { MontraPOSApi } from "@platform/api/generated/MontraPOSApi";
import { isNotAvailable } from "./contractsApi";

const endpoints = MontraPOSApi.endpoints as unknown as Record<string, { initiate: (arg?: unknown) => unknown }>;

const makeStore = () =>
  configureStore({
    reducer: { [MontraPOSApi.reducerPath]: MontraPOSApi.reducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(MontraPOSApi.middleware),
  });

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });

describe("contractsApi", () => {
  const fetchMock = vi.fn<(request: Request) => Promise<Response>>();
  const urls = () => fetchMock.mock.calls.map(([request]) => new URL(request.url));

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("encodes the opaque ids in the path", async () => {
    fetchMock.mockResolvedValue(json({ id: "a/b+c", number: 1 }));
    const result = (await makeStore().dispatch(endpoints.getContract.initiate("a/b+c") as never)) as { data: unknown };
    expect(urls()[0].pathname).toBe("/api/customer-portal/contracts/a%2Fb%2Bc");
    expect(result.data).toMatchObject({ id: "a/b+c", number: 1 });
  });

  it("asks for the filter's statuses, repeating the key, and for the page", async () => {
    fetchMock.mockResolvedValue(json({ installments: [] }));
    await makeStore().dispatch(endpoints.getCashflow.initiate({ contractId: "c", filter: "upcoming", page: 2, pageSize: 12 }) as never);
    const { searchParams, pathname } = urls()[0];
    expect(pathname).toBe("/api/customer-portal/contracts/c/cash-flow");
    expect(searchParams.getAll("status")).toEqual(["Overdue", "InCollection", "NotInvoiced", "Next", "Scheduled"]);
    expect(searchParams.get("page")).toBe("2");
    expect(searchParams.get("pageSize")).toBe("12");
  });

  it("the whole schedule asks for no status", async () => {
    fetchMock.mockResolvedValue(json({ installments: [] }));
    await makeStore().dispatch(endpoints.getCashflow.initiate({ contractId: "c", filter: "all", page: 1, pageSize: 12 }) as never);
    expect(urls()[0].searchParams.has("status")).toBe(false);
  });

  it("an empty account is an empty list", async () => {
    fetchMock.mockResolvedValue(json({ items: [], counts: [] }));
    const result = (await makeStore().dispatch(endpoints.getContracts.initiate() as never)) as { data: unknown };
    expect(result.data).toEqual([]);
  });

  it("the PDF comes back as a file named after the document", async () => {
    const created = vi.fn(() => "blob:pdf");
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: created }));
    fetchMock.mockResolvedValue(new Response(new Blob(["%PDF"], { type: "application/pdf" }), { status: 200, headers: { "content-type": "application/pdf" } }));
    const result = (await makeStore().dispatch(endpoints.getDocumentPdf.initiate({ id: "d/1", number: "FT 2026/1" }) as never)) as { data: unknown };
    expect(urls()[0].pathname).toBe("/api/customer-portal/documents/d%2F1/pdf");
    expect(result.data).toEqual({ url: "blob:pdf", fileName: "FT_2026_1.pdf" });
  });

  it("a failed PDF keeps the problem's JSON, for the session's handling and its message", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ title: "No PDF", status: 404, code: "not_found" }), { status: 404 }));
    const result = (await makeStore().dispatch(endpoints.getDocumentPdf.initiate({ id: "d", number: "X" }) as never)) as { error: { status: number; data: unknown } };
    expect(result.error.status).toBe(404);
    expect(result.error.data).toMatchObject({ code: "not_found" });
  });
});

describe("isNotAvailable", () => {
  it.each([403, 404])("%s is not this customer's contract", (status) => expect(isNotAvailable({ status, data: {} })).toBe(true));
  it("a mangled id is too", () => expect(isNotAvailable({ status: 400, data: { code: "invalid_id" } })).toBe(true));
  it.each([500, "FETCH_ERROR"])("%s is a failed read, to retry", (status) => expect(isNotAvailable({ status, data: {} })).toBe(false));
});
