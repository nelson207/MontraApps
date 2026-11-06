// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider, useSelector } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { mockFetch, TEST_TOKEN, type MockAnswer } from "@platform/features/news/testing/renderWithApi";
import credoperReducer, { loadExisting, startBlank, startConverted } from "../credoperSlice";
import { patchCredoper } from "../credoperSlice";
import { COMPANY_ENTITY_TYPE_ID, type ClassificationOption, type CredOperDraft, type CredOperInput } from "../model/credOperDraft";
import { useCredOperTemplate } from "./useCredOperTemplate";

// When a proposal's customer is asked for (GET new-intervention): only when it has none, and with
// a classification that says what it must be

const DECIDED = { credOperStep: 2, aplBusinessId: 3, aplCompanyId: 1, assetTypeId: null, credOperClassification: 1, insurances: [] } as CredOperInput;

const option = (id: number, entitySuperType: ClassificationOption["entitySuperType"]): ClassificationOption => ({
  code: String(id),
  abbreviation: `Classification ${id}`,
  description: null,
  entitySuperType,
});
const CLASSIFICATIONS = [option(1, "Person"), option(2, "Company"), option(3, null)];

function setup(
  open: Parameters<typeof credoperReducer>[1],
  template: MockAnswer = { json: { correlationId: "c-1" } },
  customer: () => MockAnswer = () => ({ json: { credOperIntervType: 1 } }),
) {
  const { requests } = mockFetch((url) =>
    url.pathname.endsWith("/new-intervention") ? customer() : url.pathname.endsWith("/new-credoper") ? template : undefined,
  );
  const store = configureStore({
    reducer: {
      [emptySplitApi.reducerPath]: emptySplitApi.reducer,
      auth: () => ({ token: TEST_TOKEN, isAuthenticated: true }),
      credoper: credoperReducer,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
  });
  store.dispatch(open);
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const { result } = renderHook(
    () => {
      const operation = useSelector((state: { credoper: { data: CredOperDraft | null } }) => state.credoper.data)!;
      return useCredOperTemplate("proposal", operation, CLASSIFICATIONS);
    },
    { wrapper },
  );
  const asked = (path: string) => requests.filter((request) => new URL(request.url).pathname.endsWith(path));
  return { store, result, asked };
}

const settled = (store: ReturnType<typeof setup>["store"]) =>
  waitFor(() => {
    const { awaitingTemplate, data } = store.getState().credoper;
    expect(awaitingTemplate).toBe(false);
    expect(data?.interventions).toHaveLength(1);
  });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("a proposal's customer", () => {
  it("a blank proposal: asked for once, even though its template comes without one", async () => {
    const { store, asked } = setup(startBlank(DECIDED));
    await settled(store);
    expect(asked("/new-credoper")).toHaveLength(1);
    expect(asked("/new-intervention")).toHaveLength(1);
  });

  it("asked for with the classification: the query names it", async () => {
    const { store, asked } = setup(startBlank(DECIDED));
    await settled(store);
    expect(new URL(asked("/new-intervention")[0].url).search).toBe("?kind=Customer&credOperClassificationId=1");
  });

  it.each([
    ["no classification", undefined],
    ["one that can't have a customer", 3],
    ["one that isn't listed", 99],
  ])("%s: not asked for, and nothing waits for it", async (_, credOperClassification) => {
    const { store, result, asked } = setup(startBlank({ ...DECIDED, credOperClassification }));
    await waitFor(() => expect(store.getState().credoper.awaitingTemplate).toBe(false));
    expect(asked("/new-intervention")).toEqual([]);
    expect(store.getState().credoper.data?.interventions ?? []).toEqual([]);
    expect(result.current.isPending).toBe(false);
  });

  it("asked for once a classification is chosen, opening as what the API says it is", async () => {
    const answer = { credOperIntervType: 1, entity: { kind: "Company", company: {} } };
    const { store, asked } = setup(startBlank({ ...DECIDED, credOperClassification: undefined }), undefined, () => ({ json: answer }));
    await waitFor(() => expect(store.getState().credoper.awaitingTemplate).toBe(false));
    expect(asked("/new-intervention")).toEqual([]);

    act(() => {
      store.dispatch(patchCredoper({ credOperClassification: 2 }));
    });

    await settled(store);
    expect(new URL(asked("/new-intervention")[0].url).search).toBe("?kind=Customer&credOperClassificationId=2");
    expect(store.getState().credoper.data?.interventions?.[0].entity?.entityTypeId).toBe(COMPANY_ENTITY_TYPE_ID);
  });

  it("a blank proposal that already has one: not asked for", async () => {
    const { store, asked } = setup(startBlank({ ...DECIDED, interventions: [{ credOperIntervType: 1, correlationID: "p1" }] }));
    await settled(store);
    expect(asked("/new-intervention")).toEqual([]);
  });

  it("with only a guarantor: asked for, and the guarantor stays", async () => {
    const { store, asked } = setup(startConverted({ ...DECIDED, interventions: [{ credOperIntervType: 4, correlationID: "g1" }] }));
    await waitFor(() => expect(store.getState().credoper.data?.interventions).toHaveLength(2));
    expect(asked("/new-intervention")).toHaveLength(1);
  });

  it("failed: can still be retried once the template is in, instead of leaving the proposal without one", async () => {
    let customer: MockAnswer = { status: 502, json: { title: "Bad gateway", status: 502 } };
    const { store, result, asked } = setup(startBlank(DECIDED), undefined, () => customer);
    await waitFor(() => expect(store.getState().credoper.awaitingTemplate).toBe(false));
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.isPending).toBe(true);

    customer = { json: { credOperIntervType: 1 } };
    act(() => result.current.retry());

    await settled(store);
    expect(asked("/new-intervention")).toHaveLength(2);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("failed, and another classification chosen: that one's asked for, and the failure isn't said anymore", async () => {
    let customer: MockAnswer = { status: 502, json: { title: "Bad gateway", status: 502 } };
    const { store, result, asked } = setup(startBlank(DECIDED), undefined, () => customer);
    await waitFor(() => expect(result.current.error).toBeTruthy());

    customer = { delay: 50, json: { credOperIntervType: 1, entity: { kind: "Company" } } };
    act(() => {
      store.dispatch(patchCredoper({ credOperClassification: 2 }));
    });
    expect(result.current.error).toBeNull();
    await settled(store);
    expect(asked("/new-intervention").map((request) => new URL(request.url).searchParams.get("credOperClassificationId"))).toEqual(["1", "2"]);
  });

  it("a saved proposal is left as the API has it: not asked for", async () => {
    const { store, asked } = setup(loadExisting({ ...DECIDED, id: "AP1", interventions: [] }));
    await waitFor(() => expect(store.getState().credoper.data?.id).toBe("AP1"));
    expect(asked("/new-intervention")).toEqual([]);
  });
});
