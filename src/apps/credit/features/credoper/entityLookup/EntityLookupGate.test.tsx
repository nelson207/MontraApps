// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, useSelector } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { mockFetch, TEST_TOKEN } from "@platform/features/news/testing/renderWithApi";
import credoperReducer, { startNew } from "../credoperSlice";
import { toApiCredOper } from "../api/credOperMapping";
import { InterventionsSection } from "../components/InterventionsSection";
import type { CredOperDraft } from "../model/credOperDraft";
import entityLookupReducer from "./entityLookupSlice";
import { vatOf } from "./entityLookup";

const FOUND = { exists: true, kind: "Person", kindMatches: true, preload: null, mobilePhone: "+351 9•• ••• 321", email: "an•••@example.com" };
/** A customer that must be a company */
const COMPANY_CUSTOMER = { interventions: [{ correlationID: "c1", credOperIntervType: 1, entity: { entityTypeId: 2 }, person: {} }] };
const ACME = { id: "e2", entityTypeId: 2, name: "Acme, Lda.", company: { registryNumber: "R1" }, emails: [{ id: "m2", emailAddress: "geral@acme.pt", isMain: true }] };
const MISMATCH = { status: 400, json: { title: "Mismatch", status: 400, code: "entity_kind_mismatch" } };
/** The entity preloaded once the code is confirmed (EntityPreloadDto) */
const ANA = {
  id: "e1",
  entityTypeId: 1,
  name: "Ana Maria Silva",
  person: { firstName: "Ana Maria", lastName: "Silva", birthDate: "1988-04-12" },
  emails: [{ id: "m1", emailAddress: "ana.silva@example.com", isMain: true }],
};
const NOT_FOUND = { "/api/entities/lookup": { exists: false } };

function answerWith(overrides: Record<string, unknown> = {}, errors: Record<string, { status: number; json: unknown }> = {}) {
  return mockFetch((url) => {
    const answers: Record<string, unknown> = {
      "/api/entities/lookup": { json: FOUND },
      "/api/entities/otp": { json: { expiresAt: new Date(Date.now() + 300_000).toISOString(), sentTo: "+351 9•• ••• 321" } },
      "/api/entities/otp/verify": { json: ANA },
      ...Object.fromEntries(Object.entries(overrides).map(([path, json]) => [path, { json }])),
      ...errors,
    };
    return answers[url.pathname] as { json: unknown; status?: number } | undefined;
  });
}

function setup(op: Partial<CredOperDraft> = {}) {
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
  store.dispatch(
    startNew({ credOperStep: 2, insurances: [], interventions: [{ correlationID: "c1", credOperIntervType: 1, entity: {}, person: {} }], ...op }),
  );
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
  const person = () => store.getState().credoper.data!.interventions![0];
  return { store, person };
}

const nameField = () => screen.getByLabelText(/^(First name|Company name)/) as HTMLInputElement;
const locked = () => !!nameField().closest("[inert]");

