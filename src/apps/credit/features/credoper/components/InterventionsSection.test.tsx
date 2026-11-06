// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, useSelector } from "react-redux";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import type { CredOperIntervDto as ApiIntervDto } from "@platform/api/generated/MontraPOSApi";
import type { CredOperIntervDto } from "@platform/api/legacy/legacyApi";
import { mockFetch, TEST_TOKEN } from "@platform/features/news/testing/renderWithApi";
import { fromApiCredOper, toApiCredOper } from "../api/credOperMapping";
import credoperReducer, { startNew } from "../credoperSlice";
import entityLookupReducer, { choseManual } from "../entityLookup/entityLookupSlice";
import { InterventionsSection } from "./InterventionsSection";

const page = (items: unknown[]) => ({ json: { items, page: 1, pageSize: 50, totalCount: items.length } });
const LISTS: Record<string, { json: unknown }> = {
  "/api/entities/phone-types": {
    json: [
      { kind: "Landline", phoneTypeId: 7 },
      { kind: "Mobile", phoneTypeId: 8 },
    ],
  },
  "/api/companies/countries": { json: [{ id: "PRT", abbreviation: "Portugal", alpha2Code: "PT", phonePrefix: 351 }, { id: "ESP", abbreviation: "Espanha", alpha2Code: "ES", phonePrefix: 34 }] },
  "/api/entities/genders": page([{ id: 1, abbreviation: "F", description: null }]),
  "/api/entities/marital-statuses": page([{ id: 2, abbreviation: "Single", description: "Solteiro" }]),
  "/api/entities/professions": page([]),
  "/api/entities/legal-doc-types": page([{ id: 11, abbreviation: "CC", description: "Citizen card" }]),
  "/api/entities/juridical-types": page([
    { id: 21, description: "Lda", hasActivity: true, activityTypeContextId: 5 },
    { id: 22, description: "Associação", hasActivity: false },
  ]),
  "/api/entities/activity-types": page([{ id: 45110, abbreviation: "45110", description: "Comércio" }]),
};

function setup(person: CredOperIntervDto) {
  const { requests } = mockFetch((url) => LISTS[url.pathname]);
  const store = configureStore({
    reducer: {
      [emptySplitApi.reducerPath]: emptySplitApi.reducer,
      auth: () => ({ token: TEST_TOKEN, isAuthenticated: true }),
      theme: () => ({ dateFormat: "dd/MM/yyyy" }),
      credoper: credoperReducer,
      entityLookup: entityLookupReducer,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
  });
  store.dispatch(startNew({ credOperStep: 2, insurances: [], interventions: [{ correlationID: "c1", credOperIntervType: 1, ...person }] }));
  store.dispatch(choseManual({ ref: "c1", vat: "" }));
  type State = ReturnType<typeof store.getState>;
  function Person() {
    const intervention = useSelector((s: State) => s.credoper.data?.interventions?.[0]);
    return intervention ? <InterventionsSection index={0} intervention={intervention} errors={{}} /> : null;
  }
  render(
    <Provider store={store}>
      <Person />
    </Provider>,
  );
  const draft = () => store.getState().credoper.data!;
  /** What the save would send of this person */
  const sent = () => toApiCredOper(draft()).interventions![0].entity!;
  return { store, draft, sent, requests };
}

/** The Customer step's phone field, with its country, ready to type in */
const phoneInputsReady = async () => {
  await screen.findAllByRole("button", { name: /^Country: Portugal/ });
  await waitFor(() => expect((screen.getByLabelText("Mobile phone") as HTMLInputElement).disabled).toBe(false));
};

const openTab = (name: RegExp) => userEvent.click(screen.getByRole("tab", { name }));

/** Opens a dropdown (its label's field) and picks an option */
async function pick(label: RegExp, option: string) {
  await userEvent.click(screen.getByLabelText(label));
  await userEvent.click(await screen.findByRole("option", { name: option }));
}

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});

