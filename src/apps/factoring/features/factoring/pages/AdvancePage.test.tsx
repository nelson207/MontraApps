// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockFetch, renderWithApi, type MockAnswer } from "@platform/features/news/testing/renderWithApi";
import { SUMMARY_DEBOUNCE_MS } from "../hooks/useAdvanceSummary";
import AdvancePage from "./AdvancePage";
import AdvancesPage from "./AdvancesPage";

// The real page and API client against a mocked server, including the success paths the test
// contracts can't reach (confirming advances currently fail on them).

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const contract = (extra: Record<string, unknown>) => ({
  id: "AQ/f+1",
  number: 100053964,
  kind: "Factoring",
  financialInstitution: "Banco Um",
  currencyId: "EUR",
  availableAmount: 1000,
  totalAmount: 5000,
  canSubmit: true,
  canAdvance: true,
  hasAdvanceInProgress: false,
  ...extra,
});
const FACTORING = contract({});
const CONFIRMING = contract({ id: "AQ/c+1", number: 100053963, kind: "Confirming", financialInstitution: "Banco Dois" });

const invoice = (n: number, amount: number | null, contractId = "AQ/c+1", contractNumber = 100053963) => ({
  id: `AQ/d+${n}`,
  invoiceNumber: `FT ${n}`,
  counterparty: "Importadora",
  contractId,
  contractNumber,
  kind: "Confirming",
  currencyId: "EUR",
  dueDate: "2026-12-01",
  amount,
  status: "Approved",
});

const summaryOk = { costsAvailable: true, maxAmount: null, availableAmount: null, plafondAvailableAmount: null, netAmount: 290, interestAmount: 10, commissionAmount: 5, discountAmount: null, taxAmount: 1, isucAmount: 2, regularizationAmount: 0, netCost: 18, documents: [{ documentId: "AQ/d+1", invoiceNumber: "FT 1", advanceAmount: 100, netAmount: 97 }], messages: [] };
const started = { json: { isStarted: true, isUncertain: false, advanceId: null, batchId: "AQ/b+1", messages: [] } };
const finishedOk = { json: { id: "AQ/b+1", isFinished: true, isSuccessful: true, advanceId: "AQ/a+1", advanceStatus: "Initial", messages: [] } };
const summaryNoCosts = { costsAvailable: false, maxAmount: 750, availableAmount: 1000, plafondAvailableAmount: 600, netAmount: null, interestAmount: null, commissionAmount: null, discountAmount: null, taxAmount: null, isucAmount: null, regularizationAmount: null, netCost: null, documents: [{ documentId: "AQ/d+1", invoiceNumber: "FT 1", advanceAmount: null, netAmount: null, maxAmount: 100 }], messages: [] };
const message = { severity: "Error", text: "Plafond insuficiente" };

type Server = {
  contracts?: unknown[];
  invoices?: unknown[];
  summary?: () => MockAnswer;
  post?: () => MockAnswer;
  batch?: () => MockAnswer;
};

function server({ contracts = [FACTORING, CONFIRMING], invoices = [invoice(1, 100.5), invoice(2, 200.25), invoice(3, null), invoice(9, 5, "AQ/other", 77)], summary = () => ({ json: summaryOk }), post = () => started, batch = () => finishedOk }: Server = {}) {
  return mockFetch((url, request) => {
    const path = url.pathname;
    if (path === "/api/factoring/contracts") return { json: { items: contracts, page: 1, pageSize: 100, totalCount: contracts.length } };
    if (path === "/api/factoring/documents") {
      const own = (invoices as { contractId?: string }[]).filter((i) => i.contractId === url.searchParams.get("contractId"));
      return { json: { items: own, page: 1, pageSize: 100, totalCount: own.length, outstandingAmounts: [] } };
    }
    if (path.endsWith("/advances/summary") && request.method === "POST") return summary();
    if (path.endsWith("/advances") && request.method === "POST") return post();
    if (path.startsWith("/api/factoring/advances/batches/")) return batch();
    return undefined;
  });
}

