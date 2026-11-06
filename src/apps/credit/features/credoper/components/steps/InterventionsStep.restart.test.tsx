// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { mockFetch, TEST_TOKEN, type MockAnswer } from "@platform/features/news/testing/renderWithApi";
import credoperReducer, { loadExisting } from "../../credoperSlice";
import entityLookupReducer, { choseManual } from "../../entityLookup/entityLookupSlice";
import { vatOf, VAT_DOC_TYPE } from "../../entityLookup/entityLookup";
import type { CredOperInput } from "../../model/credOperDraft";
import type { StepProps } from "../../wizard/stepTypes";
import InterventionsStep from "./InterventionsStep";

const OPERATION = {
  id: "APtoken",
  rowVersion: "rv-1",
  correlationId: "c-1",
  credOperStep: 2,
  credOperClassification: 1,
  customerName: "Ana Silva",
  customerVAT: { legalDocTypeId: VAT_DOC_TYPE, legalDocNumber: "123456789" },
  insurances: [],
  interventions: [
    {
      id: "i1",
      correlationID: "p1",
      credOperIntervType: 1,
      person: { firstName: "Ana", lastName: "Silva" },
      entity: { id: "e1", fullName: "Ana Silva", legalDocs: [{ legalDocTypeId: VAT_DOC_TYPE, legalDocNumber: "123456789" }] },
      entityEmail: { email: "ana@example.com" },
    },
    { id: "i2", correlationID: "p2", credOperIntervType: 4, person: {}, entity: { fullName: "Rui Costa" } },
  ],
} as unknown as CredOperInput;

const CLASSIFICATIONS = [
  { code: "1", abbreviation: "Private", description: null, entitySuperType: "Person" },
  { code: "3", abbreviation: "Corporate", description: null, entitySuperType: "Company" },
  { code: "9", abbreviation: "Public", description: null, entitySuperType: null },
];
const FORM_PROPS = { options: { credOperClassifications: CLASSIFICATIONS, financialProducts: [] }, fetchingOptions: {} };

const BLANK: MockAnswer = { json: { credOperIntervType: 1, consentUseData: false } };

function setup(answer: MockAnswer | (() => MockAnswer) = BLANK, operation: Partial<CredOperInput> = {}) {
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
  store.dispatch(loadExisting({ ...OPERATION, ...operation }));
  store.dispatch(choseManual({ ref: "p1", vat: "123456789" }));
  render(
    <Provider store={store}>
      <InterventionsStep {...({ errors: {}, formProps: FORM_PROPS } as unknown as StepProps)} />
    </Provider>,
  );
  return Object.assign(store, { requests });
}

/** The requests for a blank intervention (the form's lists are asked for too) */
const askedForCustomer = (store: { requests: Request[] }) => store.requests.filter((request) => request.url.includes("new-intervention"));

