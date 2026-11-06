// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { act, cleanup, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { TEST_TOKEN } from "@platform/features/news/testing/renderWithApi";
import credoperReducer, { patchCredoper, startNew } from "../credoperSlice";
import type { CredOperDraft } from "../model/credOperDraft";
import { useCalculation } from "./useCalculation";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const operation = { amount: 15000, insurances: [], interventions: [] } as unknown as CredOperDraft;

function setup(answer: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(answer), { status: 200, headers: { "content-type": "application/json" } })),
  );
  const store = configureStore({
    reducer: {
      [emptySplitApi.reducerPath]: emptySplitApi.reducer,
      auth: () => ({ token: TEST_TOKEN, isAuthenticated: true }),
      credoper: credoperReducer,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
  });
  store.dispatch(startNew(operation));
  const wrapper = ({ children }: { children: ReactNode }) => createElement(Provider, { store, children });
  const hook = renderHook(() => useCalculation(store.getState().credoper.data!), { wrapper });
  return { store, hook };
}

describe("useCalculation messages", () => {
  it("keeps the warnings of a successful calculation", async () => {
    const { hook } = setup({
      isCalculated: true,
      credOper: { amount: 15000 },
      messages: [{ severity: "Warning", text: "Manual analysis will be needed." }],
    });
    await act(() => hook.result.current.run());
    expect(hook.result.current.messages).toEqual([
      { severity: "warning", text: "Manual analysis will be needed.", source: "calculation" },
    ]);
    expect(hook.result.current.error).toBeFalsy();
  });

  it("no longer shows them once the values change", async () => {
    const { hook, store } = setup({
      isCalculated: true,
      credOper: { amount: 15000 },
      messages: [{ severity: "Warning", text: "Manual analysis will be needed." }],
    });
    await act(() => hook.result.current.run());
    act(() => {
      store.dispatch(patchCredoper({ amount: 20000 }));
    });
    hook.rerender();
    expect(hook.result.current.messages).toEqual([]);
  });

  it("lists each reason a calculation was refused", async () => {
    const { hook } = setup({
      isCalculated: false,
      messages: [{ severity: "Error", text: "Term out of range." }, { severity: "Warning", text: "Amount is high." }],
    });
    await act(() => hook.result.current.run());
    expect(hook.result.current.messages.map((m) => m.text)).toEqual(["Term out of range.", "Amount is high."]);
    expect(hook.result.current.error).toBeTruthy();
  });
});