const posts = (requests: Request[]) => requests.filter((r) => r.method === "POST" && new URL(r.url).pathname.endsWith("/advances"));
const bodies = (requests: Request[]) => Promise.all(posts(requests).map((r) => r.clone().json()));
const summaries = (requests: Request[]) => requests.filter((r) => new URL(r.url).pathname.endsWith("/advances/summary"));
const batchReads = (requests: Request[]) => requests.filter((r) => new URL(r.url).pathname.startsWith("/api/factoring/advances/batches/"));

const renderPage = () =>
  renderWithApi(
    <Routes>
      <Route path="/factoring/advance" element={<AdvancePage />} />
    </Routes>,
    { route: "/factoring/advance" },
  );

const chooseCard = async (name: RegExp) => fireEvent.click(await screen.findByRole("radio", { name }));
const next = () => fireEvent.click(screen.getByRole("button", { name: /^Next/ }));
const requestButton = () => screen.getByRole("button", { name: /Request advance/ });
const amountField = () => document.getElementById("advance-amount") as HTMLInputElement;
const valueDate = (value = "10/11/2026") => fireEvent.change(document.getElementById("advance-value-date") as HTMLElement, { target: { value } });
const select = async (n: number) => fireEvent.click(await screen.findByRole("checkbox", { name: `Select invoice FT ${n}` }));
const tick = (ms = 2_000) => act(() => vi.advanceTimersByTimeAsync(ms));

async function readyFactoring(amount = "500") {
  await chooseCard(/Banco Um/);
  fireEvent.change(amountField(), { target: { value: amount } });
  valueDate();
}

async function readyConfirming() {
  await chooseCard(/Banco Dois/);
  await select(1);
  valueDate();
}

