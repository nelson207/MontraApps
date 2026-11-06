// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeStore, mockFetch, renderWithApi, type MockAnswer } from "@platform/features/news/testing/renderWithApi";
import PayStocksPage from "./PayStocksPage";

Element.prototype.scrollIntoView = () => undefined; // jsdom has none (the searchable select uses it)

// The real page and API client against a mocked server: what is asserted is what would be sent.

const CONTRACT_ID = "AQ/c+1";
const BASE = `/api/stock/contracts/${encodeURIComponent(CONTRACT_ID)}`;
const ROUTE = `/stock/agreements/${encodeURIComponent(CONTRACT_ID)}/pay`;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const unit = (item: number, state: string | null, amount: number | null) => ({
  id: `AQ/unit+${item}`,
  contractId: CONTRACT_ID,
  contractNumber: 50001,
  item,
  state,
  amount,
  currencyId: "EUR",
  brand: "Renault",
  model: "Clio",
  vin: `VIN${item}`,
});

const ACCOUNT = { id: "AQ/acc+1", number: 7001, relation: "Current", currencyId: "EUR", plafondAmount: 1000, totalCapital: 5000, totalInterest: 1, totalWithTaxes: 5001 };
const MESSAGE = { severity: "Error", text: "Existe variação de Capital após a data..." };

type Server = {
  units?: unknown[];
  accounts?: unknown[] | (() => MockAnswer);
  payment?: () => MockAnswer;
  status?: () => MockAnswer;
  unit?: () => MockAnswer;
};

function server({ units = [unit(1, "Activate", 100.5), unit(2, "Activate", 200.25), unit(3, "Pending", 50), unit(4, null, null)], accounts = [ACCOUNT], payment, status, unit: unitAnswer }: Server) {
  return mockFetch((url, request) => {
    const path = url.pathname;
    if (path === "/api/stock/units") return { json: { items: units, page: Number(url.searchParams.get("page")), pageSize: 20, totalCount: units.length } };
    if (path === `${BASE}/netting-accounts`) return typeof accounts === "function" ? accounts() : { json: accounts };
    if (path === `${BASE}/payment-end-reasons`) return { json: [{ id: 0, name: "Paid off" }, { id: 9, name: "Sold" }] };
    if (path === "/api/stock/payments" && request.method === "POST") {
      const answer = payment?.();
      return answer ?? { json: { isStarted: false, isUncertain: false, paymentId: null, messages: [] } };
    }
    if (path.startsWith("/api/stock/payments/")) return status?.();
    if (path.startsWith("/api/stock/units/")) return unitAnswer?.() ?? { json: unit(1, "Activate", 100.5) };
    return undefined;
  });
}

const posts = (requests: Request[]) => requests.filter((r) => r.method === "POST" && new URL(r.url).pathname === "/api/stock/payments");
const postedBodies = (requests: Request[]) => Promise.all(posts(requests).map((r) => r.clone().json()));

const renderPage = () =>
  renderWithApi(
    <Routes>
      <Route path="/stock/agreements/:id/pay" element={<PayStocksPage />} />
    </Routes>,
    { route: ROUTE, store: makeStore() },
  );

const select = async (item: number) => fireEvent.click(await screen.findByRole("checkbox", { name: `Select unit ${item}` }));

async function choose(fieldId: string, option: string) {
  fireEvent.click(document.getElementById(fieldId) as HTMLElement);
  fireEvent.click(await screen.findByRole("option", { name: option }));
}

/** Fills everything in and opens the confirmation, ready to confirm */
async function openConfirmation() {
  await select(1);
  await choose("pay-reason", "Sold");
  fireEvent.change(document.getElementById("pay-date") as HTMLElement, { target: { value: "05/11/2026" } });
  fireEvent.click(screen.getByRole("button", { name: /Review payment/ }));
  const confirm = await screen.findByRole("button", { name: /Confirm payment/ });
  await waitFor(() => expect((confirm as HTMLButtonElement).disabled).toBe(false));
  return confirm;
}

const started = { json: { isStarted: true, isUncertain: false, paymentId: "AQ/pay+1", messages: [] } };

