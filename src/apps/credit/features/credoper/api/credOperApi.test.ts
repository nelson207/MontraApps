// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { act, cleanup, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { TEST_TOKEN } from "@platform/features/news/testing/renderWithApi";
import credoperReducer, { markSaved, patchCredoper, startNew } from "../credoperSlice";
import type { CredOperDraft } from "../model/credOperDraft";
import { problemMessage } from "@platform/api/problemCode";
import {
  conversionErrorMessage,
  CredOperRefusedError,
  isConcurrencyConflict,
  saveErrorMessage,
  quotationSummaryOf,
  quotationToProposal,
  savedFromApi,
  useSaveCredOper,
} from "./credOperApi";

const draft = (): CredOperDraft => ({
  amount: 15000,
  customerName: "Ana Silva",
  customerVAT: { legalDocNumber: "123456789" },
  correlationID: "op-1",
  correlationId: "5b1c6c1e-0000-4000-8000-000000000001",
  insurances: [{ id: "p1", kind: "creditProtection", insuranceTypeId: 7, interventionRef: "c1" }],
  interventions: [{ correlationID: "i-1", credOperIntervType: 1, person: { birthDate: "1990-05-01" }, entity: {} }],
}) as CredOperDraft;

/** A quotation as the conversion summarizes it (QuotationSummaryDto) */
const QUOTATION_SUMMARY = {
  id: "AQ/token",
  number: 4521,
  aplCompanyId: 1,
  aplBusinessId: 3,
  credOperTypeId: 299,
  financialProductId: 7,
  amount: 20000,
  currencyId: "EUR",
  beginDate: "2026-10-01",
  stateId: 101010,
  stateDate: "2026-10-01",
  customerEntityId: "AEtoken",
  customerName: "João Silva",
};

describe("savedFromApi", () => {
  it("takes the server's identity, number and state over the draft that was sent", () => {
    const saved = savedFromApi(
      {
        isSaved: true,
        id: "AQtoken",
        credOper: { id: "AQtoken", credOperNumber: 2026001, autUserStateId: 3, stateDate: "2026-11-03", amount: 15000 },
      },
      draft(),
    );
    expect(saved).toMatchObject({ id: "AQtoken", credOperNumber: 2026001, autUserStateId: 3, stateDate: "2026-11-03" });
  });

  it("replaces the draft: values, item ids and the new rowVersion are the answer's, never the old ones", () => {
    const sent = {
      ...draft(),
      id: "AQtoken",
      rowVersion: "AAAAAAAAB9E=",
      description: "Typed before saving",
      conditions: [{ term: 60, implicitRate: 7 }],
      assets: [{ correlationID: "a-1", assetType: 1, amount: 9000, equipment: { netAmount: 9000, licencePlate: "AA-00-BB" } }],
    } as CredOperDraft;
    const saved = savedFromApi(
      {
        isSaved: true,
        credOper: {
          id: "AQtoken",
          correlationId: sent.correlationId,
          rowVersion: "AAAAAAAAB9I=",
          // What the server saved: no description, its own term, the asset with its id
          conditions: [{ id: "ACtoken", term: 72 }],
          assets: [{ id: "AStoken", assetType: "Equipment", amount: 9000, equipment: { netAmount: 9000 } }],
        },
      },
      sent,
    );
    expect(saved.rowVersion).toBe("AAAAAAAAB9I=");
    expect(saved.correlationId).toBe(sent.correlationId);
    expect(saved.description).toBeUndefined();
    expect(saved.conditions?.[0]).toMatchObject({ id: "ACtoken", term: 72 });
    expect(saved.conditions?.[0].implicitRate).toBeUndefined();
    expect(saved.assets?.[0]).toMatchObject({ id: "AStoken", correlationID: "a-1", assetType: 1 });
    expect(saved.assets?.[0].equipment?.licencePlate).toBeUndefined();
  });

  it("keeps what only the app holds (customer contacts, people's details, insurances, links)", () => {
    const sent = draft();
    const saved = savedFromApi(
      { isSaved: true, credOper: { id: "AQtoken", credOperNumber: 1, entityName: "Ana Silva", interventions: [{ credOperIntervType: 1 }] } },
      sent,
    );
    expect(saved.customerName).toBe("Ana Silva");
    expect(saved.customerVAT).toEqual(sent.customerVAT);
    expect(saved.correlationID).toBe("op-1");
    expect(saved.insurances).toEqual(sent.insurances);
    expect(saved.interventions?.[0]).toMatchObject({ correlationID: "i-1", person: { birthDate: "1990-05-01" } });
  });

  it("never loses the correlationId, even when the answer leaves it out", () => {
    expect(savedFromApi({ isSaved: true, credOper: { id: "AQtoken" } }, draft()).correlationId).toBe(draft().correlationId);
  });

  it("falls back to the result's id when the operation has none", () => {
    expect(savedFromApi({ isSaved: true, id: "AQtoken", credOper: {} }, draft()).id).toBe("AQtoken");
  });

  it("a refused save throws the save and calculation messages", () => {
    const refuse = () =>
      savedFromApi(
        {
          isSaved: false,
          saveMessages: [{ severity: "Error", text: "Customer is missing." }],
          calculationMessages: [{ severity: "Error", text: "Term out of range." }],
        },
        draft(),
      );
    expect(refuse).toThrow(CredOperRefusedError);
    expect(refuse).toThrow("Customer is missing. Term out of range.");
  });

  it("a refused save keeps each message, with its level and where it came from", () => {
    const error = (() => {
      try {
        savedFromApi(
          {
            isSaved: false,
            saveMessages: [{ severity: "Warning", text: "Customer has other contracts." }],
            calculationMessages: [{ severity: "Error", text: "Term out of range." }],
          },
          draft(),
        );
      } catch (thrown) {
        return thrown as CredOperRefusedError;
      }
      throw new Error("It should have been refused");
    })();
    expect(error.messages).toEqual([
      { severity: "error", text: "Term out of range.", source: "calculation" },
      { severity: "warning", text: "Customer has other contracts.", source: "save" },
    ]);
  });

  it("a refused save without messages says so", () => {
    expect(() => savedFromApi({ isSaved: false }, draft())).toThrow("The operation couldn't be saved.");
  });
});

