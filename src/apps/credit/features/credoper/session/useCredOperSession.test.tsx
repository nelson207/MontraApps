// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { problemStatus } from "@platform/api/problemCode";
import { mockFetch, TEST_TOKEN } from "@platform/features/news/testing/renderWithApi";
import { conversionErrorMessage } from "../api/credOperApi";
import credoperReducer, { markSaved, patchCredoper, startNew } from "../credoperSlice";
import { convertQuotationPath, useCredOperSession } from "./useCredOperSession";

// The work context only matters for a new operation
vi.mock("@platform/features/workContext/hooks/useWorkContext", () => ({
  useWorkContext: () => ({ isReady: true, isError: false, selection: null }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function makeStore() {
  return configureStore({
    reducer: {
      [emptySplitApi.reducerPath]: emptySplitApi.reducer,
      auth: () => ({ token: TEST_TOKEN, isAuthenticated: true }),
      credoper: credoperReducer,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
  });
}

/** What the proposal screen's session decided, as text */
function Probe() {
  const session = useCredOperSession("proposal");
  const location = useLocation();
  return (
    <output data-testid="session">
      {JSON.stringify({
        status: session.status,
        path: location.pathname + location.search,
        convertFrom: session.convertFrom,
        discardsTo: session.discardsTo,
        errorStatus: problemStatus(session.loadError) ?? null,
        source: session.operation?.sourceCredOperId ?? null,
      })}
    </output>
  );
}

function renderAt(route: string, store = makeStore()) {
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/proposal" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return { store, session: () => JSON.parse(screen.getByTestId("session").textContent!) as Record<string, unknown> };
}

const CONVERSION = {
  proposal: { id: null, credOperStep: "Proposal", correlationId: "c-9", sourceCredOperId: "AQq", aplCompanyId: 1, aplBusinessId: 3, credOperTypeId: 300 },
  quotation: { id: "AQq", number: 4521, customerName: "João Silva" },
};

const answering = (status: number, json: unknown) =>
  mockFetch((url) =>
    url.pathname.endsWith("/quotation-to-proposal")
      ? { status, json }
      : url.pathname === "/api/credit-operations/new-intervention"
        ? { json: { credOperIntervType: 1 } }
        : undefined,
  );

describe("Convert to proposal (/proposal?fromQuotation=…)", () => {
  it("opens the new proposal as returned, unsaved, and leaves the conversion out of the URL", async () => {
    const { requests } = answering(200, CONVERSION);
    const { store, session } = renderAt(convertQuotationPath("AQq"));
    await waitFor(() => expect(session().status).toBe("ready"));
    expect(session()).toMatchObject({ path: "/proposal", source: "AQq" });
    expect(new URL(requests[0].url).pathname).toBe("/api/credit-operations/credoper/AQq/quotation-to-proposal");
    const { data, isDirty } = store.getState().credoper;
    expect(isDirty).toBe(true);
    expect(data).toMatchObject({ correlationId: "c-9", sourceCredOperId: "AQq", credOperTypeId: 300, sourceQuotation: CONVERSION.quotation });
    expect(data?.id).toBeNull();
  });

  it("converts once: editing the proposal afterwards doesn't ask for it again", async () => {
    const { requests } = answering(200, CONVERSION);
    const { store, session } = renderAt(convertQuotationPath("AQq"));
    await waitFor(() => expect(session().status).toBe("ready"));
    act(() => {
      store.dispatch(patchCredoper({ amount: 1 }));
    });
    await waitFor(() => expect(session().status).toBe("ready"));
    expect(requests.filter((request) => request.url.endsWith("/quotation-to-proposal"))).toHaveLength(1);
  });

  it("a quotation a proposal was already saved from: an error, without asking the API", async () => {
    const { requests } = answering(200, CONVERSION);
    const store = makeStore();
    store.dispatch(markSaved({ id: "AP", credOperStep: 2, sourceCredOperId: "AQq", insurances: [] }));
    const { session } = renderAt(convertQuotationPath("AQq"), store);
    await waitFor(() => expect(session().status).toBe("error"));
    expect(requests.filter((request) => request.url.endsWith("/quotation-to-proposal"))).toHaveLength(0);
  });

  it("a failed conversion is an error, and isn't tried again by itself", async () => {
    const { requests } = answering(502, { status: 502, code: "backend_unavailable" });
    const { session } = renderAt(convertQuotationPath("AQq"));
    await waitFor(() => expect(session().status).toBe("error"));
    expect(requests.filter((request) => request.url.endsWith("/quotation-to-proposal"))).toHaveLength(1);
  });

  it("over unsaved work it asks first (nothing asked of the API meanwhile)", () => {
    const { fetchMock } = answering(200, CONVERSION);
    const store = makeStore();
    store.dispatch(startNew({ id: "op5" }));
    store.dispatch(patchCredoper({ amount: 1 }));
    const { session } = renderAt(convertQuotationPath("AQq"), store);
    expect(session()).toMatchObject({ status: "prompt", discardsTo: "convert" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [404, { title: "Not found", status: 404 }, "Quotation not found."],
    [400, { title: "Bad request", status: 400, code: "validation_failed" }, "Only a quotation can be converted to a proposal."],
  ])("a %i: the error screen for the conversion, nothing loaded", async (status, problem, message) => {
    answering(status, problem);
    const { store, session } = renderAt(convertQuotationPath("AQq"));
    await waitFor(() => expect(session().status).toBe("error"));
    expect(session()).toMatchObject({ convertFrom: "AQq", errorStatus: status });
    expect(conversionErrorMessage({ status, data: problem })).toContain(message);
    expect(store.getState().credoper.data).toBeNull();
  });
});
