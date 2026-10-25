import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import themeReducer from "@platform/features/theme/themeSlice";

// Test helper (component tests): a real store with the API (requests go through the app's
// client: base URL, bearer token…) and a mocked fetch answering by path.

export const API_ORIGIN = "https://localhost:5165";
export const TEST_TOKEN = "header.payload.signature";

export type MockAnswer = { status?: number; json?: unknown; blob?: Blob; delay?: number };
export type Answerer = (url: URL, request: Request) => MockAnswer | undefined;

/** fetch mocked by `answer`; every request is recorded */
export function mockFetch(answer: Answerer) {
  const requests: Request[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    requests.push(request);
    const reply = answer(new URL(request.url), request) ?? { status: 404, json: { title: "Not found", status: 404 } };
    if (reply.delay) await new Promise((resolve) => setTimeout(resolve, reply.delay));
    const status = reply.status ?? 200;
    if (reply.blob) return new Response(reply.blob, { status, headers: { "content-type": reply.blob.type } });
    return new Response(JSON.stringify(reply.json ?? null), { status, headers: { "content-type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { requests, fetchMock };
}

export function makeStore(token: string | null = TEST_TOKEN) {
  return configureStore({
    reducer: {
      [emptySplitApi.reducerPath]: emptySplitApi.reducer,
      auth: () => ({ token, isAuthenticated: !!token }),
      theme: themeReducer,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
  });
}

export function renderWithApi(ui: ReactElement, { route = "/", store = makeStore() } = {}) {
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </Provider>,
    ),
  };
}

/** A news as the API sends it, valid now unless dates are given */
/** `n` gives a distinct title and an opaque string id ("news-n"), like the API's */
export const apiNews = (n: number, extra: Record<string, unknown> = {}) => ({
  id: `news-${n}`,
  title: `News ${n}`,
  subtitle: `Subtitle ${n}`,
  body: `Body ${n}`,
  newsTypeId: 1,
  validityBeginDate: new Date(Date.now() - 86_400_000).toISOString(),
  validityEndDate: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  ...extra,
});

export const NEWS_TYPES = [
  { id: 1, name: "Products" },
  { id: 2, name: "Compliance" },
];