describe("saving (POST /api/credit-operations/save-credoper)", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  function setup() {
    const store = configureStore({
      reducer: {
        [emptySplitApi.reducerPath]: emptySplitApi.reducer,
        auth: () => ({ token: TEST_TOKEN, isAuthenticated: true }),
        credoper: credoperReducer,
      },
      middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
    });
    const wrapper = ({ children }: { children: ReactNode }) => createElement(Provider, { store, children });
    const { result } = renderHook(() => useSaveCredOper(), { wrapper });
    /** Saves the operation in the store, as the wizard does */
    const save = async () => {
      const { data, revision } = store.getState().credoper;
      const { operation: saved } = await result.current[0](data!);
      store.dispatch(markSaved(saved, revision));
      return saved;
    };
    return { store, save };
  }

  /** The server: a new operation once per correlationId; a saved one only from its latest rowVersion */
  function server() {
    let version = 0;
    let saves = 0;
    const byCorrelation = new Map<string, string>();
    const stored = new Map<string, string>();
    const requests: Request[] = [];
    // Answered from the request's body (renderWithApi's mockFetch answers without reading it)
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = input instanceof Request ? input : new Request(input, init);
        requests.push(request);
        const op = (await request.clone().json()) as { id?: string; correlationId?: string; rowVersion?: string };
        const reply = (status: number, json: unknown) =>
          new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } });
        if (op.id && stored.get(op.id) !== op.rowVersion) {
          return reply(409, { title: "Conflict", status: 409, code: "concurrency_conflict" });
        }
        const id = op.id ?? byCorrelation.get(op.correlationId!) ?? `op-${++saves}`;
        byCorrelation.set(op.correlationId!, id);
        const rowVersion = op.id || !stored.has(id) ? `rv-${++version}` : stored.get(id)!;
        stored.set(id, rowVersion);
        return reply(200, { isSaved: true, id, credOper: { ...op, id, rowVersion, credOperNumber: 2026001 } });
      }),
    );
    return { requests, saves: () => saves, stored };
  }

  const bodies = (requests: Request[]) => Promise.all(requests.map((r) => r.clone().json()));

  it("a saved operation replaces the draft, and the next save sends its new rowVersion", async () => {
    const { requests } = server();
    const { store, save } = setup();
    store.dispatch(startNew({ ...draft(), insurances: [] }));

    await act(save);
    const first = store.getState().credoper.data!;
    expect(first).toMatchObject({ id: "op-1", rowVersion: "rv-1", correlationId: draft().correlationId });

    store.dispatch(patchCredoper({ amount: 16000 }));
    await act(save);
    const [sentFirst, sentSecond] = await bodies(requests);
    expect(sentFirst).toMatchObject({ correlationId: draft().correlationId });
    expect(sentFirst.id).toBeUndefined();
    expect(sentSecond).toMatchObject({ id: "op-1", rowVersion: "rv-1", correlationId: draft().correlationId });
    expect(store.getState().credoper.data?.rowVersion).toBe("rv-2");
  });

  it("a new operation saved twice with its correlationId (a double click) is one operation", async () => {
    const { saves } = server();
    const { store, save } = setup();
    store.dispatch(startNew({ ...draft(), insurances: [] }));
    const sent = store.getState().credoper.data!;
    const [a, b] = await act(() => Promise.all([save(), save()]));
    expect(saves()).toBe(1);
    expect(a.id).toBe(b.id);
    expect(sent.correlationId).toBe(store.getState().credoper.data?.correlationId);
  });

  it("someone else's save since: a conflict (409), nothing saved, and the draft as it was", async () => {
    const { stored } = server();
    const { store, save } = setup();
    store.dispatch(startNew({ ...draft(), insurances: [] }));
    await act(save);
    // Someone else saves it
    stored.set("op-1", "rv-someone-else");

    store.dispatch(patchCredoper({ amount: 20000 }));
    const error = await act(() => save().then(() => null, (e: unknown) => e));
    expect(isConcurrencyConflict(error)).toBe(true);
    expect(store.getState().credoper.data).toMatchObject({ amount: 20000, rowVersion: "rv-1" });
    expect(store.getState().credoper.isDirty).toBe(true);
  });
});

