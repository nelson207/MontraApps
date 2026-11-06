// @vitest-environment jsdom
import { configureStore, type Action } from "@reduxjs/toolkit";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, useSelector } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { mockFetch, TEST_TOKEN, type MockAnswer } from "@platform/features/news/testing/renderWithApi";
import { problemMessage } from "@platform/api/problemCode";
import credoperReducer, { loadExisting, markSaved, patchCredoper, startConverted } from "../credoperSlice";
import type { CredOperDraft } from "../model/credOperDraft";
import CredOperWizardPage from "./CredOperWizardPage";

// The wizard around what a save answers: the real page, store and API client. Only the session
// (the operation is already open) and the field rules (it's valid, so Save reaches the API) are set.

vi.mock("../session/useCredOperSession", async (original) => ({
  ...(await original<typeof import("../session/useCredOperSession")>()),
  useCredOperSession: () => {
    const operation = useSelector((state: { credoper: { data: CredOperDraft | null } }) => state.credoper.data);
    return { status: "ready", sessionId: "s", operation, isOpened: true, notice: null };
  },
}));

vi.mock("../wizard/steps", async (original) => {
  const steps = await original<typeof import("../wizard/steps")>();
  return { ...steps, validateStages: () => ({ errors: {}, byStep: {}, invalidSteps: [], firstInvalidStep: null }) };
});

const operation = {
  id: "AQtoken",
  rowVersion: "rv-1",
  correlationId: "c-1",
  credOperNumber: 1042,
  credOperStep: 1,
  aplBusinessId: 3,
  aplCompanyId: 1,
  assets: [{ assetType: 1, equipment: {} }],
  insurances: [],
  interventions: [],
} as unknown as CredOperDraft;

const ERROR = "The term is above the maximum.";
const WARNING = "Manual analysis will be needed.";
const NOTE = "Valid for 30 days.";

function setup(
  saveAnswer: MockAnswer | (() => MockAnswer),
  { stage = "quotation", open = loadExisting(operation) }: { stage?: "quotation" | "proposal"; open?: Action } = {},
) {
  const calculations = { count: 0 };
  const { requests } = mockFetch((url) => {
    if (url.pathname.endsWith("/save-credoper")) return typeof saveAnswer === "function" ? saveAnswer() : saveAnswer;
    if (url.pathname.endsWith("/calculate-credoper")) {
      calculations.count += 1;
      return { json: { isCalculated: true, credOper: { conditions: [{ term: 60, flows: [{ amount: 300 }] }] } } };
    }
    if (url.pathname.includes("/credoper/")) return { json: { id: "AQtoken", credOperNumber: 1042, rowVersion: "rv-2" } };
    return { json: [] };
  });
  const store = configureStore({
    reducer: {
      [emptySplitApi.reducerPath]: emptySplitApi.reducer,
      auth: () => ({ token: TEST_TOKEN, isAuthenticated: true }),
      credoper: credoperReducer,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
  });
  store.dispatch(open);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CredOperWizardPage stage={stage} />
      </MemoryRouter>
    </Provider>,
  );
  return Object.assign(store, { calculations, requests });
}

const refused: MockAnswer = {
  json: {
    isSaved: false,
    calculationMessages: [{ severity: "Error", text: ERROR }],
    saveMessages: [{ severity: "Warning", text: WARNING }],
  },
};
const savedWith = (saveMessages: { severity: string; text: string }[]): MockAnswer => ({
  json: {
    isSaved: true,
    id: "AQtoken",
    credOper: {
      id: "AQtoken",
      credOperNumber: 1042,
      rowVersion: "rv-2",
      correlationId: "c-1",
      credOperStep: "Quotation",
      aplBusinessId: 3,
      aplCompanyId: 1,
      assets: [{ assetType: "Equipment", equipment: {} }],
    },
    saveMessages,
  },
});
const savedWithWarning = savedWith([{ severity: "Warning", text: WARNING }]);

const clickSave = () => userEvent.click(screen.getByRole("button", { name: "Save" }));
const stepButton = (name: RegExp) => within(screen.getByRole("navigation", { name: "Steps" })).getByRole("button", { name });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("a quotation already converted", () => {
  it("doesn't offer the conversion again", async () => {
    const store = setup({ json: {} });
    await screen.findByRole("button", { name: "Convert to proposal" });
    act(() => {
      store.dispatch(markSaved({ ...operation, sourceCredOperId: "AQtoken" }));
    });
    await waitFor(() => expect(screen.queryByRole("button", { name: "Convert to proposal" })).toBeNull());
  });
});

