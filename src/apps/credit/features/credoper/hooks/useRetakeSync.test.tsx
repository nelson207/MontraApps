// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { TEST_TOKEN } from "@platform/features/news/testing/renderWithApi";
import credoperReducer, { patchCredoper, startNew } from "../credoperSlice";
import { RETAKE_DELAY_MS, useRetakeSync } from "./useRetakeSync";

type RetakeBody = {
  calculate: "Amount" | "Percentage";
  asset: { equipment?: { purchaseAmount?: number; retakeAmount?: number | null; retakePercentage?: number | null } };
};

/** POST /api/equipments/retake, answered when the test says (in any order), as the API works it out */
function retakeServer() {
  const pending: { body: RetakeBody; answer: () => void }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init);
      const body = (await request.json()) as RetakeBody;
      const equipment = body.asset.equipment ?? {};
      const base = equipment.purchaseAmount ?? 0;
      const retakeAmount =
        body.calculate === "Amount" ? ((equipment.retakePercentage ?? 0) * base) / 100 : (equipment.retakeAmount ?? 0);
      const retakePercentage = body.calculate === "Percentage" ? (retakeAmount / base) * 100 : equipment.retakePercentage;
      const json = { ...body.asset, baseAmount: base - retakeAmount, equipment: { ...equipment, retakeAmount, retakePercentage } };
      return new Promise<Response>((resolve) =>
        pending.push({
          body,
          answer: () => resolve(new Response(JSON.stringify(json), { status: 200, headers: { "content-type": "application/json" } })),
        }),
      );
    }),
  );
  return pending;
}

function setup() {
  const store = configureStore({
    reducer: {
      [emptySplitApi.reducerPath]: emptySplitApi.reducer,
      auth: () => ({ token: TEST_TOKEN, isAuthenticated: true }),
      credoper: credoperReducer,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
  });
  store.dispatch(
    startNew({
      insurances: [],
      assets: [{ correlationID: "a-1", assetType: 1, equipment: { netAmount: 20000, purchaseAmount: 20000, odometer: 12 } }],
    }),
  );
  const { result } = renderHook(() => useRetakeSync(), {
    wrapper: ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>,
  });
  /** The user types the percentage (the store first, as FinancingFields does) */
  const typePercentage = (retakePercentage: number) => {
    const asset = store.getState().credoper.data!.assets![0];
    store.dispatch(patchCredoper({ assets: [{ ...asset, equipment: { ...asset.equipment, retakePercentage } }] }));
    result.current.typed("Amount");
  };
  const first = () => store.getState().credoper.data!.assets![0];
  return { store, result, typePercentage, first };
}

/** Lets fetch and the answer's handling run */
const settle = () => act(() => vi.advanceTimersByTimeAsync(0));

describe("useRetakeSync", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("asks the API once typing stops, and its answer replaces the asset (the other field and the base amount)", async () => {
    const pending = retakeServer();
    const { typePercentage, first } = setup();
    act(() => {
      typePercentage(1);
      typePercentage(10);
    });
    await act(() => vi.advanceTimersByTimeAsync(RETAKE_DELAY_MS - 1));
    expect(pending).toHaveLength(0);
    await act(() => vi.advanceTimersByTimeAsync(1));
    await settle();
    expect(pending.map((p) => p.body.calculate)).toEqual(["Amount"]);
    expect(pending[0].body.asset.equipment?.retakePercentage).toBe(10);

    pending[0].answer();
    await settle();
    expect(first().equipment).toMatchObject({ retakePercentage: 10, retakeAmount: 2000 });
    expect(first().baseAmount).toBe(18000);
    // What only the app keeps stays
    expect(first()).toMatchObject({ correlationID: "a-1", equipment: { odometer: 12 } });
  });

  it("answers out of order: only the latest one counts", async () => {
    const pending = retakeServer();
    const { result, typePercentage, first } = setup();
    act(() => typePercentage(10));
    act(() => result.current.flush());
    await settle();
    act(() => typePercentage(25));
    act(() => result.current.flush());
    await settle();
    expect(pending).toHaveLength(2);

    pending[1].answer();
    await settle();
    pending[0].answer();
    await settle();
    expect(first().equipment).toMatchObject({ retakePercentage: 25, retakeAmount: 5000 });
    expect(first().baseAmount).toBe(15000);
  });

  it("the asset changed while asking (another field): that edit stands", async () => {
    const pending = retakeServer();
    const { store, result, typePercentage, first } = setup();
    act(() => typePercentage(10));
    act(() => result.current.flush());
    await settle();
    const asset = first();
    store.dispatch(patchCredoper({ assets: [{ ...asset, equipment: { ...asset.equipment, licencePlate: "AA-00-BB" } }] }));

    pending[0].answer();
    await settle();
    expect(first().equipment?.licencePlate).toBe("AA-00-BB");
    expect(first().baseAmount).toBeUndefined();
  });
});