const restart = () => screen.getByRole("button", { name: "Restart customer" });
const prompt = () => screen.getByRole("alertdialog");
const inPrompt = (name: string | RegExp) => within(prompt()).getByRole("button", { name }) as HTMLButtonElement;
/** The customer's restart button, then the dialog's answer */
const askAndRestart = async () => {
  await userEvent.click(restart());
  await userEvent.click(inPrompt("Restart customer"));
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("restarting the customer", () => {
  it("only the customer can be restarted; the others are removed", () => {
    setup();
    expect(screen.getAllByRole("button", { name: "Restart customer" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Remove Rui Costa" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Remove Ana Silva" })).toBeNull();
  });

  it("asks first: who, what's cleared and what stays, with keeping the customer ready to press", async () => {
    const store = setup();
    await userEvent.click(restart());

    const text = prompt().textContent;
    expect(text).toContain("Ana Silva's details will be cleared");
    expect(text).toContain("NIF search");
    expect(text).toContain("The rest of this proposal stays as it is.");
    expect(text).toContain("The saved proposal only changes when you save.");
    expect(document.activeElement).toBe(inPrompt("Keep customer"));
    expect(askedForCustomer(store)).toEqual([]);
  });

  it("a customer with no name yet, on a proposal never saved: says only what applies", async () => {
    setup(BLANK, { id: null, interventions: [{ correlationID: "p1", credOperIntervType: 1, person: {}, entity: {} }] });
    await userEvent.click(restart());
    expect(prompt().textContent).toContain("The customer's details will be cleared");
    expect(prompt().textContent).not.toContain("saved proposal");
  });

  it.each([
    ["Keep customer", () => userEvent.click(inPrompt("Keep customer"))],
    ["Escape", () => userEvent.keyboard("{Escape}")],
  ])("%s: nothing happens, and the focus goes back to the button", async (_, answer) => {
    const store = setup();
    const before = store.getState().credoper;
    await userEvent.click(restart());
    await answer();
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(store.getState().credoper).toEqual(before);
    expect(askedForCustomer(store)).toEqual([]);
    expect(document.activeElement).toBe(restart());
  });

  it("while it runs there's nothing to press, and Escape doesn't close it", async () => {
    setup({ ...BLANK, delay: 400 });
    await userEvent.click(restart());
    await userEvent.click(inPrompt("Restart customer"));
    expect(inPrompt(/Restarting/).disabled).toBe(true);
    expect(inPrompt("Keep customer").disabled).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(prompt()).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("restarted: a blank customer in its place, the NIF search ready to type in, the rest untouched", async () => {
    const store = setup();
    await askAndRestart();

    const nif = await screen.findByLabelText(/^NIF/);
    await waitFor(() => expect(document.activeElement).toBe(nif));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(askedForCustomer(store).map((request) => new URL(request.url).search)).toEqual(["?kind=Customer&credOperClassificationId=1"]);

    const { data, isDirty } = store.getState().credoper;
    const [customer, guarantor] = data!.interventions!;
    // The same person of this operation (saved again, updated rather than added; insurances still linked)
    expect(customer).toMatchObject({ id: "i1", correlationID: "p1", credOperIntervType: 1, consentUseData: false });
    expect(customer.entity?.id ?? null).toBeNull();
    expect(customer.entity?.fullName ?? "").toBe("");
    expect(vatOf(customer)).toBe("");
    expect(customer.entityEmail).toBeUndefined();
    expect(guarantor).toMatchObject({ id: "i2", entity: { fullName: "Rui Costa" } });
    expect(data).toMatchObject({ id: "APtoken", rowVersion: "rv-1", correlationId: "c-1" });
    expect(isDirty).toBe(true);
    expect(store.getState().entityLookup.p1).toBeUndefined();
  });

  it("the old NIF doesn't come back: not from the lookup, nor the operation's customer fields", async () => {
    const store = setup();
    await askAndRestart();

    const nif = (await screen.findByLabelText(/^NIF/)) as HTMLInputElement;
    expect(nif.value).toBe("");
    expect(store.getState().credoper.data?.customerName).toBeUndefined();
    expect(store.getState().credoper.data?.customerVAT).toBeUndefined();
  });

  it("the blank customer can't be fetched: the dialog says so, nothing changed, and it can be tried again", async () => {
    let answer: MockAnswer = { status: 502, json: { title: "Bad gateway", status: 502 } };
    const store = setup(() => answer);
    const before = store.getState().credoper;
    await askAndRestart();

    const alert = await within(prompt()).findByRole("alert");
    expect(alert.textContent).toContain("Couldn't restart the customer, so nothing changed.");
    expect(alert.textContent).not.toContain("Bad gateway");
    expect(store.getState().credoper).toEqual(before);
    expect(store.getState().entityLookup.p1).toBeDefined();

    answer = BLANK;
    await userEvent.click(inPrompt("Restart customer"));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(store.getState().credoper.data?.interventions?.[0].entity?.id ?? null).toBeNull();
  });

  describe("a saved customer restarted as a company, with a second holder", () => {
    const WITH_HOLDER = {
      credOperClassification: 3,
      interventions: [
        ...OPERATION.interventions!,
        { id: "i3", correlationID: "p3", credOperIntervType: 2, person: {}, entity: { fullName: "Eva Reis" } },
      ],
    };
    const COMPANY: MockAnswer = { json: { credOperIntervType: 1, entity: { kind: "Company", company: {} } } };

    it("warned first; nothing lost until it's confirmed", async () => {
      const store = setup(COMPANY, WITH_HOLDER);
      await userEvent.click(restart());
      expect(prompt().textContent).toContain("Customer is a company: if you proceed, the second holder's information will be lost.");
      await userEvent.click(inPrompt("Keep customer"));
      expect(store.getState().credoper.data?.interventions).toHaveLength(3);
    });

    it("confirmed: the second holder goes, the guarantor stays", async () => {
      const store = setup(COMPANY, WITH_HOLDER);
      await askAndRestart();
      await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
      expect(store.getState().credoper.data?.interventions?.map((p) => p.correlationID)).toEqual(["p1", "p2"]);
    });

    it("the customer stays selected when the second holder was listed before them", async () => {
      const [customer, guarantor, holder] = WITH_HOLDER.interventions;
      setup(COMPANY, { ...WITH_HOLDER, interventions: [holder, customer, guarantor] });
      await askAndRestart();
      await screen.findByRole("tab", { name: /Company Details/ });
      expect(screen.getByRole("button", { name: /Customer/, pressed: true })).toBeTruthy();
    });

    it("a person customer has nothing to warn about", async () => {
      setup(BLANK, { ...WITH_HOLDER, credOperClassification: 1 });
      await userEvent.click(restart());
      expect(prompt().textContent).not.toContain("will be lost");
    });
  });

  it("a classification that can't have a customer: there's nothing to restart it with", () => {
    setup(BLANK, { credOperClassification: 9 });
    expect((restart() as HTMLButtonElement).disabled).toBe(true);
  });

  it("asked again after a failure: the old error is gone", async () => {
    setup({ status: 502, json: { title: "Bad gateway", status: 502 } });
    await askAndRestart();
    await within(prompt()).findByRole("alert");
    await userEvent.click(inPrompt("Keep customer"));
    await userEvent.click(restart());
    expect(within(prompt()).queryByRole("alert")).toBeNull();
  });
});
