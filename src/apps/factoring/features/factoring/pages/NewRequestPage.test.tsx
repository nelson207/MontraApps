// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockFetch, renderWithApi, type MockAnswer } from "@platform/features/news/testing/renderWithApi";
import NewRequestPage from "./NewRequestPage";

// The real page and API client against a mocked server: what is asserted is what would be sent.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const contract = (extra: Record<string, unknown>) => ({
  id: "AQ/f+1",
  number: 100053964,
  kind: "Factoring",
  financialInstitution: "Banco Um",
  currencyId: "EUR",
  withoutRecourse: false,
  availableAmount: 1000,
  totalAmount: 5000,
  withoutRecourseAvailableAmount: null,
  withoutRecourseTotalAmount: null,
  advancePercentage: null,
  maxTermDays: null,
  rate: null,
  canSubmit: true,
  canAdvance: true,
  hasAdvanceInProgress: false,
  ...extra,
});
const FACTORING = contract({});
const CONFIRMING = contract({ id: "AQ/c+1", number: 100053963, kind: "Confirming", financialInstitution: "Banco Dois" });

const party = (n: number, kind: string, name: string | null = `Company ${n}`) => ({ interventionId: `AQ/i+${n}`, entityId: `AQ/e+${n}`, name, taxNumber: `50000000${n}`, externalNumber: null, kind, availableAmount: null, totalAmount: null, withoutRecourseAvailableAmount: null, withoutRecourseTotalAmount: null });
const PARTIES = [party(1, "Debtor"), party(2, "Debtor"), party(3, "Supplier"), party(4, "Supplier")];

const submitted = { json: { isSubmitted: true, isUncertain: false, cessionId: "AQ/x+1", cessionNumber: 7100, messages: [] } };
const refused = { json: { isSubmitted: false, isUncertain: false, cessionId: null, cessionNumber: null, messages: [{ severity: "Error", text: "Invoice number already used this year" }] } };

type Server = {
  contracts?: unknown[] | (() => MockAnswer);
  parties?: unknown[];
  post?: () => MockAnswer;
  add?: () => MockAnswer;
  cession?: () => MockAnswer;
};

function server({ contracts = [FACTORING, CONFIRMING], parties = PARTIES, post = () => submitted, add, cession }: Server = {}) {
  return mockFetch((url, request) => {
    const path = url.pathname;
    if (path === "/api/factoring/contracts") {
      if (typeof contracts === "function") return contracts();
      return { json: { items: contracts, page: 1, pageSize: 100, totalCount: contracts.length } };
    }
    if (path.endsWith("/counterparties") && request.method === "GET") return { json: parties };
    if (path.endsWith("/counterparties") && request.method === "POST") return add?.();
    if (path.endsWith("/cessions") && request.method === "POST") return post();
    if (path.startsWith("/api/factoring/cessions/")) return cession?.();
    return undefined;
  });
}

const posts = (requests: Request[]) => requests.filter((r) => r.method === "POST" && new URL(r.url).pathname.endsWith("/cessions"));
const bodies = (requests: Request[]) => Promise.all(posts(requests).map((r) => r.clone().json()));

const renderPage = () =>
  renderWithApi(
    <Routes>
      <Route path="/factoring/new" element={<NewRequestPage />} />
    </Routes>,
    { route: "/factoring/new" },
  );

const chooseCard = async (name: RegExp) => fireEvent.click(await screen.findByRole("radio", { name }));
const next = () => fireEvent.click(screen.getByRole("button", { name: /^Next/ }));
const submitButton = () => screen.getByRole("button", { name: /Submit .*invoice/ });

async function pickFromDialog(fieldId: string, name: string) {
  fireEvent.click(document.getElementById(fieldId) as HTMLElement);
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(await within(dialog).findByRole("button", { name: new RegExp(name) }));
}

function fillInvoice(index: number, { number = "FT 1", issue = "01/11/2026", due = "01/12/2026", amount = "100" } = {}) {
  const field = (name: string) => document.getElementById(`document-${index}-${name}`) as HTMLInputElement;
  fireEvent.change(field("number"), { target: { value: number } });
  fireEvent.change(field("issue"), { target: { value: issue } });
  fireEvent.change(field("due"), { target: { value: due } });
  fireEvent.change(field("amount"), { target: { value: amount } });
}

