// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { mockFetch } from "@platform/features/news/testing/renderWithApi";
import workContextReducer, { setWorkContext, type StoredWorkContext } from "../workContextSlice";
import { hierarchyApiForTests } from "./hierarchyApi";

afterEach(() => vi.unstubAllGlobals());

const saved: StoredWorkContext = {
  origin: "live",
  selection: {
    organization: { id: "sn-org", name: "Auto Crédito" },
    unit: { id: "sn-sup", name: "Stand 01" },
    member: { id: "sn-old-vendor", name: "Rui" },
  },
};

const storeWith = (stored: StoredWorkContext) => {
  const store = configureStore({
    reducer: {
      [emptySplitApi.reducerPath]: emptySplitApi.reducer,
      auth: () => ({ token: "t", isAuthenticated: true }),
      workContext: workContextReducer,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
  });
  store.dispatch(setWorkContext(stored as Parameters<typeof setWorkContext>[0]));
  return store;
};

/** Credit's struct-node API, with the saved vendor answered by `vendor` */
const api = (vendor: { status?: number; json: unknown }) =>
  mockFetch((url) => {
    if (url.pathname === "/api/struct-nodes/me") return { json: { isSupervisor: true, ownNodes: [], anchors: [] } };
    if (url.pathname === "/api/struct-nodes/intermediaries") return { json: { items: [], totalCount: 0 } };
    if (url.pathname === "/api/struct-nodes/sn-old-vendor") return vendor;
    return undefined;
  });

describe("a saved working context checked at start-up", () => {
  it("is forgotten when the API no longer recognises its ids (400 invalid_id)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    api({ status: 400, json: { status: 400, code: "invalid_id" } });
    const store = storeWith(saved);
    await store.dispatch(hierarchyApiForTests.endpoints.getWorkProfile.initiate());
    expect(store.getState().workContext.stored).toBeUndefined();
  });

  it("is kept while the node is still valid", async () => {
    const { requests } = api({ json: { id: "sn-old-vendor", name: "Rui" } });
    const store = storeWith(saved);
    await store.dispatch(hierarchyApiForTests.endpoints.getWorkProfile.initiate());
    expect(store.getState().workContext.stored).toEqual(saved);
    // The saved id is sent back exactly as the API gave it
    expect(requests.some((r) => new URL(r.url).pathname === "/api/struct-nodes/sn-old-vendor")).toBe(true);
  });
});