describe("the wizard after saving", () => {
  it("a refused save opens the sheet with each message and takes the user there", async () => {
    setup(refused);
    await clickSave();
    const sheet = await screen.findByRole("alert");
    expect(sheet.textContent).toContain("Not saved");
    expect(sheet.textContent).toContain(ERROR);
    expect(sheet.textContent).toContain(WARNING);
    await waitFor(() => expect(document.activeElement).toBe(sheet));
  });

  it("the bar says the result, and hiding the sheet returns to it", async () => {
    setup(refused);
    await clickSave();
    await screen.findByRole("alert");
    const status = screen.getByRole("button", { name: /Not saved: 1 error, 1 warning/ });
    expect(status.getAttribute("aria-expanded")).toBe("true");
    await userEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(document.activeElement).toBe(status);
    await userEvent.click(status);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("alert"));
  });

  it("marks Financial data when a calculation message is an error", async () => {
    setup(refused);
    await clickSave();
    await screen.findByRole("alert");
    expect(stepButton(/Financial data/).textContent).toContain("(has errors)");
  });

  it("Go to Financial data moves there and hides the sheet, the result stays in the bar", async () => {
    setup(refused);
    await clickSave();
    await screen.findByRole("alert");
    await userEvent.click(screen.getByRole("button", { name: "Go to Financial data" }));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByText(ERROR)).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /Not saved: 1 error, 1 warning/ }));
    expect(screen.getByText(ERROR)).toBeTruthy();
    // Already there: no link to it
    expect(screen.queryByRole("button", { name: "Go to Financial data" })).toBeNull();
  });

  it("keeps the messages after an edit, saying they're from before it", async () => {
    const store = setup(refused);
    await clickSave();
    await screen.findByRole("alert");
    act(() => {
      store.dispatch(patchCredoper({ amount: 20000 }));
    });
    expect(screen.getByText(ERROR)).toBeTruthy();
    expect(screen.getByText(/Save again to update these results/)).toBeTruthy();
    expect(stepButton(/Financial data/).textContent).not.toContain("(has errors)");
  });

  it("the next save replaces them", async () => {
    let answer = refused;
    const store = setup(() => answer);
    await clickSave();
    await screen.findByRole("alert");
    act(() => {
      store.dispatch(patchCredoper({ amount: 20000 }));
    });
    answer = savedWithWarning;
    await clickSave();
    await screen.findByText("Quotation #1042 saved");
    expect(screen.queryByText(ERROR)).toBeNull();
    expect(screen.queryByText(/Save again to update/)).toBeNull();
  });

  it("a save with warnings opens the sheet, reads as saved and leaves Convert available", async () => {
    setup(savedWithWarning);
    await clickSave();
    const headline = await screen.findByText("Quotation #1042 saved");
    expect(headline.closest("[role=status]")?.textContent).toContain(WARNING);
    expect(screen.queryByText("Not saved")).toBeNull();
    expect(screen.queryByText("Ready")).toBeNull();
    expect((screen.getByRole("button", { name: "Convert to proposal" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("a save with notes only stays out of the way, one click from the bar", async () => {
    setup(savedWith([{ severity: "Info", text: NOTE }]));
    await clickSave();
    const status = await screen.findByRole("button", { name: /^Saved: 1 note/ });
    expect(screen.queryByText(NOTE)).toBeNull();
    await userEvent.click(status);
    expect(screen.getByText(NOTE)).toBeTruthy();
  });

  it("a clean save just says so in the bar", async () => {
    setup(savedWith([]));
    await clickSave();
    expect(await screen.findByText("Quotation #1042 saved")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hide" })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Saved/ })).toBeNull();
  });

  it("a conflict offers to reopen, and reopening clears the results", async () => {
    setup({ status: 409, json: { title: "Conflict", status: 409, code: "concurrency_conflict" } });
    await clickSave();
    const sheet = await screen.findByRole("alert");
    expect(sheet.textContent).toContain("changed by someone else");
    await userEvent.click(screen.getByRole("button", { name: "Reopen" }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(screen.queryByRole("button", { name: /Not saved/ })).toBeNull();
  });
});

describe("saving a proposal with its interventions", () => {
  const interventions = [
    { correlationID: "p1", credOperIntervType: 1, person: {}, entity: { fullName: "Ana Silva" } },
    { correlationID: "p2", credOperIntervType: 3, person: {}, entity: { fullName: "Rui Costa" } },
  ];
  const converted = {
    id: null,
    correlationId: "c-9",
    credOperStep: 2,
    sourceCredOperId: "AQquote",
    aplBusinessId: 3,
    aplCompanyId: 1,
    assets: [{ assetType: 1, equipment: {} }],
    insurances: [],
    interventions,
  } as unknown as CredOperDraft;
  const openProposal = { stage: "proposal", open: startConverted(converted) } as const;

  const problem = (status: number, code?: string): MockAnswer => ({ status, json: { title: "Server title", status, code } });
  const BACKEND_DOWN = { status: 502, data: { code: "backend_unavailable" } };
  const VALUES_REFUSED = { status: 400, data: { code: "validation_failed" } };

  /** Everything the app asked for besides the save, of what must only run when the user asks */
  const pathsOf = (requests: Request[]) => requests.map((request) => new URL(request.url).pathname);
  const reloads = (requests: Request[]) =>
    pathsOf(requests).filter((path) => /quotation-to-proposal|new-intervention|\/credoper\//.test(path));
  const saveBodies = (requests: Request[]) =>
    Promise.all(
      requests
        .filter((request) => request.url.endsWith("/save-credoper"))
        .map((request) => request.clone().json() as Promise<{ correlationId?: string; interventions?: unknown[] }>),
    );

  it.each([
    ["400 validation_failed", problem(400, "validation_failed"), problemMessage(VALUES_REFUSED)!],
    ["400 with the API's explanation", { status: 400, json: { title: "Server title", status: 400, code: "validation_failed", detail: "The term is too long." } }, "The term is too long."],
    ["400 entity_kind_mismatch", problem(400, "entity_kind_mismatch"), "An intervention's NIF or type doesn't match its role"],
    ["409 concurrency_conflict", problem(409, "concurrency_conflict"), "changed by someone else"],
    ["502", problem(502), problemMessage(BACKEND_DOWN)!],
  ])("a %s keeps the form as the user left it, asks for nothing again and shows the error", async (_, answer, message) => {
    const store = setup(answer, openProposal);
    act(() => {
      store.dispatch(patchCredoper({ amount: 20000 }));
    });
    const before = store.getState().credoper;

    await clickSave();

    expect((await screen.findByRole("alert")).textContent).toContain(message);
    expect(store.getState().credoper).toEqual(before);
    expect(store.getState().credoper.data?.interventions).toHaveLength(2);
    expect(reloads(store.requests)).toEqual([]);
  });

  it("a 400 on a saved proposal doesn't load it again either", async () => {
    const saved = { ...converted, id: "APtoken", rowVersion: "rv-1" };
    const store = setup(problem(400, "validation_failed"), { stage: "proposal", open: loadExisting(saved) });
    const before = store.getState().credoper;

    await clickSave();
    await screen.findByRole("alert");

    expect(store.getState().credoper).toEqual(before);
    expect(reloads(store.requests)).toEqual([]);
  });

  it("isSaved: false keeps the interventions and shows the calculation and save messages", async () => {
    const store = setup(
      {
        json: {
          isSaved: false,
          // The operation as sent, with its entity blocks: the form stays what the user typed
          credOper: { correlationId: "c-9", interventions: [{ role: "Customer", entity: { vatNumber: "123456789" } }] },
          calculationMessages: [{ severity: "Error", text: ERROR }],
          saveMessages: [{ severity: "Warning", text: WARNING }],
        },
      },
      openProposal,
    );
    const before = store.getState().credoper;

    await clickSave();

    const sheet = await screen.findByRole("alert");
    expect(sheet.textContent).toContain(ERROR);
    expect(sheet.textContent).toContain(WARNING);
    expect(store.getState().credoper).toEqual(before);
    expect(reloads(store.requests)).toEqual([]);
  });

  it("a save message at severity Error: shown, nothing the user entered is lost, nothing is asked for again, and the quotation isn't used up", async () => {
    const store = setup({ json: { isSaved: false, saveMessages: [{ severity: "Error", text: ERROR }] } }, openProposal);
    const before = store.getState().credoper;
    await clickSave();
    const sheet = await screen.findByRole("alert");
    expect(sheet.textContent).toContain(ERROR);
    expect(store.getState().credoper).toEqual(before);
    expect(store.getState().credoper.convertedQuotations).toEqual([]);
    expect(reloads(store.requests)).toEqual([]);
  });

  it("saved: the quotation it came from can't be converted again in this session", async () => {
    const store = setup({ json: { isSaved: true, id: "APsaved", credOper: { id: "APsaved", rowVersion: "rv-2" } } }, openProposal);
    await clickSave();
    await waitFor(() => expect(store.getState().credoper.convertedQuotations).toContain(converted.sourceCredOperId));
  });

  it("retrying a failed save sends the same correlationId, and the people the user added", async () => {
    let answer = problem(400, "validation_failed");
    const store = setup(() => answer, openProposal);
    await clickSave();
    await screen.findByText(problemMessage(VALUES_REFUSED)!);
    answer = problem(502);
    await clickSave();
    await screen.findByText(problemMessage(BACKEND_DOWN)!);
    answer = refused;
    await clickSave();
    await screen.findByText(ERROR);

    const bodies = await saveBodies(store.requests);
    expect(bodies.map((body) => body.correlationId)).toEqual(["c-9", "c-9", "c-9"]);
    expect(bodies.map((body) => body.interventions?.length)).toEqual([2, 2, 2]);
  });

  it("a successful save replaces the state with the returned operation, and asks for nothing else", async () => {
    const store = setup(
      {
        json: {
          isSaved: true,
          id: "APtoken",
          credOper: {
            id: "APtoken",
            credOperNumber: 7,
            rowVersion: "rv-1",
            correlationId: "c-9",
            credOperStep: "Proposal",
            amount: 12000,
            interventions: [{ id: "i1", role: "Customer", entity: { vatNumber: "123456789" } }],
          },
        },
      },
      openProposal,
    );
    act(() => {
      store.dispatch(patchCredoper({ amount: 20000 }));
    });

    await clickSave();
    await screen.findByText("Proposal #7 saved");

    const { data, isDirty } = store.getState().credoper;
    expect(data).toMatchObject({ id: "APtoken", rowVersion: "rv-1", correlationId: "c-9", amount: 12000, credOperNumber: 7 });
    expect(data?.interventions).toHaveLength(1);
    expect(data?.interventions?.[0].id).toBe("i1");
    expect(isDirty).toBe(false);
    expect(reloads(store.requests)).toEqual([]);
  });
});

describe("Calculate on Financial data", () => {
  const next = () => screen.getByRole("button", { name: /Next/ }) as HTMLButtonElement;
  const calculate = () => screen.getByRole("button", { name: "Calculate" }) as HTMLButtonElement;
  const onFinancialData = async () => {
    await userEvent.click(stepButton(/Financial data/));
    await screen.findByLabelText("Calculation");
  };
  const stepShown = () => screen.getByRole("heading", { level: 3 }).textContent;

  it("is in the side panel, under the financed amount's detail, and only there", async () => {
    setup(refused);
    await onFinancialData();
    expect(screen.getAllByRole("button", { name: "Calculate" })).toHaveLength(1);
    expect(within(screen.getByLabelText("Calculation")).getByRole("button", { name: "Calculate" })).toBeTruthy();
  });

  it("Next without a calculation stays on the step and points at Calculate, which takes the focus", async () => {
    const store = setup(refused);
    await onFinancialData();
    expect(calculate().className).not.toContain("is-nudged");
    const step = stepShown();

    await userEvent.click(next());

    expect(stepShown()).toBe(step);
    expect(calculate().className).toContain("is-nudged");
    expect(document.activeElement).toBe(calculate());
    expect(store.calculations.count).toBe(0);
  });

  it("the highlight is brief", async () => {
    setup(refused);
    await onFinancialData();
    await userEvent.click(next());
    expect(calculate().className).toContain("is-nudged");
    await waitFor(() => expect(calculate().className).not.toContain("is-nudged"), { timeout: 2500 });
  });

  it("once calculated Calculate steps back, and Next moves on with no highlight", async () => {
    const store = setup(refused);
    await onFinancialData();
    expect(calculate().className).toContain("btn-primary");
    await userEvent.click(calculate());
    await waitFor(() => expect(next().className).toContain("btn-primary"));
    expect(store.calculations.count).toBe(1);
    expect(calculate().className).not.toContain("btn-primary");
    const step = stepShown();

    await userEvent.click(next());

    await waitFor(() => expect(stepShown()).not.toBe(step));
    expect(screen.queryByLabelText("Calculation")).toBeNull();
  });
});