beforeEach(() => sessionStorage.clear());

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the form", () => {
  it("only active units can be selected", async () => {
    server({});
    renderPage();
    expect((await screen.findByRole("checkbox", { name: "Select unit 1" }) as HTMLInputElement).disabled).toBe(false);
    expect((screen.getByRole("checkbox", { name: "Select unit 3" }) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole("checkbox", { name: "Select unit 4" }) as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText("No state")).toBeTruthy();
  });

  it("a real unit with no brand, model or VIN gets a clean label", async () => {
    server({ units: [{ ...unit(1, "Activate", 1500), brand: null, model: null, vin: null }] });
    renderPage();
    await select(1);
    expect(screen.getByRole("row", { name: /#1/ }).textContent).not.toContain("·");
  });

  it("prefills the amount with the sum of the selected units, and it can be edited", async () => {
    server({});
    renderPage();
    const amount = () => document.getElementById("pay-amount") as HTMLInputElement;
    await select(1);
    await select(2);
    expect(amount().value).toBe("300.75");
    fireEvent.change(amount(), { target: { value: "120" } });
    expect(amount().value).toBe("120");
    await select(2);
    expect(amount().value).toBe("100.5");
  });

  it("preselects the only account; partial payment starts off; the date starts empty", async () => {
    server({});
    renderPage();
    await select(1);
    expect(document.getElementById("pay-account")?.textContent).toContain("7001");
    expect((screen.getByLabelText("Allow partial payment") as HTMLInputElement).checked).toBe(false);
    expect((document.getElementById("pay-date") as HTMLInputElement).value).toBe("");
  });

  it("asks for what is missing and sends nothing", async () => {
    const { requests } = server({});
    renderPage();
    await select(1);
    fireEvent.click(screen.getByRole("button", { name: /Review payment/ }));
    expect(await screen.findByText("Enter the value date.")).toBeTruthy();
    expect(screen.getByText("Select the end reason.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Confirm payment/ })).toBeNull();
    expect(posts(requests)).toHaveLength(0);
  });

  it("no account: no way to pay", async () => {
    server({ accounts: [] });
    renderPage();
    expect(await screen.findByText(/has no netting account/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Review payment/ })).toBeNull();
  });

  it("warns when the balance couldn't be read, and shows 'unavailable', not 0", async () => {
    server({ accounts: [{ ...ACCOUNT, totalCapital: null }] });
    renderPage();
    expect(await screen.findByText("This account's balance couldn't be read.")).toBeTruthy();
    expect(document.getElementById("pay-account")?.textContent).toContain("unavailable");
    expect(document.getElementById("pay-account")?.textContent).not.toContain("0.00");
  });
});

describe("the confirmation", () => {
  it("shows the stocks, account, amount and date, and going back sends nothing and keeps the form", async () => {
    const { requests } = server({});
    renderPage();
    const confirm = await openConfirmation();
    expect(confirm.textContent).toContain("€100.50");
    expect(screen.getByRole("listitem").textContent).toContain("#1 · Renault Clio · VIN1");
    expect(screen.getByText("7001 · Current")).toBeTruthy();
    expect(screen.getByText("05/11/2026")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(posts(requests)).toHaveLength(0);
    expect((screen.getByRole("checkbox", { name: "Select unit 1" }) as HTMLInputElement).checked).toBe(true);
  });

  it("sends the agreed body: yyyy-MM-dd, opaque ids, a UUID", async () => {
    const { requests } = server({ payment: () => ({ json: { isStarted: false, isUncertain: false, messages: [] } }) });
    renderPage();
    fireEvent.click(await openConfirmation());
    await screen.findByText("Nothing was paid.");
    const [body] = await postedBodies(requests);
    expect(body).toEqual({
      correlationId: expect.stringMatching(UUID),
      nettingAccountId: "AQ/acc+1",
      stockIds: ["AQ/unit+1"],
      amount: 100.5,
      endReasonId: 9,
      valueDate: "2026-11-05",
      allowPartialPayment: false,
    });
  });

  it("a double click sends one payment", async () => {
    const { requests } = server({ payment: () => ({ ...started, delay: 20 }), status: () => ({ json: { isFinished: false } }) });
    renderPage();
    const confirm = await openConfirmation();
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await screen.findByText(/Processing the payment/);
    expect(posts(requests)).toHaveLength(1);
  });

  it("the button is disabled while the request runs", async () => {
    server({ payment: () => ({ ...started, delay: 50 }), status: () => ({ json: { isFinished: false } }) });
    renderPage();
    fireEvent.click(await openConfirmation());
    const sending = await screen.findByRole("button", { name: /Sending/ });
    expect((sending as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: /Confirm payment/ })).toBeNull();
  });
});

describe("correlationId", () => {
  const failsThen = (first: () => MockAnswer, then: MockAnswer) => {
    let calls = 0;
    return () => (calls++ === 0 ? first() : then);
  };
  const refused = { json: { isStarted: false, isUncertain: false, messages: [MESSAGE] } };
  const networkError = (): MockAnswer => {
    throw new TypeError("Failed to fetch");
  };

  it("no response: the retry repeats the SAME id and body", async () => {
    const { requests } = server({ payment: failsThen(networkError, refused) });
    renderPage();
    fireEvent.click(await openConfirmation());
    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
    await screen.findByText("Nothing was paid.");
    const [first, second] = await postedBodies(requests);
    expect(second).toEqual(first);
  });

  it("502: the outcome isn't known, so the SAME id", async () => {
    const { requests } = server({ payment: failsThen(() => ({ status: 502, json: { status: 502, code: "backend_unavailable" } }), refused) });
    renderPage();
    fireEvent.click(await openConfirmation());
    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
    await screen.findByText("Nothing was paid.");
    const [first, second] = await postedBodies(requests);
    expect(second.correlationId).toBe(first.correlationId);
  });

  it("no response, then the page is reloaded: still the SAME id, and it can't start another payment", async () => {
    const { requests } = server({ payment: failsThen(networkError, refused) });
    renderPage();
    fireEvent.click(await openConfirmation());
    await screen.findByRole("button", { name: "Try again" });
    cleanup();
    renderPage();
    expect(screen.queryByRole("button", { name: /Review payment/ })).toBeNull();
    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
    await screen.findByText("Nothing was paid.");
    const [first, second] = await postedBodies(requests);
    expect(second.correlationId).toBe(first.correlationId);
  });

  it("closed while sending, then reloaded: treated as no answer, with the SAME id", async () => {
    let answer: MockAnswer = { ...refused, delay: 10_000 };
    const { requests } = server({ payment: () => answer });
    renderPage();
    fireEvent.click(await openConfirmation());
    await screen.findByRole("button", { name: /Sending/ });
    cleanup();
    answer = refused;
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
    await waitFor(() => expect(posts(requests)).toHaveLength(2));
    const [first, second] = await postedBodies(requests);
    expect(second.correlationId).toBe(first.correlationId);
  });

  const paidAgain = async (requests: Request[]) => {
    await screen.findByText("Nothing was paid.");
    fireEvent.click(screen.getByRole("button", { name: /Review payment/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Confirm payment/ }));
    await waitFor(() => expect(posts(requests)).toHaveLength(2));
    const [first, second] = await postedBodies(requests);
    expect(second.correlationId).not.toBe(first.correlationId);
  };

  it("isStarted: false: a NEW id next time", async () => {
    const { requests } = server({ payment: () => refused });
    renderPage();
    fireEvent.click(await openConfirmation());
    await screen.findByText(MESSAGE.text);
    await paidAgain(requests);
  });

  it("a batch that failed: a NEW id next time", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let calls = 0;
    const { requests } = server({
      payment: () => (calls++ === 0 ? started : refused),
      status: () => ({ json: { isFinished: true, isSuccessful: false, messages: [MESSAGE] } }),
    });
    renderPage();
    fireEvent.click(await openConfirmation());
    await screen.findByText(/Processing the payment/);
    await act(() => vi.advanceTimersByTimeAsync(2_000));
    await paidAgain(requests);
  });

  it.each([
    ["stock_not_active", "One of the stocks is no longer active. Nothing was paid."],
    ["stock_payment_exceeds_due", "The amount is above what the stocks still owe. Nothing was paid."],
    ["stock_payment_not_configured", "Payments aren't set up for this agreement. Contact the back office."],
    ["validation_failed", "Some of the values aren't valid. Check the form and try again."],
  ])("400 %s: its message, and a NEW id next time", async (code, message) => {
    const { requests } = server({ payment: () => ({ status: 400, json: { title: "server title", status: 400, code } }) });
    renderPage();
    fireEvent.click(await openConfirmation());
    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.queryByText("server title")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Review payment/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Confirm payment/ }));
    await waitFor(() => expect(posts(requests)).toHaveLength(2));
    const [first, second] = await postedBodies(requests);
    expect(second.correlationId).not.toBe(first.correlationId);
  });

  it("404: not available to this dealer", async () => {
    server({ payment: () => ({ status: 404, json: { status: 404, code: "not_found" } }) });
    renderPage();
    fireEvent.click(await openConfirmation());
    expect(await screen.findByText(/isn't available/)).toBeTruthy();
  });
});

describe("isUncertain", () => {
  const uncertain = { json: { isStarted: false, isUncertain: true, paymentId: null, messages: [{ severity: "Warning", text: "Sem confirmação." }] } };

  it("offers no retry, sends the user to the back office and shows the messages", async () => {
    const { requests } = server({ payment: () => uncertain });
    renderPage();
    fireEvent.click(await openConfirmation());
    expect(await screen.findByText(/Check with the back office before paying again/)).toBeTruthy();
    expect(screen.getByText("Sem confirmação.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Try again/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Confirm payment/ })).toBeNull();
    expect(posts(requests)).toHaveLength(1);
  });

  it("is still there after a reload, until the user has checked", async () => {
    server({ payment: () => uncertain });
    renderPage();
    fireEvent.click(await openConfirmation());
    await screen.findByText(/Check with the back office/);
    cleanup();
    renderPage();
    expect(await screen.findByText(/Check with the back office/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "I've checked with the back office" }));
    expect((await screen.findByRole("checkbox", { name: "Select unit 1" }) as HTMLInputElement).checked).toBe(false);
  });
});

describe("following the payment", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));

  const startPayment = async (setup: Server) => {
    const mock = server({ payment: () => started, ...setup });
    renderPage();
    fireEvent.click(await openConfirmation());
    await screen.findByText(/Processing the payment/);
    return mock;
  };
  const tick = (ms = 2_000) => act(() => vi.advanceTimersByTimeAsync(ms));
  const statusReads = (requests: Request[]) => requests.filter((r) => new URL(r.url).pathname.startsWith("/api/stock/payments/"));
  const success = () => ({ json: { isFinished: true, isSuccessful: true, stocksPaid: null, stocksInError: null, messages: [] } });

  it("polls every 2 seconds on the encoded id, while isFinished is false (whatever isSuccessful says)", async () => {
    const { requests } = await startPayment({ status: () => ({ json: { isFinished: false, isSuccessful: false } }) });
    expect(statusReads(requests)).toHaveLength(0);
    await tick();
    expect(statusReads(requests)).toHaveLength(1);
    expect(new URL(statusReads(requests)[0].url).pathname).toBe("/api/stock/payments/AQ%2Fpay%2B1");
    await tick();
    expect(statusReads(requests)).toHaveLength(2);
    expect(screen.queryByText("Nothing was paid.")).toBeNull();
    expect(screen.getByText(/Processing the payment/)).toBeTruthy();
  });

  it("after 2 minutes says it is still processing, not that it failed, and can't pay again", async () => {
    const { requests } = await startPayment({ status: () => ({ json: { isFinished: false } }) });
    await tick(120_000);
    expect(await screen.findByText("Still processing")).toBeTruthy();
    expect(screen.queryByText(/Nothing was paid/)).toBeNull();
    expect(screen.queryByRole("button", { name: /Try again|Confirm payment/ })).toBeNull();
    const reads = statusReads(requests).length;
    expect(reads).toBeLessThanOrEqual(60);
    await tick(10_000);
    expect(statusReads(requests)).toHaveLength(reads);
    fireEvent.click(screen.getByRole("button", { name: "Check again" }));
    await tick();
    expect(statusReads(requests).length).toBeGreaterThan(reads);
  });

  it("a status read that fails doesn't fail the payment", async () => {
    let calls = 0;
    await startPayment({ status: () => (calls++ === 0 ? { status: 502, json: { code: "backend_unavailable" } } : success()) });
    await tick();
    expect(screen.queryByText(/Nothing was paid/)).toBeNull();
    await tick();
    expect(await screen.findByText("Processed, no change yet")).toBeTruthy();
  });

  it("isSuccessful: false shows the messages: nothing was paid", async () => {
    await startPayment({ status: () => ({ json: { isFinished: true, isSuccessful: false, messages: [MESSAGE] } }) });
    await tick();
    expect(await screen.findByText("Nothing was paid.")).toBeTruthy();
    expect(screen.getByText(MESSAGE.text)).toBeTruthy();
  });

  it("isSuccessful: true, the unit changed state: paid", async () => {
    await startPayment({ status: success, unit: () => ({ json: unit(1, "Terminate", 100.5) }) });
    await tick();
    expect(await screen.findByRole("heading", { name: "Paid" })).toBeTruthy();
    expect(screen.getByText("Terminated")).toBeTruthy();
  });

  it("isSuccessful: true, the balance changed: paid, with what the account says", async () => {
    let reads = 0;
    await startPayment({
      status: success,
      // Read when the form loads and when the confirmation opens (the baseline), then afterwards
      accounts: () => ({ json: [{ ...ACCOUNT, totalCapital: reads++ < 2 ? 5000 : 4899.5 }] }),
    });
    await tick();
    expect(await screen.findByRole("heading", { name: "Paid" })).toBeTruthy();
    expect(screen.getByText("€5,000.00")).toBeTruthy();
    expect(screen.getByText("€4,899.50")).toBeTruthy();
  });

  it("isSuccessful: true with nothing changed is NOT paid", async () => {
    await startPayment({ status: success });
    await tick();
    expect(await screen.findByRole("heading", { name: "Processed, no change yet" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Paid" })).toBeNull();
    expect(screen.getByRole("alert").textContent).toMatch(/Please check/);
  });

  it("stocksPaid doesn't decide anything: a non-null count without a change isn't paid", async () => {
    await startPayment({ status: () => ({ json: { isFinished: true, isSuccessful: true, stocksPaid: 1, stocksInError: 0 } }) });
    await tick();
    expect(await screen.findByRole("heading", { name: "Processed, no change yet" })).toBeTruthy();
  });

  it("isSuccessful: true but the unit couldn't be reloaded is NOT paid", async () => {
    await startPayment({ status: success, unit: () => ({ status: 502, json: { code: "backend_unavailable" } }) });
    await tick();
    expect(await screen.findByRole("heading", { name: /couldn't be read/ })).toBeTruthy();
    const table = screen.getByRole("table");
    expect(within(table).getAllByText("unavailable").length).toBeGreaterThan(0);
  });

  it("'no change yet' can be checked again, and then it says paid", async () => {
    let state = "Activate";
    await startPayment({ status: success, unit: () => ({ json: unit(1, state, 100.5) }) });
    await tick();
    await screen.findByRole("heading", { name: "Processed, no change yet" });
    state = "Sold";
    fireEvent.click(screen.getByRole("button", { name: "Check again" }));
    expect(await screen.findByRole("heading", { name: "Paid" })).toBeTruthy();
  });

  it("a reload while it is processing keeps following the same payment", async () => {
    const { requests } = await startPayment({ status: () => ({ json: { isFinished: false } }) });
    cleanup();
    renderPage();
    expect(screen.getByText(/Processing the payment/)).toBeTruthy();
    await tick();
    expect(statusReads(requests).length).toBeGreaterThan(0);
    expect(posts(requests)).toHaveLength(1);
  });
});
