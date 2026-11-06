// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { mockFetch, TEST_TOKEN } from "@platform/features/news/testing/renderWithApi";
import type { CredOperIntervDto } from "@platform/api/legacy/legacyApi";
import credoperReducer, { startNew } from "../../credoperSlice";
import entityLookupReducer from "../../entityLookup/entityLookupSlice";
import type { ClassificationOption, CredOperInput } from "../../model/credOperDraft";
import type { StepProps } from "../../wizard/stepTypes";
import InterventionsStep from "./InterventionsStep";

const OPTIONS: ClassificationOption[] = [
  { code: "1", abbreviation: "Private", description: null, entitySuperType: "Person" },
  { code: "3", abbreviation: "Corporate", description: null, entitySuperType: "Company" },
  { code: "4", abbreviation: "Public body", description: null, entitySuperType: null },
];
const CUSTOMER: CredOperIntervDto = { id: "i1", correlationID: "p1", credOperIntervType: 1, person: {}, entity: { id: "e1", fullName: "Ana Silva" } };

function setup(operation: Partial<CredOperInput>, errors: Record<string, string> = {}) {
  const { requests } = mockFetch((url) =>
    url.pathname.endsWith("/new-intervention")
      ? { json: { credOperIntervType: url.searchParams.get("kind") === "Guarantor" ? 4 : 2, entity: { kind: "Person", person: {} } } }
      : undefined,
  );
  const store = configureStore({
    reducer: {
      [emptySplitApi.reducerPath]: emptySplitApi.reducer,
      auth: () => ({ token: TEST_TOKEN, isAuthenticated: true }),
      credoper: credoperReducer,
      entityLookup: entityLookupReducer,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
  });
  // Auto insurance has no Financial data step: its classification is chosen here
  store.dispatch(startNew({ credOperStep: 2, aplBusinessId: 4, insurances: [], ...operation }));
  const formProps = { options: { credOperClassifications: OPTIONS, financialProducts: [] }, fetchingOptions: {} };
  render(
    <Provider store={store}>
      <InterventionsStep {...({ errors, formProps } as unknown as StepProps)} />
    </Provider>,
  );
  return { store, requests };
}

const addCard = (name: RegExp) => screen.getByRole("button", { name }) as HTMLButtonElement;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("adding people needs a classification", () => {
  it("none chosen: nothing can be added, the field to choose it is there, and it says why", () => {
    const { requests } = setup({ interventions: [] });
    expect(addCard(/Add second holder/).disabled).toBe(true);
    expect(addCard(/Add guarantor/).disabled).toBe(true);
    expect(addCard(/Add guarantor/).textContent).toContain("Choose a contract classification first.");
    expect(screen.getByLabelText("Contract classification")).toBeTruthy();
    expect(requests).toEqual([]);
  });

  it("one that can't have a customer: the same", () => {
    setup({ credOperClassification: 4, interventions: [] });
    expect(addCard(/Add guarantor/).disabled).toBe(true);
    expect(addCard(/Add guarantor/).textContent).toContain("This classification can't be used to create a customer");
  });

  it("no free place for the card either: not offered in the head", () => {
    const person = (n: number, type: number): CredOperIntervDto => ({ correlationID: `p${n}`, credOperIntervType: type, person: {}, entity: { fullName: `P${n}` } });
    setup({ interventions: [person(1, 1), person(2, 2), person(3, 4), person(4, 4)] });
    expect(screen.queryByRole("button", { name: /add guarantor/i })).toBeNull();
  });

  it("the customer missing is said on the field once errors show", () => {
    setup({ interventions: [] }, { "interventions.customer": "The customer is missing." });
    expect(screen.getByText("The customer is missing.")).toBeTruthy();
  });

  it.each([
    [/Add guarantor/, "?kind=Guarantor"],
    [/Add second holder/, "?kind=SecondHolder"],
  ])("chosen: %s asks with no classification, and opens as a person", async (card, search) => {
    const { requests, store } = setup({ credOperClassification: 1, interventions: [{ ...CUSTOMER }] });
    expect(addCard(card).disabled).toBe(false);
    await userEvent.click(addCard(card));
    await waitFor(() => expect(store.getState().credoper.data?.interventions).toHaveLength(2));
    expect(new URL(requests.find((request) => request.url.includes("new-intervention"))!.url).search).toBe(search);
    expect(screen.getByRole("tab", { name: /Person Details/ })).toBeTruthy();
  });
});

describe("the classification on this step", () => {
  it("financed: only while it stands in the way", () => {
    // aplBusinessId 3: financed, with its own Financial data step
    setup({ aplBusinessId: 3, credOperClassification: 1, interventions: [{ ...CUSTOMER }] });
    expect(screen.queryByLabelText("Contract classification")).toBeNull();
  });

  it("a saved customer that no longer matches: told here too", () => {
    setup({ aplBusinessId: 3, credOperClassification: 3, interventions: [{ ...CUSTOMER }] });
    expect(screen.getByRole("alert").textContent).toContain("must be replaced by hand");
  });

  it("no second opinion on the kind: nothing on this step lets the user change it", () => {
    setup({ aplBusinessId: 3, credOperClassification: 3, interventions: [{ ...CUSTOMER, id: null, entity: { entityTypeId: 2, fullName: "Acme" } }] });
    expect(screen.getByRole("button", { name: /Company Details/ })).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: /kind|type/i })).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
  });
});