beforeEach(() => vi.useRealTimers());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("a new person starts with their NIF", () => {
  it("everything else waits; an invalid NIF isn't searched", async () => {
    const { fetchMock } = answerWith();
    setup();
    expect(locked()).toBe(true);
    await userEvent.type(screen.getByLabelText(/^NIF/), "123456780");
    await userEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(screen.getByText("Enter a valid NIF (9 digits).")).toBeTruthy();
    // The form's lists load behind the search; the NIF wasn't searched
    expect(fetchMock.mock.calls.some(([request]) => String((request as Request).url).includes("/entities/lookup"))).toBe(false);
  });

  it("found: a code is sent by the channel chosen and, confirmed, the database's data fills the person", async () => {
    const { requests } = answerWith();
    const { person } = setup();
    await userEvent.type(screen.getByLabelText(/^NIF/), "123456789");
    await userEvent.click(screen.getByRole("button", { name: /search/i }));

    await screen.findByRole("dialog", { name: "NIF found" });
    expect(screen.getByRole("button", { name: "E-mail to an•••@example.com" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "SMS to +351 9•• ••• 321" }));

    await screen.findByRole("dialog", { name: "Enter the code" });
    expect(screen.getByText(/valid until/i)).toBeTruthy();
    expect(screen.getByText("+351 9•• ••• 321")).toBeTruthy();
    await userEvent.keyboard("123456");

    await waitFor(() => expect(person().entity?.fullName).toBe("Ana Maria Silva"));
    expect(person()).toMatchObject({
      correlationID: "c1",
      credOperIntervType: 1,
      entity: { id: "e1" },
      person: { firstName: "Ana Maria", lastName: "Silva", birthDate: "1988-04-12" },
      entityEmail: { email: "ana.silva@example.com" },
    });
    expect(vatOf(person())).toBe("123456789");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(locked()).toBe(false);
    const sent = requests.find((r) => r.url.endsWith("/api/entities/otp"))!;
    expect(await sent.json()).toEqual({ vatNumber: "123456789", channel: "Sms", kind: "Person" });
    const verify = requests.find((r) => r.url.endsWith("/otp/verify"))!;
    expect(await verify.json()).toEqual({ vatNumber: "123456789", code: "123456", kind: "Person" });
  });

  it("a wrong code is said so, and can be typed again", async () => {
    answerWith({}, { "/api/entities/otp/verify": { status: 400, json: { title: "Invalid code", status: 400, code: "invalid_otp_code" } } });
    setup();
    await userEvent.type(screen.getByLabelText(/^NIF/), "123456789{Enter}");
    await userEvent.click(await screen.findByRole("button", { name: /^SMS to/ }));
    await screen.findByRole("dialog", { name: "Enter the code" });
    await userEvent.keyboard("000000");
    expect(await screen.findByText(/doesn't match/i)).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Enter the code" })).toBeTruthy();
  });

  it("not found: filled in by hand, with the NIF", async () => {
    answerWith(NOT_FOUND);
    const { person } = setup();
    await userEvent.type(screen.getByLabelText(/^NIF/), "123456789{Enter}");
    expect(await screen.findByText(/isn't in the database yet/i)).toBeTruthy();
    expect(locked()).toBe(false);
    expect(vatOf(person())).toBe("123456789");
  });

  it("filled in by hand at any time; a code sent can be entered later", async () => {
    answerWith();
    const { person } = setup();
    await userEvent.type(screen.getByLabelText(/^NIF/), "123456789{Enter}");
    await userEvent.click(await screen.findByRole("button", { name: /^SMS to/ }));
    const dialog = await screen.findByRole("dialog", { name: "Enter the code" });
    await userEvent.click(within(dialog).getByRole("button", { name: /fill in manually/i }));

    expect(locked()).toBe(false);
    await userEvent.type(nameField(), "Ana");
    expect(person().entity?.fullName).toBe("Ana");

    await userEvent.click(screen.getByRole("button", { name: "Enter the code" }));
    await screen.findByRole("dialog", { name: "Enter the code" });
    await userEvent.keyboard("123456");
    await waitFor(() => expect(person().entity?.fullName).toBe("Ana Maria Silva"));
  });

  it("the proposal's customer starts with the quotation's NIF and, by hand, its details", async () => {
    answerWith(NOT_FOUND);
    const { person } = setup({ customerName: "Ana Silva", customerVAT: { legalDocNumber: "123456789" } });
    expect((screen.getByLabelText(/^NIF/) as HTMLInputElement).value).toBe("123456789");
    await userEvent.click(screen.getByRole("button", { name: /search/i }));
    await waitFor(() => expect(person().entity?.fullName).toBe("Ana Silva"));
  });
});

describe("the NIF must be of the intervention's kind", () => {
  /** What was asked of the lookup (the form's lists load too) */
  const paths = (requests: Request[]) => requests.map((request) => new URL(request.url).pathname).filter((path) => /\/entities\/(lookup|otp)/.test(path));
  const nif = () => screen.getByLabelText(/^NIF/) as HTMLInputElement;

  it.each([
    ["a person", {}, "Person"],
    ["a company", COMPANY_CUSTOMER, "Company"],
  ])("the search says what's looked for: %s", async (_, op, kind) => {
    const { requests } = answerWith(NOT_FOUND);
    setup(op as Partial<CredOperDraft>);
    await userEvent.type(nif(), "123456789{Enter}");
    await screen.findByText(/isn't in the database yet/i);
    expect(await requests.find((request) => request.url.includes("/entities/lookup"))!.json()).toEqual({ vatNumber: "123456789", kind });
  });

  it.each([
    ["a company NIF on a person", {}, "Company", "This NIF belongs to a company"],
    ["a person NIF on a company", COMPANY_CUSTOMER, "Person", "This NIF belongs to a person"],
    ["a NIF of neither", {}, null, "This NIF can't be used here"],
  ])("%s: nothing loaded, no code, and the field ready for another", async (_, op, kind, message) => {
    const { requests } = answerWith({ "/api/entities/lookup": { exists: true, kind, kindMatches: false, preload: null, mobilePhone: "+351 9", email: "a@b" } });
    const { person, store } = setup(op as Partial<CredOperDraft>);
    const before = person();
    await userEvent.type(nif(), "123456789{Enter}");

    expect((await screen.findByRole("alert")).textContent).toBe(message);
    expect(nif().value).toBe("");
    await waitFor(() => expect(document.activeElement).toBe(nif()));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(person()).toEqual(before);
    expect(locked()).toBe(true);
    expect(paths(requests)).toEqual(["/api/entities/lookup"]);
    expect(store.getState().entityLookup.c1).toEqual({ vat: "", outcome: "search" });

    // Another NIF clears it
    await userEvent.type(nif(), "1");
    expect(screen.queryByText(message)).toBeNull();
  });

  it("the preload is ignored when the kinds don't match", async () => {
    answerWith({ "/api/entities/lookup": { exists: true, kind: "Company", kindMatches: false, preload: ACME } });
    const { person } = setup();
    await userEvent.type(nif(), "123456789{Enter}");
    await screen.findByText("This NIF belongs to a company");
    expect(person().entity?.fullName).toBeUndefined();
  });

  it("a matching company: filled straight from the lookup, with no code", async () => {
    const { requests } = answerWith({ "/api/entities/lookup": { exists: true, kind: "Company", kindMatches: true, preload: ACME } });
    const { person, store } = setup(COMPANY_CUSTOMER);
    await userEvent.type(nif(), "500000000{Enter}");

    await waitFor(() => expect(person().entity?.fullName).toBe("Acme, Lda."));
    expect(person()).toMatchObject({
      correlationID: "c1",
      entity: { id: "e2", entityTypeId: 2 },
      company: { registryNumber: "R1" },
      entityEmail: { email: "geral@acme.pt" },
    });
    expect(vatOf(person())).toBe("500000000");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(locked()).toBe(false);
    expect(paths(requests)).toEqual(["/api/entities/lookup"]);
    expect(store.getState().entityLookup.c1.outcome).toBe("filled");
  });

  it("a matching person still goes through the code", async () => {
    const { requests } = answerWith();
    setup();
    await userEvent.type(nif(), "123456789{Enter}");
    await screen.findByRole("dialog", { name: "NIF found" });
    expect(paths(requests)).toEqual(["/api/entities/lookup"]);
  });

  it("the code can't be sent, 400 entity_kind_mismatch: the same message, and nothing more", async () => {
    const { requests } = answerWith({}, { "/api/entities/otp": MISMATCH });
    const { person } = setup();
    const before = person();
    await userEvent.type(nif(), "123456789{Enter}");
    await userEvent.click(await screen.findByRole("button", { name: /^SMS to/ }));

    expect((await screen.findByRole("alert")).textContent).toBe("This NIF belongs to a company");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(nif().value).toBe("");
    expect(person()).toEqual(before);
    expect(paths(requests)).not.toContain("/api/entities/otp/verify");
  });

  it("the code can't be confirmed, 400 entity_kind_mismatch: the same message, no data, and the code is gone", async () => {
    answerWith({}, { "/api/entities/otp/verify": MISMATCH });
    const { person, store } = setup(COMPANY_CUSTOMER);
    const before = person();
    await userEvent.type(nif(), "123456789{Enter}");
    await userEvent.click(await screen.findByRole("button", { name: /^SMS to/ }));
    await screen.findByRole("dialog", { name: "Enter the code" });
    await userEvent.keyboard("123456");

    expect((await screen.findByRole("alert")).textContent).toBe("This NIF belongs to a person");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(person()).toEqual(before);
    expect(store.getState().entityLookup.c1.otp).toBeUndefined();
  });
});

describe("the form follows the entity's kind", () => {
  it("a person: person details; a company: company details, whose fields are saved as a company's", async () => {
    answerWith(NOT_FOUND);
    const { person } = setup(COMPANY_CUSTOMER);
    await userEvent.type(screen.getByLabelText(/^NIF/), "123456789{Enter}");
    await screen.findByText(/isn't in the database yet/i);
    expect(screen.queryByRole("button", { name: /Person Details/ })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /Company Details/ }));
    await userEvent.type(screen.getByLabelText("Registry number"), "R9");
    expect(person().company?.registryNumber).toBe("R9");
    expect(screen.queryByLabelText("Registry Office")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /^Details/ }));
    await userEvent.type(nameField(), "Acme");
    expect(toApiCredOper({ interventions: [person()] }).interventions?.[0].entity).toMatchObject({
      kind: "Company",
      company: { registryNumber: "R9", registryDescription: "Acme" },
    });
  });

  it("a person's has no company details", () => {
    answerWith(NOT_FOUND);
    setup();
    expect(screen.getByRole("button", { name: /Person Details/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Company Details/ })).toBeNull();
  });
});

describe("back to the search, after filling in by hand", () => {
  it("chosen by hand: the search starts over with the NIF, what was typed locked meanwhile, and fills from the database", async () => {
    answerWith();
    const { person } = setup();
    await userEvent.type(screen.getByLabelText(/^NIF/), "123456789");
    await userEvent.click(screen.getByRole("button", { name: /fill in manually/i }));
    await userEvent.type(nameField(), "Ana");
    expect(locked()).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Search by NIF" }));
    expect(locked()).toBe(true);
    expect(nameField().value).toBe("Ana");
    expect((screen.getByLabelText(/^NIF/) as HTMLInputElement).value).toBe("123456789");

    await userEvent.click(screen.getByRole("button", { name: /^search$/i }));
    await userEvent.click(await screen.findByRole("button", { name: /^SMS to/ }));
    await screen.findByRole("dialog", { name: "Enter the code" });
    await userEvent.keyboard("123456");
    await waitFor(() => expect(person().entity?.fullName).toBe("Ana Maria Silva"));
    expect(screen.queryByRole("button", { name: "Search by NIF" })).toBeNull();
  });

  it("back to filling in by hand keeps what was typed", async () => {
    answerWith(NOT_FOUND);
    const { person } = setup();
    await userEvent.type(screen.getByLabelText(/^NIF/), "123456789{Enter}");
    await userEvent.type(nameField(), "Ana");
    await userEvent.click(await screen.findByRole("button", { name: "Search another NIF" }));
    expect(locked()).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: /fill in manually/i }));
    expect(locked()).toBe(false);
    expect(person().entity?.fullName).toBe("Ana");
  });
});