/** Up to a complete factoring invoice, ready to submit */
async function readyFactoring(values = {}) {
  await chooseCard(/Banco Um/);
  await pickFromDialog("document-0-debtor", "Company 1");
  fillInvoice(0, values);
}

beforeEach(() => sessionStorage.clear());

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the agreement cards", () => {
  it("shows what is available of the total, with no chips while they are null", async () => {
    server();
    renderPage();
    const card = (await screen.findByRole("radio", { name: /Banco Um/ })).closest("div") as HTMLElement;
    expect(card.textContent).toContain("available");
    expect(card.textContent).toContain("of €5,000.00");
    expect(card.textContent).not.toContain("% advance");
    expect(card.textContent).not.toContain("days");
    expect(within(card).getByRole("progressbar").getAttribute("aria-valuenow")).toBe("20");
  });

  it("a missing amount is unavailable, not 0, and draws no bar", async () => {
    server({ contracts: [contract({ availableAmount: null, totalAmount: null }), CONFIRMING] });
    renderPage();
    const card = (await screen.findByRole("radio", { name: /Banco Um/ })).closest("div") as HTMLElement;
    expect(card.textContent).toContain("Available amount unavailable");
    expect(card.textContent).not.toContain("0.00");
    expect(within(card).queryByRole("progressbar")).toBeNull();
  });

  it("shows the chips, the without-recourse badge and sub-plafond when there are any", async () => {
    server({ contracts: [contract({ withoutRecourse: true, withoutRecourseAvailableAmount: 300, withoutRecourseTotalAmount: 600, advancePercentage: 80, maxTermDays: 90, rate: 4.25 }), CONFIRMING] });
    renderPage();
    const card = (await screen.findByRole("radio", { name: /Banco Um/ })).closest("div") as HTMLElement;
    expect(card.textContent).toContain("80% advance");
    expect(card.textContent).toContain("Up to 90 days");
    expect(card.textContent).toContain("4.25%");
    expect(card.textContent).toContain("Without recourse");
    expect(card.textContent).toContain("of €600.00");
    expect(within(card).getAllByRole("progressbar")).toHaveLength(2);
  });

  it("no sub-plafond on a confirming agreement", async () => {
    server({ contracts: [contract({ kind: "Confirming", withoutRecourseAvailableAmount: 300, withoutRecourseTotalAmount: 600 }), CONFIRMING] });
    renderPage();
    const card = (await screen.findByRole("radio", { name: /Banco Um/ })).closest("div") as HTMLElement;
    expect(card.textContent).not.toContain("€600.00");
  });

  it("canSubmit false disables the card, and the one left is chosen by default", async () => {
    server({ contracts: [contract({ canSubmit: false }), CONFIRMING] });
    renderPage();
    expect(((await screen.findByRole("radio", { name: /Banco Um/ })) as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText(/can't take new requests right now/)).toBeTruthy();
    await screen.findByRole("radio", { name: /Banco Dois/, checked: true });
    expect(screen.getByRole("button", { name: /^Next/ })).toBeTruthy();
  });

  it("loading, empty and error states", async () => {
    server({ contracts: [] });
    renderPage();
    expect(await screen.findByText(/no active factoring or confirming agreements/)).toBeTruthy();
    cleanup();
    server({ contracts: () => ({ status: 502, json: { title: "x", status: 502, code: "backend_unavailable" } }) });
    renderPage();
    expect(await screen.findByText("The service is temporarily unavailable. Please try again later.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });

  it("reads every page of the agreements", async () => {
    const first = Array.from({ length: 100 }, (_, i) => contract({ id: `AQ/p+${i}`, number: i, financialInstitution: `Banco ${i}`, canSubmit: false }));
    const { requests } = mockFetch((url) => {
      if (url.pathname !== "/api/factoring/contracts") return undefined;
      return url.searchParams.get("page") === "1"
        ? { json: { items: first, page: 1, pageSize: 100, totalCount: 101 } }
        : { json: { items: [contract({ number: 101, financialInstitution: "Banco Last" })], page: 2, pageSize: 100, totalCount: 101 } };
    });
    renderPage();
    expect(await screen.findByRole("radio", { name: /Banco Last/ })).toBeTruthy();
    expect(requests.filter((r) => new URL(r.url).pathname === "/api/factoring/contracts")).toHaveLength(2);
  });
});

describe("moving through the steps", () => {
  it("choosing a factoring agreement moves on to the invoices, and Back brings the card back", async () => {
    server();
    renderPage();
    await chooseCard(/Banco Um/);
    await waitFor(() => expect(document.getElementById("document-0-number")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByRole("radio", { name: /Banco Um/, checked: true })).toBeTruthy();
  });

  it("choosing the same card again moves on too", async () => {
    server();
    renderPage();
    await chooseCard(/Banco Um/);
    fireEvent.click(await screen.findByRole("button", { name: "Back" }));
    await chooseCard(/Banco Um/);
    await waitFor(() => expect(document.getElementById("document-0-number")).toBeTruthy());
  });

  it("a card under confirming moves on to the supplier, and choosing one to the invoices", async () => {
    server();
    renderPage();
    await chooseCard(/Banco Dois/);
    await waitFor(() => expect(document.getElementById("factoring-supplier")).toBeTruthy());
    expect(document.getElementById("document-0-number")).toBeNull();
    await pickFromDialog("factoring-supplier", "Company 3");
    await waitFor(() => expect(document.getElementById("document-0-number")).toBeTruthy());
  });

  it("one supplier: its step is left out, and it can still be changed from the invoices", async () => {
    server({ parties: [party(1, "Debtor"), party(3, "Supplier")] });
    renderPage();
    await chooseCard(/Banco Dois/);
    await waitFor(() => expect(document.getElementById("document-0-number")).toBeTruthy());
    expect(screen.queryByRole("button", { name: /^2 Supplier/ })).toBeNull();
    await waitFor(() => expect(document.getElementById("factoring-supplier")?.textContent).toContain("Company 3"));
  });

  it("one agreement: its step is left out, and there is no way back to it", async () => {
    server({ contracts: [FACTORING] });
    renderPage();
    await waitFor(() => expect(document.getElementById("document-0-number")).toBeTruthy());
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Change the agreement/ })).toBeNull();
    expect(screen.getByText(/Banco Um/)).toBeTruthy();
  });

  it("Next is never turned off for a missing choice: it says what is missing", async () => {
    server();
    renderPage();
    await screen.findByRole("radio", { name: /Banco Um/ });
    const button = screen.getByRole("button", { name: /^Next/ }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    expect(await screen.findByText("Select an agreement.")).toBeTruthy();
  });

  it("the actions are in the fixed bar, with no Back on the first step", async () => {
    server();
    renderPage();
    await screen.findByRole("radio", { name: /Banco Um/ });
    const bar = document.querySelector(".app-wizard-bar") as HTMLElement;
    expect(within(bar).getByRole("button", { name: /^Next/ })).toBeTruthy();
    expect(within(bar).queryByRole("button", { name: "Back" })).toBeNull();
  });
});

describe("validation before sending", () => {
  it("nothing is sent while the form is incomplete", async () => {
    const { requests } = server();
    renderPage();
    await chooseCard(/Banco Um/);
    fireEvent.click(await screen.findByRole("button", { name: /Submit invoice/ }));
    expect(await screen.findByText("Enter the invoice number.")).toBeTruthy();
    expect(screen.getByText("Enter the issue date.")).toBeTruthy();
    expect(screen.getByText("Enter the due date.")).toBeTruthy();
    expect(screen.getByText("Enter an amount above zero.")).toBeTruthy();
    expect(screen.getByText("Select the debtor.")).toBeTruthy();
    expect(posts(requests)).toHaveLength(0);
  });

  it("confirming asks for the supplier on its step", async () => {
    server();
    renderPage();
    await chooseCard(/Banco Dois/);
    await waitFor(() => expect(document.getElementById("factoring-supplier")).toBeTruthy());
    expect(screen.queryByText("Select the supplier.")).toBeNull();
    next();
    expect(await screen.findByText("Select the supplier.")).toBeTruthy();
    expect(document.getElementById("document-0-number")).toBeNull();
  });

  it("removing every invoice asks for at least one", async () => {
    const { requests } = server();
    renderPage();
    await chooseCard(/Banco Um/);
    fireEvent.click(await screen.findByRole("button", { name: "Remove invoice 1" }));
    fireEvent.click(screen.getByRole("button", { name: /Submit 0 invoices/ }));
    expect(await screen.findByText("Add at least one invoice.")).toBeTruthy();
    expect(posts(requests)).toHaveLength(0);
  });
});

describe("the request sent", () => {
  it("factoring: a UUID, dates as yyyy-MM-dd, the debtor per invoice, the encoded path", async () => {
    const { requests } = server();
    renderPage();
    await readyFactoring({ number: "  FT 1  " });
    fireEvent.click(submitButton());
    await screen.findByText("Request 7100 submitted");
    expect(new URL(posts(requests)[0].url).pathname).toBe(`/api/factoring/contracts/${encodeURIComponent("AQ/f+1")}/cessions`);
    const [body] = await bodies(requests);
    expect(body.correlationId).toMatch(UUID);
    expect(body).toEqual({
      correlationId: body.correlationId,
      documents: [{ debtorInterventionId: "AQ/i+1", invoiceNumber: "FT 1", issueDate: "2026-11-01", dueDate: "2026-12-01", amount: 100 }],
    });
  });

  it("confirming: the supplier once, no debtor, and only suppliers on offer", async () => {
    const { requests } = server();
    renderPage();
    await chooseCard(/Banco Dois/);
    await waitFor(() => expect(document.getElementById("factoring-supplier")).toBeTruthy());
    fireEvent.click(document.getElementById("factoring-supplier") as HTMLElement);
    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByRole("button", { name: /Company 3/ });
    expect(within(dialog).queryByRole("button", { name: /Company 1/ })).toBeNull();
    fireEvent.click(within(dialog).getByRole("button", { name: /Company 3/ }));
    await screen.findByText(/every invoice is from Company 3/);
    expect(document.getElementById("document-0-debtor")).toBeNull();
    fillInvoice(0);
    fireEvent.click(submitButton());
    await screen.findByText("Request 7100 submitted");
    const [body] = await bodies(requests);
    expect(body.supplierInterventionId).toBe("AQ/i+3");
    expect(body.documents[0]).toEqual({ invoiceNumber: "FT 1", issueDate: "2026-11-01", dueDate: "2026-12-01", amount: 100 });
  });

  it("changing the agreement drops what belonged to the old one", async () => {
    const { requests } = server();
    renderPage();
    await chooseCard(/Banco Dois/);
    await waitFor(() => expect(document.getElementById("factoring-supplier")).toBeTruthy());
    fireEvent.click(document.getElementById("factoring-supplier") as HTMLElement);
    fireEvent.click(await within(await screen.findByRole("dialog")).findByRole("button", { name: /Company 3/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Change the agreement/ }));
    await chooseCard(/Banco Um/);
    await pickFromDialog("document-0-debtor", "Company 1");
    fillInvoice(0);
    fireEvent.click(submitButton());
    await screen.findByText("Request 7100 submitted");
    expect((await bodies(requests))[0].supplierInterventionId).toBeUndefined();
  });

  it("one supplier is chosen by default", async () => {
    server({ parties: [party(1, "Debtor"), party(3, "Supplier")] });
    renderPage();
    await chooseCard(/Banco Dois/);
    await waitFor(() => expect(document.getElementById("factoring-supplier")?.textContent).toContain("Company 3"));
  });

  it("the totals hide the advance while the percentage is null, and show it when there is one", async () => {
    server();
    renderPage();
    await readyFactoring();
    const totals = screen.getByLabelText("Totals");
    expect(totals.textContent).toContain("Invoices1");
    expect(totals.textContent).toContain("Total€100.00");
    expect(totals.textContent).toContain("Available€1,000.00");
    expect(totals.textContent).not.toContain("Advance");
    cleanup();
    server({ contracts: [contract({ advancePercentage: 80 }), CONFIRMING] });
    renderPage();
    await readyFactoring();
    expect(screen.getByLabelText("Totals").textContent).toContain("Advance (80%)€80.00");
  });
});

describe("the double click", () => {
  it("two clicks in the same tick send one request, and the button is disabled while it runs", async () => {
    const { requests } = server({ post: () => ({ ...submitted, delay: 20 }) });
    renderPage();
    await readyFactoring();
    const button = submitButton();
    fireEvent.click(button);
    fireEvent.click(button);
    expect((button as HTMLButtonElement).disabled).toBe(true);
    await screen.findByText("Request 7100 submitted");
    expect(posts(requests)).toHaveLength(1);
  });
});

describe("the answers", () => {
  it("isSubmitted true confirms with the number and says it waits for approval", async () => {
    server();
    renderPage();
    await readyFactoring();
    fireEvent.click(submitButton());
    expect(await screen.findByText("Request 7100 submitted")).toBeTruthy();
    expect(screen.getByText(/waits for back-office approval/)).toBeTruthy();
  });

  it("no number yet: reads it from the cession, on the encoded id", async () => {
    const { requests } = server({
      post: () => ({ json: { isSubmitted: true, isUncertain: false, cessionId: "AQ/x+1", cessionNumber: null, messages: [] } }),
      cession: () => ({ json: { id: "AQ/x+1", number: 7222, documents: [] } }),
    });
    renderPage();
    await readyFactoring();
    fireEvent.click(submitButton());
    expect(await screen.findByText("Request 7222 submitted")).toBeTruthy();
    expect(requests.some((r) => new URL(r.url).pathname === `/api/factoring/cessions/${encodeURIComponent("AQ/x+1")}`)).toBe(true);
  });

  it("no number anywhere: still confirmed, without inventing one", async () => {
    server({
      post: () => ({ json: { isSubmitted: true, isUncertain: false, cessionId: "AQ/x+1", cessionNumber: null, messages: [] } }),
      cession: () => ({ status: 502, json: { status: 502 } }),
    });
    renderPage();
    await readyFactoring();
    fireEvent.click(submitButton());
    expect(await screen.findByText("Request submitted")).toBeTruthy();
  });

  it("isSubmitted false keeps the form and shows the messages; the next try has a NEW id", async () => {
    let call = 0;
    const { requests } = server({ post: () => (call++ === 0 ? refused : submitted) });
    renderPage();
    await readyFactoring();
    fireEvent.click(submitButton());
    expect(await screen.findByText("Invoice number already used this year")).toBeTruthy();
    expect(screen.getByText(/Nothing was saved/)).toBeTruthy();
    expect((document.getElementById("document-0-number") as HTMLInputElement).value).toBe("FT 1");
    fireEvent.click(submitButton());
    await screen.findByText("Request 7100 submitted");
    const [first, second] = await bodies(requests);
    expect(first.correlationId).toMatch(UUID);
    expect(second.correlationId).toMatch(UUID);
    expect(second.correlationId).not.toBe(first.correlationId);
  });

  it("isUncertain shows the messages, offers no retry and sends them to Documents", async () => {
    const { requests } = server({ post: () => ({ json: { isSubmitted: false, isUncertain: true, messages: [{ severity: "Warning", text: "It may exist" }] } }) });
    renderPage();
    await readyFactoring();
    fireEvent.click(submitButton());
    expect(await screen.findByText("It may exist")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Go to Documents" }).getAttribute("href")).toBe("/factoring/documents");
    expect(screen.queryByRole("button", { name: "Send again" })).toBeNull();
    expect(posts(requests)).toHaveLength(1);
  });

  it.each([
    [{ status: 400, json: { title: "x", status: 400, code: "validation_failed" } }, /Some of the values aren't valid/],
    [{ status: 400, json: { title: "x", status: 400, code: "factoring_not_configured" } }, /isn't set up for this yet/],
    [{ status: 404, json: { title: "x", status: 404 } }, /no longer available/],
  ])("%j keeps the form, by its code, and the next try has a NEW id", async (answer, message) => {
    let call = 0;
    const { requests } = server({ post: () => (call++ === 0 ? answer : submitted) });
    renderPage();
    await readyFactoring();
    fireEvent.click(submitButton());
    expect(await screen.findByText(message)).toBeTruthy();
    fireEvent.click(submitButton());
    await screen.findByText("Request 7100 submitted");
    const [first, second] = await bodies(requests);
    expect(second.correlationId).not.toBe(first.correlationId);
  });
});

describe("no answer", () => {
  const networkDown = () => {
    throw new TypeError("Failed to fetch");
  };

  it("a network error repeats the SAME id and body", async () => {
    let call = 0;
    const { requests } = server({
      post: () => {
        if (call++ === 0) networkDown();
        return submitted;
      },
    });
    renderPage();
    await readyFactoring();
    fireEvent.click(submitButton());
    fireEvent.click(await screen.findByRole("button", { name: "Send again" }));
    await screen.findByText("Request 7100 submitted");
    const [first, second] = await bodies(requests);
    expect(second).toEqual(first);
  });

  it("a 502 is no definite answer: the same id too", async () => {
    let call = 0;
    const { requests } = server({ post: () => (call++ === 0 ? { status: 502, json: { status: 502, code: "backend_unavailable" } } : submitted) });
    renderPage();
    await readyFactoring();
    fireEvent.click(submitButton());
    fireEvent.click(await screen.findByRole("button", { name: "Send again" }));
    await screen.findByText("Request 7100 submitted");
    const [first, second] = await bodies(requests);
    expect(second.correlationId).toBe(first.correlationId);
  });

  it("a reload after no answer resumes the attempt, with the same id", async () => {
    const { requests } = server({ post: networkDown });
    renderPage();
    await readyFactoring();
    fireEvent.click(submitButton());
    await screen.findByRole("button", { name: "Send again" });
    const [first] = await bodies(requests);
    cleanup();

    const again = server();
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Send again" }));
    await screen.findByText("Request 7100 submitted");
    const [second] = await bodies(again.requests);
    expect(second.correlationId).toBe(first.correlationId);
  });

  it("after the outcome, a new request is a new attempt", async () => {
    const { requests } = server();
    renderPage();
    await readyFactoring();
    fireEvent.click(submitButton());
    fireEvent.click(await screen.findByRole("button", { name: /New request/ }));
    await readyFactoring();
    fireEvent.click(submitButton());
    await screen.findByText("Request 7100 submitted");
    const [first, second] = await bodies(requests);
    expect(second.correlationId).not.toBe(first.correlationId);
  });
});

describe("adding a counterparty", () => {
  const searchNobody = async (taxNumber = "999") => {
    await chooseCard(/Banco Um/);
    fireEvent.click(document.getElementById("document-0-debtor") as HTMLElement);
    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByRole("button", { name: /Company 1/ });
    fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: taxNumber } });
    return dialog;
  };
  const addButton = () => screen.getByRole("button", { name: "Add to the agreement" }) as HTMLButtonElement;

  it("is only offered when the search finds nobody, filling in the tax number", async () => {
    server();
    renderPage();
    await chooseCard(/Banco Um/);
    fireEvent.click(document.getElementById("document-0-debtor") as HTMLElement);
    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByRole("button", { name: /Company 1/ });
    expect(screen.queryByRole("button", { name: "Add to the agreement" })).toBeNull();
    fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: "510" } });
    expect((screen.getByLabelText(/by its tax number/) as HTMLInputElement).value).toBe("510");
  });

  it("isAdded true says it waits for activation, shows the tax number, and can't be sent again", async () => {
    const { requests } = server({ add: () => ({ json: { isAdded: true, isUncertain: false, counterparty: { taxNumber: "999", name: null, entityId: null }, messages: [] } }) });
    renderPage();
    await searchNobody();
    fireEvent.click(addButton());
    expect(await screen.findByText(/Tax number 999 was added\. It waits for back-office activation/)).toBeTruthy();
    expect(addButton().disabled).toBe(true);
    const add = requests.find((r) => r.method === "POST" && r.url.endsWith("/counterparties")) as Request;
    expect(await add.clone().json()).toEqual({ taxNumber: "999" });
    expect(new URL(add.url).pathname).toBe(`/api/factoring/contracts/${encodeURIComponent("AQ/f+1")}/counterparties`);
  });

  describe("waiting for activation", () => {
    const waiting = { ...party(7, "Debtor", null), entityId: null, taxNumber: "207112690", state: "Pending" };
    const toInvoices = async () => {
      await chooseCard(/Banco Um/);
      await waitFor(() => expect(document.getElementById("document-0-debtor")).toBeTruthy());
    };
    const openDialog = async () => {
      await toInvoices();
      fireEvent.click(document.getElementById("document-0-debtor") as HTMLElement);
      return screen.findByRole("dialog");
    };

    it("is shown by tax number and can't be chosen", async () => {
      server({ parties: [party(1, "Debtor"), party(2, "Debtor"), waiting] });
      renderPage();
      const dialog = within(await openDialog());
      expect(await dialog.findByText("207112690")).toBeTruthy();
      expect(dialog.getByText(/Waiting for back-office activation/)).toBeTruthy();
      expect(dialog.queryByRole("button", { name: /207112690/ })).toBeNull();
    });

    it("searching for it finds it, and doesn't offer to add it again", async () => {
      server({ parties: [party(1, "Debtor"), party(2, "Debtor"), waiting] });
      renderPage();
      const dialog = within(await openDialog());
      fireEvent.change(dialog.getByRole("searchbox"), { target: { value: "207112690" } });
      expect(await dialog.findByText(/Waiting for back-office activation/)).toBeTruthy();
      expect(dialog.queryByRole("button", { name: "Add to the agreement" })).toBeNull();
    });

    it("doesn't count as an option: the one active debtor is still chosen by default", async () => {
      server({ parties: [party(1, "Debtor"), waiting] });
      renderPage();
      await toInvoices();
      await waitFor(() => expect(document.getElementById("document-0-debtor")?.textContent).toContain("Company 1"));
    });

    it("alone, it is never chosen by default", async () => {
      server({ parties: [waiting] });
      renderPage();
      await toInvoices();
      expect(document.getElementById("document-0-debtor")?.textContent).not.toContain("207112690");
    });
  });

  it("asks for the pending ones too, and adding reads the list again", async () => {
    const { requests } = server({ add: () => ({ json: { isAdded: true, isUncertain: false, counterparty: { taxNumber: "999" }, messages: [] } }) });
    renderPage();
    await searchNobody();
    const reads = () => requests.filter((r) => r.method === "GET" && new URL(r.url).pathname.endsWith("/counterparties"));
    expect(new URL(reads()[0].url).searchParams.get("includePending")).toBe("true");
    const before = reads().length;
    fireEvent.click(addButton());
    await screen.findByText(/Tax number 999 was added/);
    await waitFor(() => expect(reads().length).toBeGreaterThan(before));
  });

  it("isAdded false shows the messages and can be tried again", async () => {
    server({ add: () => ({ json: { isAdded: false, isUncertain: false, messages: [{ severity: "Error", text: "No entity with this tax number" }] } }) });
    renderPage();
    await searchNobody();
    fireEvent.click(addButton());
    expect(await screen.findByText("No entity with this tax number")).toBeTruthy();
    expect(addButton().disabled).toBe(false);
  });

  it("isUncertain shows the messages and offers no retry, also after reopening the dialog", async () => {
    server({ add: () => ({ json: { isAdded: false, isUncertain: true, messages: [{ severity: "Warning", text: "Unknown outcome" }] } }) });
    renderPage();
    const dialog = await searchNobody();
    fireEvent.click(addButton());
    expect(await screen.findByText("Unknown outcome")).toBeTruthy();
    expect(screen.getByText(/may have been saved/)).toBeTruthy();
    expect(addButton().disabled).toBe(true);
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    fireEvent.click(document.getElementById("document-0-debtor") as HTMLElement);
    fireEvent.change(within(await screen.findByRole("dialog")).getByRole("searchbox"), { target: { value: "999" } });
    expect(addButton().disabled).toBe(true);
  });

  it("429 asks them to wait", async () => {
    server({ add: () => ({ status: 429, json: { status: 429 } }) });
    renderPage();
    await searchNobody();
    fireEvent.click(addButton());
    expect(await screen.findByText(/Too many tries/)).toBeTruthy();
    expect(addButton().disabled).toBe(false);
  });

  it("a debtor's own plafonds are shown when there are any, and a null name falls back to the tax number", async () => {
    server({ parties: [{ ...party(1, "Debtor"), availableAmount: 800, totalAmount: 1500, withoutRecourseAvailableAmount: 100, withoutRecourseTotalAmount: 200 }, party(2, "Debtor", null)] });
    renderPage();
    await chooseCard(/Banco Um/);
    fireEvent.click(document.getElementById("document-0-debtor") as HTMLElement);
    const dialog = await screen.findByRole("dialog");
    expect((await within(dialog).findByRole("button", { name: /Company 1/ })).textContent).toContain("800.00 available of 1,500.00");
    expect(within(dialog).getByRole("button", { name: /Company 1/ }).textContent).toContain("Without recourse: 100.00 available of 200.00");
    expect(within(dialog).getByRole("button", { name: /500000002/ })).toBeTruthy();
  });
});
