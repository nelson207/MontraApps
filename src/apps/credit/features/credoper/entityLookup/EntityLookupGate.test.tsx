// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, useSelector } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { mockFetch, TEST_TOKEN } from "@platform/features/news/testing/renderWithApi";
import credoperReducer, { startNew } from "../credoperSlice";
import { InterventionsSection } from "../components/InterventionsSection";
import type { CredOperDraft } from "../model/credOperDraft";
import entityLookupReducer from "./entityLookupSlice";
import { vatOf } from "./entityLookup";

const FOUND = { found: true, phone: "+351 9•• ••• 321", email: "an•••@example.com" };
const ANA = { entity: { id: "e1", fullName: "Ana Maria Silva" }, entityEmail: { email: "ana.silva@example.com" } };

function answerWith(overrides: Record<string, unknown> = {}) {
  return mockFetch((url) => {
    const answers: Record<string, unknown> = {
      "/api/entities/lookup-by-vat": FOUND,
      "/api/entities/otp/send": { sent: true, otpRequestId: "r1", validUntil: new Date(Date.now() + 300_000).toISOString() },
      "/api/entities/otp/verify": { valid: true, intervention: ANA },
      ...overrides,
    };
    return url.pathname in answers ? { json: answers[url.pathname] } : undefined;
  });
}

function setup(op: Partial<CredOperDraft> = {}) {
  const store = configureStore({
    reducer: {
      [emptySplitApi.reducerPath]: emptySplitApi.reducer,
      auth: () => ({ token: TEST_TOKEN, isAuthenticated: true }),
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

const nameField = () => screen.getByLabelText("Name") as HTMLInputElement;
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
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("found: a code is sent to the contacts on file and, confirmed, the database's data fills the person", async () => {
    const { requests } = answerWith();
    const { person } = setup();
    await userEvent.type(screen.getByLabelText(/^NIF/), "123456789");
    await userEvent.click(screen.getByRole("button", { name: /search/i }));

    await screen.findByRole("dialog", { name: "NIF found" });
    expect(screen.getByText("+351 9•• ••• 321")).toBeTruthy();
    expect(screen.getByText("an•••@example.com")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /send code/i }));

    await screen.findByRole("dialog", { name: "Enter the code" });
    expect(screen.getByText(/valid until/i)).toBeTruthy();
    await userEvent.keyboard("123456");

    await waitFor(() => expect(person().entity?.fullName).toBe("Ana Maria Silva"));
    expect(person()).toMatchObject({ correlationID: "c1", credOperIntervType: 1, entityEmail: { email: "ana.silva@example.com" } });
    expect(vatOf(person())).toBe("123456789");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(locked()).toBe(false);
    const verify = requests.find((r) => r.url.endsWith("/otp/verify"))!;
    expect(await verify.json()).toEqual({ otpRequestId: "r1", code: "123456" });
  });

  it("a wrong code is said so, and can be typed again", async () => {
    answerWith({ "/api/entities/otp/verify": { valid: false } });
    setup();
    await userEvent.type(screen.getByLabelText(/^NIF/), "123456789{Enter}");
    await userEvent.click(await screen.findByRole("button", { name: /send code/i }));
    await screen.findByRole("dialog", { name: "Enter the code" });
    await userEvent.keyboard("000000");
    expect(await screen.findByText(/doesn't match/i)).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Enter the code" })).toBeTruthy();
  });

  it("not found: filled in by hand, with the NIF", async () => {
    answerWith({ "/api/entities/lookup-by-vat": { found: false } });
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
    await userEvent.click(await screen.findByRole("button", { name: /send code/i }));
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
    answerWith({ "/api/entities/lookup-by-vat": { found: false } });
    const { person } = setup({ customerName: "Ana Silva", customerVAT: { legalDocNumber: "123456789" } });
    expect((screen.getByLabelText(/^NIF/) as HTMLInputElement).value).toBe("123456789");
    await userEvent.click(screen.getByRole("button", { name: /search/i }));
    await waitFor(() => expect(person().entity?.fullName).toBe("Ana Silva"));
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
    await userEvent.click(await screen.findByRole("button", { name: /send code/i }));
    await screen.findByRole("dialog", { name: "Enter the code" });
    await userEvent.keyboard("123456");
    await waitFor(() => expect(person().entity?.fullName).toBe("Ana Maria Silva"));
    expect(screen.queryByRole("button", { name: "Search by NIF" })).toBeNull();
  });

  it("back to filling in by hand keeps what was typed", async () => {
    answerWith({ "/api/entities/lookup-by-vat": { found: false } });
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