describe("a new person", () => {
  it("the tabs, the Next button and the summary lead through what's required, and it can be saved", async () => {
    const { sent } = setup({ entity: {}, person: {} });
    const summary = within(screen.getByRole("complementary", { name: "Summary of this person" }));
    expect(summary.getByRole("button", { name: "First name" })).toBeTruthy();

    await userEvent.type(screen.getByLabelText(/^NIF/), "123456789");
    await userEvent.type(screen.getByLabelText(/^First name/), "Ana");
    await userEvent.type(screen.getByLabelText(/^Last name/), "Silva");
    await phoneInputsReady();
    await userEvent.type(screen.getByLabelText("Mobile phone"), "912345678");
    expect(summary.queryByRole("button", { name: "First name" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Address" }));
    await userEvent.type(screen.getByLabelText(/^Street/), "Rua Augusta");
    await userEvent.type(screen.getByLabelText(/^Postal code/), "1100-053");
    await pick(/^Country/, "Portugal");

    expect(summary.getByText("Nothing missing to save")).toBeTruthy();
    const entity = sent();
    expect(entity.person).toMatchObject({ firstName: "Ana", lastName: "Silva" });
    expect(entity.vatNumber).toBe("123456789");
    expect(entity.phone).toEqual({ phoneNumber: "912345678", countryId: "PRT", phoneTypeId: 8, isMain: true });
    // Country: the list's id. One address for both
    expect(entity.fiscalAddress?.details?.countryId).toBe("PRT");
    expect(entity.postalAddress).toEqual(entity.fiscalAddress);
    expect(entity.fiscalAddress).not.toHaveProperty("id");
  });

  it("the mobile is the one on the intervention, with the landline added to the entity", async () => {
    const { sent } = setup({ entity: {}, person: {} });
    await phoneInputsReady();
    await userEvent.type(screen.getByLabelText("Landline phone"), "212345678");
    expect(sent().phone).toMatchObject({ phoneNumber: "212345678", countryId: "PRT", phoneTypeId: 7, isMain: true });
    await userEvent.type(screen.getByLabelText("Mobile phone"), "912345678");
    expect(sent().phone).toMatchObject({ phoneNumber: "912345678", countryId: "PRT", phoneTypeId: 8, isMain: true });
    expect(sent().availablePhones?.map((phone) => phone.phoneTypeId)).toEqual([8, 7]);
  });

  it("phones and e-mail are the Customer step's fields", async () => {
    setup({ entity: {}, person: {} });
    await phoneInputsReady();
    // Each phone with its country
    expect(screen.getAllByRole("button", { name: /^Country: Portugal/ })).toHaveLength(2);
    const email = screen.getByLabelText("E-mail");
    expect(email.getAttribute("type")).toBe("email");
    expect(email.closest(".input-group")?.textContent).toContain("@");
  });

  it("the country chosen goes in countryId; the number is never joined with its dial code", async () => {
    const { sent } = setup({ entity: {}, person: {} });
    await phoneInputsReady();
    await userEvent.type(screen.getByLabelText("Mobile phone"), "912345678");
    expect(sent().phone).toMatchObject({ phoneNumber: "912345678", countryId: "PRT" });

    await userEvent.click(screen.getAllByRole("button", { name: /^Country: Portugal/ })[0]);
    await userEvent.click(screen.getByRole("button", { name: /Espanha/ }));
    expect(sent().phone).toMatchObject({ phoneNumber: "912345678", countryId: "ESP" });
    expect(screen.getByRole("button", { name: /^Country: Espanha/ })).toBeTruthy();

    // Pasted with its dial code: split into the two
    await userEvent.clear(screen.getByLabelText("Mobile phone"));
    await userEvent.type(screen.getByLabelText("Mobile phone"), "+351212345678");
    expect(sent().phone).toMatchObject({ phoneNumber: "212345678", countryId: "PRT" });
  });

  it("a phone that was saved with its dial code shows as country and number", async () => {
    setup({ entity: {}, person: {}, entityMobilePhone: { phoneNumber: "+34612345678" } });
    await screen.findByRole("button", { name: /^Country: Espanha/ });
    expect((screen.getByLabelText("Mobile phone") as HTMLInputElement).value).toBe("612 345 678");
  });

  it("the lists of person details send their ids", async () => {
    const { sent } = setup({ entity: {}, person: {} });
    await openTab(/Person Details/);
    await pick(/^Gender/, "F");
    await pick(/^Marital status/, "Solteiro");
    expect(sent().person).toMatchObject({ genderId: 1, maritalStatusId: 2 });
  });
});

describe("the legal form and the activity", () => {
  it("the activity follows the legal form, and clears when it changes", async () => {
    const { sent, requests } = setup({ entity: { entityTypeId: 2 }, company: {} });
    await waitFor(() => expect(requests.some((request) => request.url.includes("juridical-types?kind=Company"))).toBe(true));
    expect(requests.find((request) => request.url.includes("juridical-types"))!.url).not.toContain("countryId");
    expect((screen.getByLabelText(/^Activity/) as HTMLButtonElement).disabled).toBe(true);

    await pick(/^Legal form/, "Lda");
    expect(sent().juridicalTypeId).toBe(21);
    expect((screen.getByLabelText(/^Activity/) as HTMLButtonElement).disabled).toBe(false);
    await waitFor(() => expect(requests.some((request) => request.url.includes("activity-types?contextId=5"))).toBe(true));
    await pick(/^Activity/, "Comércio");
    expect(sent().company?.leafActivityTypeId).toBe(45110);

    await pick(/^Legal form/, "Associação");
    expect(sent().company?.leafActivityTypeId).toBeNull();
    expect((screen.getByLabelText(/^Activity/) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("a saved proposal reopened", () => {
  const answer: ApiIntervDto = {
    id: "AI",
    entityId: "AE",
    entityPhoneId: "pointer",
    entity: {
      vatNumber: "123456789",
      kind: "Person",
      juridicalTypeId: 22,
      person: { firstName: "Ana", lastName: "Silva" },
      phone: { id: "P1", phoneNumber: "912345678", phoneTypeId: 8 },
      email: { id: "M1", emailAddress: "ana@example.com" },
      fiscalAddress: { id: "A1", singleLine: "Rua Augusta 100", details: { street: "Rua Augusta 100", postalCode: "1100-053", countryId: "PRT", isFiscal: true } },
      postalAddress: { id: "A2", singleLine: "Rua do Ouro 5", details: { street: "Rua do Ouro 5", postalCode: "1100-060", countryId: "PRT" } },
      legalDocs: [{ id: "D1", documentName: "Citizen card", legalDocTypeId: 11, legalDocNumber: "12345", validDate: "2031-01-01" }],
      availablePhones: [
        { id: "P1", phoneNumber: "912345678", phoneTypeId: 8 },
        { id: "P2", phoneNumber: "212345678", phoneTypeId: 7 },
      ],
      availableEmails: [{ id: "M1", emailAddress: "ana@example.com" }],
      availableAddresses: [
        { id: "A1", singleLine: "Rua Augusta 100" },
        { id: "A2", singleLine: "Rua do Ouro 5" },
      ],
    },
  };
  const reopened = () => fromApiCredOper({ interventions: [answer] }).interventions![0];

  it("its selected contacts and the lists to choose from; name and legal form read-only", async () => {
    setup(reopened());
    expect((screen.getByLabelText("Name") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText(/^Legal form/) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("button", { name: /912345678/, pressed: true })).toBeTruthy();
    expect(screen.getByRole("button", { name: /212345678/, pressed: false })).toBeTruthy();

    await openTab(/Address/);
    // Different addresses: the postal one's choices are there too
    const fiscal = within(screen.getByRole("group", { name: "Fiscal address" }));
    expect(fiscal.getByRole("button", { name: "Rua Augusta 100", pressed: true })).toBeTruthy();
    const postal = within(screen.getByRole("group", { name: "Postal address" }));
    expect(postal.getByRole("button", { name: "Rua do Ouro 5", pressed: true })).toBeTruthy();
  });

  it("choosing sends the id; typing a new one sends none; the API's pointers are never sent", async () => {
    const { draft, sent } = setup(reopened());
    await userEvent.click(screen.getByRole("button", { name: /212345678/ }));
    expect(sent().phone).toMatchObject({ id: "P2", phoneNumber: "212345678", phoneTypeId: 7 });

    await openTab(/Address/);
    const fiscal = within(screen.getByRole("group", { name: "Fiscal address" }));
    await userEvent.click(fiscal.getByRole("button", { name: "Rua do Ouro 5" }));
    expect(sent().fiscalAddress?.id).toBe("A2");

    await userEvent.click(fiscal.getByRole("button", { name: /Use a new address/ }));
    await userEvent.type(screen.getAllByLabelText("Street")[0], "Rua Nova");
    expect(sent().fiscalAddress).not.toHaveProperty("id");
    expect(sent().fiscalAddress?.details?.street).toBe("Rua Nova");

    const link = toApiCredOper(draft()).interventions![0];
    expect(link).not.toHaveProperty("entityId");
    expect(link).not.toHaveProperty("entityPhoneId");
    expect(link).not.toHaveProperty("fiscalEntityAddressId");
  });

  it("a new phone: a mobile and a landline, at least one of them", async () => {
    const { draft, sent } = setup(reopened());
    const summary = within(screen.getByRole("complementary", { name: "Summary of this person" }));
    expect(screen.queryByLabelText("Mobile phone")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /Use a new phone/ }));
    await phoneInputsReady();
    expect(screen.getByLabelText("Landline phone")).toBeTruthy();
    expect(summary.getByRole("button", { name: "Mobile or landline phone" })).toBeTruthy();

    await userEvent.type(screen.getByLabelText("Landline phone"), "213000111");
    expect(summary.queryByRole("button", { name: "Mobile or landline phone" })).toBeNull();
    expect(sent().phone).toEqual({ phoneNumber: "213000111", countryId: "PRT", phoneTypeId: 7, isMain: true });

    // Back to one on file: what was typed goes
    await userEvent.click(screen.getByRole("button", { name: /912345678/ }));
    expect(sent().phone).toMatchObject({ id: "P1", phoneNumber: "912345678" });
    expect(draft().interventions![0].entityLandlinePhone?.phoneNumber).toBeUndefined();
  });

  it("its documents are shown only; one added goes without an id, and those it has aren't sent", async () => {
    const { sent } = setup(reopened());
    await openTab(/Legal Document/);
    expect(screen.getByText("Citizen card")).toBeTruthy();
    expect(screen.queryByLabelText(/Document number/)).toBeNull();
    expect(sent().legalDocs).toBeUndefined();

    await userEvent.click(screen.getByRole("button", { name: "Add legal document" }));
    await pick(/^Document type/, "Citizen card");
    await userEvent.type(screen.getByLabelText("Document number"), "999");
    expect(sent().legalDocs).toEqual([{ legalDocTypeId: 11, legalDocNumber: "999" }]);
  });
});
