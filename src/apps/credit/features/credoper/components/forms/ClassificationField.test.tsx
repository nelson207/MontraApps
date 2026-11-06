// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { mockFetch, TEST_TOKEN, type MockAnswer } from "@platform/features/news/testing/renderWithApi";
import type { CredOperIntervDto } from "@platform/api/legacy/legacyApi";
import credoperReducer, { startNew } from "../../credoperSlice";
import entityLookupReducer, { choseManual } from "../../entityLookup/entityLookupSlice";
import type { ClassificationOption } from "../../model/credOperDraft";
import ClassificationField from "./ClassificationField";

const OPTIONS: ClassificationOption[] = [
  { code: "1", abbreviation: "Private", description: null, entitySuperType: "Person" },
  { code: "2", abbreviation: "Self-employed", description: null, entitySuperType: "Person" },
  { code: "3", abbreviation: "Corporate", description: null, entitySuperType: "Company" },
  { code: "4", abbreviation: "Public body", description: null, entitySuperType: null },
];

const ANA: CredOperIntervDto = {
  correlationID: "p1",
  credOperIntervType: 1,
  person: { firstName: "Ana", lastName: "Silva" },
  entity: { fullName: "Ana Silva" },
};
const HOLDER: CredOperIntervDto = { correlationID: "p2", credOperIntervType: 2, person: {}, entity: { fullName: "Rui Costa" } };
const GUARANTOR: CredOperIntervDto = { correlationID: "p3", credOperIntervType: 4, person: {}, entity: { fullName: "Eva Reis" } };

const COMPANY_BLANK: MockAnswer = { json: { credOperIntervType: 1, consentUseData: false, entity: { kind: "Company", company: {} } } };