describe("quotationToProposal (GET /api/credit-operations/credoper/{id}/quotation-to-proposal)", () => {
  afterEach(() => vi.unstubAllGlobals());

  const store = () =>
    configureStore({
      reducer: { [emptySplitApi.reducerPath]: emptySplitApi.reducer, auth: () => ({ token: TEST_TOKEN, isAuthenticated: true }) },
      middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
    });

  function answering(status: number, conversion: unknown) {
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = input instanceof Request ? input : new Request(input, init);
        urls.push(new URL(request.url).pathname);
        const [code, json] = request.url.includes("quotation-to-proposal") ? [status, conversion] : [200, { credOperIntervType: 1 }];
        return new Response(JSON.stringify(json), { status: code, headers: { "content-type": "application/json" } });
      }),
    );
    return urls;
  }

  it("the new proposal exactly as returned (not saved: no id; its correlationId and sourceCredOperId), with the quotation's summary", async () => {
    const urls = answering(200, {
      proposal: {
        id: null,
        credOperStep: "Proposal",
        correlationId: "c-9",
        sourceCredOperId: "AQ/token",
        aplCompanyId: 1,
        aplBusinessId: 3,
        credOperTypeId: 300,
        financialProductId: 7,
      },
      quotation: QUOTATION_SUMMARY,
    });
    const proposal = await quotationToProposal(store().dispatch, "AQ/token");
    expect(urls[0]).toBe("/api/credit-operations/credoper/AQ%2Ftoken/quotation-to-proposal");
    expect(proposal).toMatchObject({
      id: null,
      credOperStep: 2,
      correlationId: "c-9",
      sourceCredOperId: "AQ/token",
      aplCompanyId: 1,
      aplBusinessId: 3,
      credOperTypeId: 300,
      financialProduct: 7,
      sourceQuotation: QUOTATION_SUMMARY,
    });
    expect(proposal.rowVersion).toBeUndefined();
    // No customer in the answer: none yet, it waits for a classification (useCredOperTemplate)
    expect(proposal.interventions).toEqual([]);
    expect(urls.filter((url) => url.endsWith("/new-intervention"))).toEqual([]);
    expect(proposal.insurances).toEqual([]);
  });

  it.each([
    ["by its type", { credOperIntervType: 1 }],
    ["by its role", { role: "Customer" }],
  ])("a customer in the answer (%s): new-intervention isn't asked for", async (_, customer) => {
    const urls = answering(200, { proposal: { interventions: [customer, { credOperIntervType: 4 }] } });
    const proposal = await quotationToProposal(store().dispatch, "AQ");
    expect(urls.filter((url) => url.endsWith("/new-intervention"))).toEqual([]);
    expect(proposal.interventions).toHaveLength(2);
  });

  it.each([
    ["by its type", { credOperIntervType: 4, id: "g1" }],
    ["by its role", { role: "Guarantor", id: "g1" }],
  ])("only a guarantor in the answer (%s): it stays, and the conversion doesn't ask for a customer", async (_, guarantor) => {
    const urls = answering(200, { proposal: { interventions: [guarantor] } });
    const proposal = await quotationToProposal(store().dispatch, "AQ");
    expect(urls.filter((url) => url.endsWith("/new-intervention"))).toEqual([]);
    expect(proposal.interventions?.map((i) => i.id)).toEqual(["g1"]);
  });

  it.each([
    [404, { title: "Not found", status: 404 }, "Quotation not found."],
    [400, { title: "Bad request", status: 400, code: "validation_failed" }, "Only a quotation can be converted to a proposal."],
    [502, { title: "Bad gateway", status: 502, code: "backend_unavailable" }, null],
  ])("a %i is thrown, with its message for the user", async (status, problem, message) => {
    answering(status, problem);
    const error = await quotationToProposal(store().dispatch, "AQ/token").then(() => null, (e: unknown) => e);
    expect(error).toMatchObject({ status });
    if (message) expect(conversionErrorMessage(error)).toContain(message);
    // 502: the usual backend error (by its code, as every screen shows it), not a quotation's
    else {
      expect(problemMessage(error)).toBeTruthy();
      expect(conversionErrorMessage(error)).toBe(problemMessage(error));
    }
  });
});