beforeEach(() => sessionStorage.clear());

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("step 1", () => {
  it("canAdvance false disables the card and says an advance is in progress", async () => {
    server({ contracts: [contract({ canAdvance: false, hasAdvanceInProgress: true }), CONFIRMING] });
    renderPage();
    expect(((await screen.findByRole("radio", { name: /Banco Um/ })) as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText("An advance is already in progress on this agreement.")).toBeTruthy();
  });

  it("canSubmit false doesn't stop an advance", async () => {
    server({ contracts: [contract({ canSubmit: false }), CONFIRMING] });
    renderPage();
    expect(((await screen.findByRole("radio", { name: /Banco Um/ })) as HTMLInputElement).disabled).toBe(false);
  });

  it("Next asks for an agreement when there are several", async () => {
    server();
    renderPage();
    await screen.findByRole("radio", { name: /Banco Um/ });
    next();
    expect(await screen.findByText("Select an agreement.")).toBeTruthy();
  });
});

describe("moving through the steps", () => {
  it("choosing an agreement moves on, and Back brings the card back", async () => {
    server();
    renderPage();
    await chooseCard(/Banco Um/);
    await waitFor(() => expect(amountField()).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByRole("radio", { name: /Banco Um/, checked: true })).toBeTruthy();
  });

  it("one agreement that can advance, among others that can't: chosen, but the step stays to say why", async () => {
    server({ contracts: [contract({ canAdvance: false, hasAdvanceInProgress: true }), CONFIRMING] });
    renderPage();
    expect(await screen.findByRole("radio", { name: /Banco Dois/, checked: true })).toBeTruthy();
    expect(screen.getByText("An advance is already in progress on this agreement.")).toBeTruthy();
    next();
    await waitFor(() => expect(amountField()).toBeTruthy());
  });

  it("the only agreement: its step is left out", async () => {
    server({ contracts: [FACTORING] });
    renderPage();
    await waitFor(() => expect(amountField()).toBeTruthy());
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });
});

describe("step 2, factoring", () => {
  it("shows what is available, no invoice picker, and refuses an amount above it", async () => {
    const { requests } = server();
    renderPage();
    await readyFactoring("1000.01");
    expect(screen.getByText("€1,000.00")).toBeTruthy();
    expect(screen.queryByRole("checkbox")).toBeNull();
    fireEvent.click(requestButton());
    expect(await screen.findByText("The amount is above what is available on this agreement.")).toBeTruthy();
    expect(posts(requests)).toHaveLength(0);
  });

  it("sends amount and value date only, with a UUID, and no invoices are read", async () => {
    const { requests } = server();
    renderPage();
    await readyFactoring();
    fireEvent.click(requestButton());
    await waitFor(() => expect(posts(requests)).toHaveLength(1));
    const [body] = await bodies(requests);
    expect(body.correlationId).toMatch(UUID);
    expect(body).toEqual({ correlationId: body.correlationId, amount: 500, valueDate: "2026-11-10" });
    expect(new URL(posts(requests)[0].url).pathname).toBe(`/api/factoring/contracts/${encodeURIComponent("AQ/f+1")}/advances`);
    expect(requests.some((r) => new URL(r.url).pathname === "/api/factoring/documents")).toBe(false);
    expect(summaries(requests)).toHaveLength(0);
  });

  it("asks for what is missing", async () => {
    const { requests } = server();
    renderPage();
    await chooseCard(/Banco Um/);
    fireEvent.click(requestButton());
    expect(await screen.findByText("Enter an amount above zero.")).toBeTruthy();
    expect(screen.getByText("Enter the value date.")).toBeTruthy();
    expect(posts(requests)).toHaveLength(0);
  });
});

describe("step 2, confirming", () => {
  it("asks the API for this agreement's approved invoices, with the id as it is", async () => {
    const { requests } = server();
    renderPage();
    await chooseCard(/Banco Dois/);
    await select(1);
    expect(screen.queryByRole("checkbox", { name: "Select invoice FT 9" })).toBeNull();
    const read = new URL((requests.find((r) => new URL(r.url).pathname === "/api/factoring/documents") as Request).url).searchParams;
    expect(read.get("contractId")).toBe("AQ/c+1");
    expect(read.get("status")).toBe("Approved");
    expect(read.get("kind")).toBe("Confirming");
  });

  it("the amount defaults to the sum of the selected invoices, can be edited, and a new selection restores the sum", async () => {
    server();
    renderPage();
    await chooseCard(/Banco Dois/);
    await select(1);
    await select(2);
    expect(amountField().value).toBe("300.75");
    fireEvent.change(amountField(), { target: { value: "120" } });
    expect(amountField().value).toBe("120");
    await select(2);
    expect(amountField().value).toBe("100.5");
  });

  it("an invoice with no amount leaves the sum empty rather than guessing", async () => {
    server();
    renderPage();
    await chooseCard(/Banco Dois/);
    await select(1);
    await select(3);
    expect(amountField().value).toBe("");
  });

  it("needs an invoice, and no approved invoices is said plainly", async () => {
    const { requests } = server();
    renderPage();
    await chooseCard(/Banco Dois/);
    await screen.findByRole("checkbox", { name: "Select invoice FT 1" });
    fireEvent.click(requestButton());
    expect(await screen.findByText("Select at least one invoice.")).toBeTruthy();
    expect(posts(requests)).toHaveLength(0);
    cleanup();
    server({ invoices: [] });
    renderPage();
    await chooseCard(/Banco Dois/);
    expect(await screen.findByText(/no approved invoices/)).toBeTruthy();
  });

  it("sends the documentIds as they came, and doesn't cap the amount here", async () => {
    const { requests } = server();
    renderPage();
    await readyConfirming();
    fireEvent.change(amountField(), { target: { value: "99999" } });
    fireEvent.click(requestButton());
    await waitFor(() => expect(posts(requests)).toHaveLength(1));
    const [body] = await bodies(requests);
    expect(body).toEqual({ correlationId: body.correlationId, amount: 99999, valueDate: "2026-11-10", documentIds: ["AQ/d+1"] });
  });
});

describe("the summary", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));

  it("is asked once the typing stops, with the current inputs", async () => {
    const { requests } = server();
    renderPage();
    await readyConfirming();
    for (const value of ["1", "12", "123"]) {
      fireEvent.change(amountField(), { target: { value } });
      await tick(100);
    }
    expect(summaries(requests)).toHaveLength(0);
    await tick(SUMMARY_DEBOUNCE_MS);
    await waitFor(() => expect(summaries(requests)).toHaveLength(1));
    expect(await summaries(requests)[0].clone().json()).toEqual({ documentIds: ["AQ/d+1"], amount: 123, valueDate: "2026-11-10" });
    expect((await screen.findByText("Net cost")).closest("div")?.textContent).toContain("€18.00");
    expect(screen.getByText("Discount").closest("div")?.textContent).toContain("Unavailable");
  });

  it("with messages the amounts aren't real: the message, and no amounts", async () => {
    server({ summary: () => ({ json: { ...summaryOk, messages: [message] } }) });
    renderPage();
    await readyConfirming();
    await tick(SUMMARY_DEBOUNCE_MS);
    expect(await screen.findByText("Plafond insuficiente")).toBeTruthy();
    expect(screen.queryByText("Net cost")).toBeNull();
    expect(screen.queryByText("€18.00")).toBeNull();
  });

  it("a cost for an older selection is hidden as soon as the inputs change", async () => {
    server();
    renderPage();
    await readyConfirming();
    await tick(SUMMARY_DEBOUNCE_MS);
    await screen.findByText("Net cost");
    await select(2);
    expect(screen.queryByText("Net cost")).toBeNull();
    expect(screen.getByText("Checking the advance…")).toBeTruthy();
  });

  it("without costs: the limits and why there is no cost, with no empty amounts", async () => {
    server({ summary: () => ({ json: summaryNoCosts }) });
    renderPage();
    await readyConfirming();
    await tick(SUMMARY_DEBOUNCE_MS);
    expect((await screen.findByText("Maximum for this advance")).closest("div")?.textContent).toContain("€750.00");
    expect(screen.getByText("Plafond available").closest("div")?.textContent).toContain("€600.00");
    expect(screen.getByText(/The cost can't be shown before you request/)).toBeTruthy();
    expect(screen.getByText(/so it can still be refused/)).toBeTruthy();
    expect(screen.queryByText("Net cost")).toBeNull();
    expect(screen.queryByText("Unavailable")).toBeNull();
    const line = screen.getByRole("row", { name: /FT 1 €100.00/ });
    expect(line).toBeTruthy();
  });

  it("the available amount already on the page isn't repeated, a different one is shown", async () => {
    server({ summary: () => ({ json: summaryNoCosts }) });
    renderPage();
    await readyConfirming();
    await tick(SUMMARY_DEBOUNCE_MS);
    await screen.findByText("Maximum for this advance");
    expect(screen.queryByText("Available for an advance")).toBeNull();
    cleanup();
    server({ summary: () => ({ json: { ...summaryNoCosts, availableAmount: 900 } }) });
    renderPage();
    await readyConfirming();
    await tick(SUMMARY_DEBOUNCE_MS);
    expect((await screen.findByText("Available for an advance")).closest("div")?.textContent).toContain("€900.00");
  });

  it("over the maximum: the message and the limits together", async () => {
    server({ summary: () => ({ json: { ...summaryNoCosts, messages: [{ severity: "Warning", text: "Acima do máximo" }] } }) });
    renderPage();
    await readyConfirming();
    await tick(SUMMARY_DEBOUNCE_MS);
    expect(await screen.findByText("Acima do máximo")).toBeTruthy();
    expect(screen.getByText("Maximum for this advance").closest("div")?.textContent).toContain("€750.00");
    expect(screen.queryByText(/The cost can't be shown/)).toBeNull();
  });

  it("no summary is asked until it is complete, and an error is shown without stopping the request", async () => {
    const { requests } = server({ summary: () => ({ status: 502, json: { status: 502, code: "backend_unavailable" } }) });
    renderPage();
    await chooseCard(/Banco Dois/);
    await select(1);
    await tick(SUMMARY_DEBOUNCE_MS);
    expect(summaries(requests)).toHaveLength(0);
    expect(screen.getByText(/to check this advance/)).toBeTruthy();
    valueDate();
    await tick(SUMMARY_DEBOUNCE_MS);
    expect(await screen.findByText("The service is temporarily unavailable. Please try again later.")).toBeTruthy();
    expect((requestButton() as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("the double click", () => {
  it("two clicks in the same tick send one advance", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { requests } = server({ post: () => ({ ...started, delay: 20 }) });
    renderPage();
    await readyFactoring();
    const button = requestButton();
    fireEvent.click(button);
    fireEvent.click(button);
    expect((button as HTMLButtonElement).disabled).toBe(true);
    await screen.findByText("Processing the advance…");
    expect(posts(requests)).toHaveLength(1);
  });
});

describe("the answer to the POST", () => {
  it("isStarted false shows the messages, keeps the form, and the next try has a NEW id, also with a batchId", async () => {
    let call = 0;
    const { requests } = server({
      post: () => (call++ === 0 ? { json: { isStarted: false, isUncertain: false, advanceId: null, batchId: "AQ/b+failed", messages: [message] } } : started),
    });
    renderPage();
    await readyConfirming();
    fireEvent.click(requestButton());
    expect(await screen.findByText("Plafond insuficiente")).toBeTruthy();
    expect(screen.getByText("The advance didn't start.")).toBeTruthy();
    expect(batchReads(requests)).toHaveLength(0);
    expect(amountField().value).toBe("100.5");
    fireEvent.click(requestButton());
    await waitFor(() => expect(posts(requests)).toHaveLength(2));
    const [first, second] = await bodies(requests);
    expect(second.correlationId).not.toBe(first.correlationId);
  });

  it("isUncertain shows the messages, offers no retry and links to the list", async () => {
    const { requests } = server({ post: () => ({ json: { isStarted: false, isUncertain: true, messages: [{ severity: "Warning", text: "Might have started" }] } }) });
    renderPage();
    await readyFactoring();
    fireEvent.click(requestButton());
    expect(await screen.findByText("Might have started")).toBeTruthy();
    expect(screen.getByRole("link", { name: "View advances" }).getAttribute("href")).toBe("/factoring/advances");
    // The form behind it is hidden, so neither way of sending is on offer
    expect(screen.queryByRole("button", { name: /Send again|Request advance/ })).toBeNull();
    expect(posts(requests)).toHaveLength(1);
  });

  it("400 factoring_advance_in_progress says so, re-reads the agreements, and the next try has a NEW id", async () => {
    let call = 0;
    const { requests } = server({
      post: () => (call++ === 0 ? { status: 400, json: { title: "x", status: 400, code: "factoring_advance_in_progress" } } : started),
    });
    renderPage();
    await readyFactoring();
    const contractReads = () => requests.filter((r) => new URL(r.url).pathname === "/api/factoring/contracts").length;
    const before = contractReads();
    fireEvent.click(requestButton());
    expect(await screen.findByText(/already has an advance in progress/)).toBeTruthy();
    await waitFor(() => expect(contractReads()).toBeGreaterThan(before));
    fireEvent.click(requestButton());
    await waitFor(() => expect(posts(requests)).toHaveLength(2));
    const [first, second] = await bodies(requests);
    expect(second.correlationId).not.toBe(first.correlationId);
  });

  it("a network error repeats the SAME id and body", async () => {
    let call = 0;
    const { requests } = server({
      post: () => {
        if (call++ === 0) throw new TypeError("Failed to fetch");
        return started;
      },
    });
    renderPage();
    await readyFactoring();
    fireEvent.click(requestButton());
    fireEvent.click(await screen.findByRole("button", { name: "Send again" }));
    await screen.findByText("Processing the advance…");
    const [first, second] = await bodies(requests);
    expect(second).toEqual(first);
  });
});

describe("following the batch", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));

  const startAdvance = async (setup: Server) => {
    const mock = server(setup);
    renderPage();
    await readyFactoring();
    fireEvent.click(requestButton());
    await screen.findByText("Processing the advance…");
    return mock;
  };

  it("polls every 2 seconds on the encoded id, while isFinished is false, whatever isSuccessful says", async () => {
    let reads = 0;
    const { requests } = await startAdvance({ batch: () => (reads++ < 2 ? { json: { isFinished: false, isSuccessful: true } } : finishedOk) });
    await tick();
    expect(batchReads(requests)).toHaveLength(1);
    expect(new URL(batchReads(requests)[0].url).pathname).toBe(`/api/factoring/advances/batches/${encodeURIComponent("AQ/b+1")}`);
    expect(screen.getByText("Processing the advance…")).toBeTruthy();
    await tick();
    expect(batchReads(requests)).toHaveLength(2);
    await tick();
    expect(await screen.findByText("Advance requested")).toBeTruthy();
    await tick(10_000);
    expect(batchReads(requests)).toHaveLength(3);
  });

  it("successful: confirms, saying it waits for the back office when Initial", async () => {
    await startAdvance({});
    await tick();
    expect(await screen.findByText("Advance requested")).toBeTruthy();
    expect(screen.getByText("It waits for back-office action.")).toBeTruthy();
  });

  it("successful and not Initial: no such note", async () => {
    await startAdvance({ batch: () => ({ json: { isFinished: true, isSuccessful: true, advanceStatus: "Active" } }) });
    await tick();
    expect(await screen.findByText("Advance requested")).toBeTruthy();
    expect(screen.queryByText("It waits for back-office action.")).toBeNull();
  });

  it("result Failed says so, with its messages, and going back keeps the form for a NEW id", async () => {
    const { requests } = await startAdvance({ batch: () => ({ json: { isFinished: true, isSuccessful: false, result: "Failed", advanceId: null, advanceIds: [], messages: [message] } }) });
    await tick();
    expect(await screen.findByText("The advance failed")).toBeTruthy();
    expect(screen.getByText("Plafond insuficiente")).toBeTruthy();
    expect(screen.getByRole("link", { name: "View advances" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to the advance" }));
    expect(amountField().value).toBe("500");
    fireEvent.click(requestButton());
    await waitFor(() => expect(posts(requests)).toHaveLength(2));
    const [first, second] = await bodies(requests);
    expect(second.correlationId).not.toBe(first.correlationId);
  });

  it("result Succeeded confirms it, whatever isSuccessful says", async () => {
    await startAdvance({ batch: () => ({ json: { isFinished: true, isSuccessful: false, result: "Succeeded", advanceIds: ["AQ/a+1"], advanceStatus: "Active" } }) });
    await tick();
    expect(await screen.findByText("Advance requested")).toBeTruthy();
  });

  it("result Unknown sends the user to the list, and isn't called a failure", async () => {
    await startAdvance({ batch: () => ({ json: { isFinished: true, isSuccessful: true, result: "Unknown", messages: [] } }) });
    await tick();
    expect(await screen.findByText("The advance couldn't be confirmed here")).toBeTruthy();
    expect(screen.queryByText(/failed/i)).toBeNull();
  });

  it("no result, not successful: isn't called a failure, its messages and a link to the list", async () => {
    await startAdvance({ batch: () => ({ json: { isFinished: true, isSuccessful: false, advanceId: null, messages: [{ severity: "Warning", text: "Check the list" }] } }) });
    await tick();
    expect(await screen.findByText("Check the list")).toBeTruthy();
    expect(screen.getByText("The advance couldn't be confirmed here")).toBeTruthy();
    expect(screen.queryByText(/failed/i)).toBeNull();
    expect(screen.getByRole("link", { name: "View advances" }).getAttribute("href")).toBe("/factoring/advances");
  });

  it("after that, a new advance is a new attempt with a NEW id", async () => {
    const { requests } = await startAdvance({ batch: () => ({ json: { isFinished: true, isSuccessful: false, messages: [] } }) });
    await tick();
    fireEvent.click(await screen.findByRole("button", { name: "New advance" }));
    await readyFactoring();
    fireEvent.click(requestButton());
    await waitFor(() => expect(posts(requests)).toHaveLength(2));
    const [first, second] = await bodies(requests);
    expect(second.correlationId).not.toBe(first.correlationId);
  });

  it("a failed read isn't a failed advance: polling goes on", async () => {
    let reads = 0;
    await startAdvance({ batch: () => (reads++ === 0 ? { status: 502, json: { status: 502 } } : finishedOk) });
    await tick();
    expect(screen.getByText("Processing the advance…")).toBeTruthy();
    await tick();
    expect(await screen.findByText("Advance requested")).toBeTruthy();
  });

  it("after 2 minutes it says it is still processing, not that it failed, and can check again", async () => {
    let finished = false;
    const { requests } = await startAdvance({ batch: () => (finished ? finishedOk : { json: { isFinished: false } }) });
    await tick(120_000);
    expect(await screen.findByText("The advance is still processing")).toBeTruthy();
    expect(screen.getByText(/which doesn't mean it failed/)).toBeTruthy();
    expect(batchReads(requests).length).toBeLessThanOrEqual(60);
    const readsAtTimeout = batchReads(requests).length;
    await tick(10_000);
    expect(batchReads(requests)).toHaveLength(readsAtTimeout);
    finished = true;
    fireEvent.click(screen.getByRole("button", { name: "Check again" }));
    await tick();
    expect(await screen.findByText("Advance requested")).toBeTruthy();
  });

  it("a reload while processing keeps following it, without sending anything again", async () => {
    const { requests } = await startAdvance({ batch: () => ({ json: { isFinished: false } }) });
    expect(posts(requests)).toHaveLength(1);
    cleanup();
    const again = server();
    renderPage();
    expect(await screen.findByText("Processing the advance…")).toBeTruthy();
    await tick();
    expect(await screen.findByText("Advance requested")).toBeTruthy();
    expect(posts(again.requests)).toHaveLength(0);
  });
});

describe("the advances list", () => {
  const list = (extra = {}) => ({ json: { items: [{ id: "AQ/a+1", number: 901, contractId: "AQ/f+1", valueDate: "2026-10-30", amount: 12000, status: "INI", stateName: "Inicial", ...extra }], page: 1, pageSize: 10, totalCount: 1 } });

  const listServer = (answer: () => MockAnswer) =>
    mockFetch((url) => {
      if (url.pathname === "/api/factoring/advances") return answer();
      if (url.pathname === "/api/factoring/contracts") return { json: { items: [FACTORING], page: 1, pageSize: 100, totalCount: 1 } };
      return undefined;
    });

  it("shows stateName rather than the abbreviation, and the amount in the agreement's currency", async () => {
    listServer(() => list());
    renderWithApi(<AdvancesPage />);
    const row = (await screen.findByText("901")).closest("tr") as HTMLElement;
    expect(within(row).getByText("Inicial")).toBeTruthy();
    expect(row.textContent).not.toContain("INI");
    await waitFor(() => expect(row.textContent).toContain("€12,000.00"));
    expect(row.textContent).toContain("Banco Um");
  });

  it("a null amount isn't 0", async () => {
    listServer(() => list({ amount: null }));
    renderWithApi(<AdvancesPage />);
    const row = (await screen.findByText("901")).closest("tr") as HTMLElement;
    expect(row.textContent).not.toContain("0.00");
  });

  it("filters by agreement with the id as it is, and has empty and error states", async () => {
    const { requests } = listServer(() => ({ json: { items: [], page: 1, pageSize: 10, totalCount: 0 } }));
    renderWithApi(<AdvancesPage />);
    expect(await screen.findByText(/No advances yet/)).toBeTruthy();
    await screen.findByRole("option", { name: /Banco Um/ });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "AQ/f+1" } });
    await waitFor(() => expect(new URL(requests.at(-1)?.url as string).searchParams.get("contractId")).toBe("AQ/f+1"));
    cleanup();
    listServer(() => ({ status: 502, json: { status: 502, code: "backend_unavailable" } }));
    renderWithApi(<AdvancesPage />);
    expect(await screen.findByRole("button", { name: "Retry" })).toBeTruthy();
  });
});