function setup(interventions: CredOperIntervDto[], answer: MockAnswer | (() => MockAnswer) = COMPANY_BLANK, credOperClassification: number | null = 1) {
  const { requests } = mockFetch((url) =>
    url.pathname.endsWith("/new-intervention") ? (typeof answer === "function" ? answer() : answer) : undefined,
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
  store.dispatch(startNew({ credOperStep: 2, credOperClassification, insurances: [], interventions }));
  render(
    <Provider store={store}>
      <ClassificationField options={OPTIONS} />
    </Provider>,
  );
  return Object.assign(store, {
    requests,
    data: () => store.getState().credoper.data!,
  });
}

const open = () => userEvent.click(screen.getByLabelText("Contract classification"));
const pick = async (name: string) => {
  await open();
  await userEvent.click(screen.getByRole("option", { name: new RegExp(`^${name}`) }));
};
const inPrompt = (name: string | RegExp) => within(screen.getByRole("alertdialog")).getByRole("button", { name }) as HTMLButtonElement;

// jsdom has no scrollIntoView, which the list uses to keep its active option in sight
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("a classification with no customer kind", () => {
  it("is listed, disabled, says why, and can't be chosen", async () => {
    const store = setup([], COMPANY_BLANK, null);
    await open();

    const option = screen.getByRole("option", { name: /^Public body/ });
    expect(option.getAttribute("aria-disabled")).toBe("true");
    expect(option.textContent).toContain("This classification can't be used to create a customer");
    expect(screen.getByRole("option", { name: /^Private/ }).getAttribute("aria-disabled")).toBeNull();

    await userEvent.click(option);
    expect(store.data().credOperClassification).toBeNull();
    expect(store.requests).toEqual([]);
  });

  it("can't be chosen from the keyboard either", async () => {
    const store = setup([], COMPANY_BLANK, null);
    await open();
    await userEvent.keyboard("Public{Enter}");
    expect(store.data().credOperClassification).toBeNull();
  });

  it("already on the operation: the field says so", () => {
    setup([], COMPANY_BLANK, 4);
    expect(screen.getByText("This classification can't be used to create a customer")).toBeTruthy();
  });
});

describe("changing the classification", () => {
  it("still matching the new customer: changed, with nothing asked", async () => {
    const store = setup([ANA, HOLDER]);
    await pick("Self-employed");
    expect(store.data().credOperClassification).toBe(2);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(store.data().interventions).toEqual(expect.arrayContaining([expect.objectContaining(ANA)]));
    expect(store.requests).toEqual([]);
  });

  it("no longer matching a new customer: asks first, with keeping things ready to press", async () => {
    const store = setup([ANA]);
    const before = store.getState().credoper;
    await pick("Corporate");

    const text = screen.getByRole("alertdialog", { name: "Replace the customer?" }).textContent;
    expect(text).toContain("Corporate needs a company as the customer, and Ana Silva is a person.");
    expect(text).toContain("The second holder and guarantors stay as they are.");
    expect(document.activeElement).toBe(inPrompt("Keep classification"));
    expect(store.getState().credoper).toEqual(before);
    expect(store.requests).toEqual([]);
  });

  it("not confirmed: nothing changes", async () => {
    const store = setup([ANA]);
    const before = store.getState().credoper;
    await pick("Corporate");
    await userEvent.click(inPrompt("Keep classification"));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(store.getState().credoper).toEqual(before);
  });

  it("becoming a company with a second holder: warned they'll be lost, and they aren't until it's confirmed", async () => {
    const store = setup([ANA, HOLDER, GUARANTOR]);
    const before = store.getState().credoper;
    await pick("Corporate");

    const text = screen.getByRole("alertdialog").textContent;
    expect(text).toContain("Customer is a company: if you proceed, the second holder's information will be lost.");
    expect(text).toContain("Guarantors stay as they are.");
    expect(text).not.toContain("The second holder and guarantors stay");

    await userEvent.click(inPrompt("Keep classification"));
    expect(store.getState().credoper).toEqual(before);
  });

  it("no second holder: no such warning", async () => {
    setup([ANA, GUARANTOR]);
    await pick("Corporate");
    expect(screen.getByRole("alertdialog").textContent).not.toContain("will be lost");
  });

  it("the replacement fails: the second holder is still there", async () => {
    const store = setup([ANA, HOLDER], { status: 502, json: { title: "Bad gateway", status: 502 } });
    await pick("Corporate");
    await userEvent.click(inPrompt("Replace customer"));
    await within(screen.getByRole("alertdialog")).findByRole("alert");
    expect(store.data().interventions?.map((p) => p.correlationID)).toEqual(["p1", "p2"]);
  });

  it("a company customer becoming a person: the second holder isn't touched", async () => {
    const store = setup(
      [{ ...ANA, entity: { entityTypeId: 2, fullName: "Acme" } }, HOLDER],
      { json: { credOperIntervType: 1, entity: { kind: "Person", person: {} } } },
      3,
    );
    await pick("Private");
    expect(screen.getByRole("alertdialog").textContent).not.toContain("will be lost");
    await userEvent.click(inPrompt("Replace customer"));
    await waitFor(() => expect(store.data().credOperClassification).toBe(1));
    expect(store.data().interventions?.[1]).toEqual(HOLDER);
  });

  it("confirmed: a new customer of the new kind in their place, the second holder gone, guarantors as they were", async () => {
    const store = setup([ANA, HOLDER, GUARANTOR]);
    store.dispatch(choseManual({ ref: "p1", vat: "123456789" }));
    await pick("Corporate");
    await userEvent.click(inPrompt("Replace customer"));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());

    expect(store.requests.map((request) => new URL(request.url).search)).toEqual(["?kind=Customer&credOperClassificationId=3"]);
    const { credOperClassification, interventions } = store.data();
    expect(credOperClassification).toBe(3);
    expect(interventions).toHaveLength(2);
    const [customer, guarantor] = interventions!;
    expect(customer).toMatchObject({ correlationID: "p1", credOperIntervType: 1, entity: { entityTypeId: 2 } });
    expect(customer.entity?.fullName ?? "").toBe("");
    expect(guarantor).toEqual(GUARANTOR);
    expect(store.getState().credoper.isDirty).toBe(true);
    // Their search starts over too
    expect(store.getState().entityLookup.p1).toBeUndefined();
  });

  it("the new customer can't be had: said in the box, nothing changed, and it can be tried again", async () => {
    let answer: MockAnswer = { status: 502, json: { title: "Bad gateway", status: 502 } };
    const store = setup([ANA], () => answer);
    const before = store.getState().credoper;
    await pick("Corporate");
    await userEvent.click(inPrompt("Replace customer"));

    const alert = await within(screen.getByRole("alertdialog")).findByRole("alert");
    expect(alert.textContent).toContain("Couldn't replace the customer, so nothing changed.");
    expect(alert.textContent).not.toContain("Bad gateway");
    expect(store.getState().credoper).toEqual(before);

    answer = COMPANY_BLANK;
    await userEvent.click(inPrompt("Replace customer"));
    await waitFor(() => expect(store.data().credOperClassification).toBe(3));
  });

  it("a saved customer: never replaced; the classification changes and the user is told to do it by hand", async () => {
    const saved = { ...ANA, id: "i1" };
    const store = setup([saved, HOLDER]);
    await pick("Corporate");

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(store.requests).toEqual([]);
    expect(store.data().credOperClassification).toBe(3);
    expect(store.data().interventions?.[0]).toMatchObject(saved);
    const warning = screen.getByRole("alert").textContent;
    expect(warning).toContain("The saved customer is a person, but this classification is for companies.");
    expect(warning).toContain("must be replaced by hand");
  });

  it("a saved customer that matches: nothing to say", () => {
    setup([{ ...ANA, id: "i1" }]);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