describe("quotationSummaryOf (a reopened proposal's quotation, from GET credoper/{sourceCredOperId})", () => {
  it("maps the saved quotation to the summary's fields", () => {
    expect(
      quotationSummaryOf({
        id: "AQ/token",
        credOperNumber: 4521,
        aplCompanyId: 1,
        aplBusinessId: 3,
        credOperTypeId: 299,
        financialProductId: 7,
        amount: 20000,
        currencyId: "EUR",
        beginDate: "2026-10-01",
        autUserStateId: 101010,
        stateDate: "2026-10-01",
        entityName: "João Silva",
        interventions: [{ role: "Guarantor", entityId: "AEother" }, { role: "Customer", entityId: "AEtoken" }],
      }),
    ).toEqual(QUOTATION_SUMMARY);
  });
});

describe("saving a proposal made from a quotation", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const proposal = (): CredOperDraft => ({
    ...draft(),
    id: null,
    credOperStep: 2,
    sourceCredOperId: "AQquote",
    sourceQuotation: QUOTATION_SUMMARY,
    aplCompanyId: 1,
    aplBusinessId: 3,
    credOperTypeId: 300,
    insurances: [],
  });

  function setup(reply: (sent: Record<string, unknown>) => [number, unknown]) {
    const sent: Record<string, unknown>[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = input instanceof Request ? input : new Request(input, init);
        const op = (await request.clone().json()) as Record<string, unknown>;
        sent.push(op);
        const [status, json] = reply(op);
        return new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } });
      }),
    );
    const store = configureStore({
      reducer: { [emptySplitApi.reducerPath]: emptySplitApi.reducer, auth: () => ({ token: TEST_TOKEN, isAuthenticated: true }) },
      middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
    });
    const wrapper = ({ children }: { children: ReactNode }) => createElement(Provider, { store, children });
    const { result } = renderHook(() => useSaveCredOper(), { wrapper });
    /** The saved operation, or what the save threw */
    const save = (d: CredOperDraft) => act(() => result.current[0](d).then(({ operation }) => operation, (error: unknown) => ({ error })));
    /** The whole answer of a successful save */
    const saveResult = (d: CredOperDraft) => act(() => result.current[0](d));
    return { sent, save, saveResult };
  }

  it("a successful save brings its warnings and notes with the saved operation", async () => {
    const { saveResult } = setup((op) => [
      200,
      {
        isSaved: true,
        credOper: { ...op, id: "APtoken", rowVersion: "rv-1" },
        saveMessages: [{ severity: "Info", text: "Valid for 30 days." }],
        calculationMessages: [{ severity: "Warning", text: "Manual analysis will be needed." }],
      },
    ]);
    const { operation, messages } = await saveResult(proposal());
    expect(operation.id).toBe("APtoken");
    expect(messages).toEqual([
      { severity: "warning", text: "Manual analysis will be needed.", source: "calculation" },
      { severity: "info", text: "Valid for 30 days.", source: "save" },
    ]);
  });

  it("is saved as a new operation (no id) with its correlationId and sourceCredOperId; the saved one still has them", async () => {
    const { sent, save } = setup((op) => [200, { isSaved: true, credOper: { ...op, id: "APtoken", rowVersion: "rv-1" } }]);
    const saved = await save(proposal());
    expect(sent[0].id).toBeNull();
    expect(sent[0]).toMatchObject({ correlationId: draft().correlationId, sourceCredOperId: "AQquote", credOperTypeId: 300 });
    // The summary is the app's: never sent
    expect(sent[0]).not.toHaveProperty("sourceQuotation");
    expect(saved).toMatchObject({ id: "APtoken", rowVersion: "rv-1", sourceCredOperId: "AQquote", sourceQuotation: QUOTATION_SUMMARY });
  });

});

