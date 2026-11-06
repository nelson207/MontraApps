// @vitest-environment jsdom
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { emptySplitApi } from "@platform/api/emptyApi";
import { mockFetch, renderWithApi, TEST_TOKEN } from "@platform/features/news/testing/renderWithApi";
import credoperReducer, { markSaved } from "@credit/features/credoper/credoperSlice";
import SearchOperationsPage from "./SearchOperationsPage";

const makeStore = () =>
  configureStore({
    reducer: {
      [emptySplitApi.reducerPath]: emptySplitApi.reducer,
      auth: () => ({ token: TEST_TOKEN, isAuthenticated: true }),
      credoper: credoperReducer,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
  });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Search: Convert to proposal", () => {
  it("only a saved quotation's row offers it, to the proposal screen converting it", async () => {
    mockFetch((url) =>
      url.pathname === "/api/credit-operations/search"
        ? {
            json: {
              items: [
                { id: "AQ/quote", number: 4521, step: "Quotation", entityName: "João Silva" },
                { id: "APprop", number: 4522, step: "Proposal", entityName: "Ana Silva" },
                { id: "ACcontract", number: 4523, step: "Contract", entityName: "Rui Costa" },
              ],
              page: 1,
              pageSize: 50,
              totalCount: 3,
            },
          }
        : undefined,
    );
    // @ts-expect-error the helper's store type is the platform's; this one adds the operation
    renderWithApi(<SearchOperationsPage />, { route: "/search", store: makeStore() });
    const convert = await screen.findAllByRole("link", { name: /to a proposal/i });
    expect(convert).toHaveLength(1);
    expect(convert[0].getAttribute("aria-label")).toBe("Convert quotation 4521 to a proposal");
    expect(convert[0].getAttribute("href")).toBe("/proposal?fromQuotation=AQ%2Fquote");
    // Beside the row's own link (never inside it)
    expect(convert[0].closest(".app-results-row")).toBeNull();
  });

  it("a quotation a proposal was saved from in this session doesn't offer it again", async () => {
    mockFetch((url) =>
      url.pathname === "/api/credit-operations/search"
        ? { json: { items: [{ id: "AQ/quote", number: 4521, step: "Quotation", entityName: "João Silva" }], page: 1, pageSize: 50, totalCount: 1 } }
        : undefined,
    );
    const store = makeStore();
    store.dispatch(markSaved({ id: "AP", credOperStep: 2, sourceCredOperId: "AQ/quote", insurances: [] }));
    // @ts-expect-error the helper's store type is the platform's; this one adds the operation
    renderWithApi(<SearchOperationsPage />, { route: "/search", store });
    await screen.findByText("João Silva");
    expect(screen.queryByRole("link", { name: /to a proposal/i })).toBeNull();
  });
});