describe("saveErrorMessage", () => {
  const VALIDATION = { title: "Bad request", status: 400, code: "validation_failed" };

  it.each([
    ["detail", { ...VALIDATION, detail: " The term is above the maximum. " }, "The term is above the maximum."],
    ["message", { ...VALIDATION, message: "The term is above the maximum." }, "The term is above the maximum."],
  ])("a 400 with its own explanation (%s): that one", (_, data, text) => {
    expect(saveErrorMessage({ status: 400, data })).toBe(text);
  });

  it("entity_kind_mismatch: its own message, whatever else the API says", () => {
    const data = { title: "Bad request", status: 400, code: "entity_kind_mismatch", detail: "Intervention 2 refused." };
    expect(saveErrorMessage({ status: 400, data })).toBe("An intervention's NIF or type doesn't match its role");
  });

  it("a 400 without one: the generic message of its code, never the title", () => {
    expect(saveErrorMessage({ status: 400, data: { ...VALIDATION, detail: "  " } })).toBe(problemMessage({ status: 400, data: VALIDATION }));
    expect(saveErrorMessage({ status: 400, data: VALIDATION })).not.toContain("Bad request");
  });

  it("a 400 with no code nor explanation, or an unknown error: still something to say", () => {
    expect(saveErrorMessage({ status: 400, data: { title: "Bad request" } })).toBe("Something went wrong. Please try again.");
    expect(saveErrorMessage(null)).toBe("Something went wrong. Please try again.");
  });

  it("another status keeps the usual backend error, whatever it explains", () => {
    const error = { status: 502, data: { code: "backend_unavailable", detail: "Accipiens timed out" } };
    expect(saveErrorMessage(error)).toBe(problemMessage(error));
  });
});

describe("isConcurrencyConflict", () => {
  it("only a 409 with its code", () => {
    expect(isConcurrencyConflict({ status: 409, data: { code: "concurrency_conflict" } })).toBe(true);
    expect(isConcurrencyConflict({ status: 409, data: { code: "other" } })).toBe(false);
    expect(isConcurrencyConflict({ status: 400, data: { code: "concurrency_conflict" } })).toBe(false);
    expect(isConcurrencyConflict(null)).toBe(false);
  });
});
