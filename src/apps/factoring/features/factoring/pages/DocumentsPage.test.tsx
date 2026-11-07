// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockFetch, renderWithApi, type MockAnswer } from "@platform/features/news/testing/renderWithApi";
import DocumentsPage, { SEARCH_DEBOUNCE_MS } from "./DocumentsPage";

const document1 = {
  id: "AQ/d+1",
  invoiceNumber: "FT 2026/1",
  cessionId: "AQ/x+1",
  cessionNumber: 7001,
  counterparty: "Oficina Central",
  taxNumber: "500100200",
  contractId: "AQ/c+1",
  contractNumber: 100053964,
  kind: "Factoring",
  financialInstitution: "Banco Um",
  currencyId: "EUR",
  issueDate: "2026-11-01",
  dueDate: "2026-12-01",
  amount: 1200.5,
  amountNotPaid: 1200.5,
  advancedAmount: null,
  status: "Attention",
  stateName: "Em análise",
};

const page = (items: unknown[], extra = {}) => ({ json: { items, page: 1, pageSize: 10, totalCount: items.length, outstandingAmounts: [], ...extra } });

function server(answer: (url: URL) => MockAnswer = () => page([document1], { outstandingAmounts: [{ currencyId: "EUR", amount: 1200.5 }] })) {
  return mockFetch((url) => (url.pathname === "/api/factoring/documents" ? answer(url) : undefined));
}

const reads = (requests: Request[]) => requests.map((r) => new URL(r.url).searchParams);

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("the documents", () => {
  it("maps the columns; Attention and its Accipiens state are shown", async () => {
    server();
    renderWithApi(<DocumentsPage />);
    const row = (await screen.findByText("FT 2026/1")).closest("tr") as HTMLElement;
    expect(row.textContent).toContain("Request 7001");
    expect(row.textContent).toContain("Oficina Central");
    expect(row.textContent).toContain("Tax no. 500100200");
    expect(row.textContent).toContain("Factoring");
    expect(row.textContent).toContain("Banco Um · 100053964");
    expect(row.textContent).toContain("€1,200.50");
    expect(row.textContent).toContain("Attention");
    expect(row.textContent).toContain("Em análise");
  });

  it("a row of nulls shows dashes and hides what isn't there, never 0", async () => {
    server(() => page([{ id: "AQ/d+2", kind: "Confirming", status: "Closed", invoiceNumber: null, cessionNumber: null, counterparty: null, taxNumber: null, issueDate: null, dueDate: null, amount: null, stateName: null }]));
    renderWithApi(<DocumentsPage />);
    const row = (await screen.findByText("Closed", { selector: ".badge" })).closest("tr") as HTMLElement;
    expect(row.textContent).not.toContain("Request");
    expect(row.textContent).not.toContain("Tax no.");
    expect(row.textContent).not.toMatch(/0\.00|Invalid/);
    expect(row.textContent).toContain("—");
  });

  it("offers all seven statuses, Attention and Closed among them", async () => {
    server();
    renderWithApi(<DocumentsPage />);
    await screen.findByText("FT 2026/1");
    const options = [...(document.getElementById("documents-status") as HTMLSelectElement).options].map((o) => o.value);
    expect(options).toEqual(["", "Submitted", "Approved", "Financed", "Paid", "Overdue", "Attention", "Closed"]);
  });

  it("the footer uses the API's totals: one outstanding per currency", async () => {
    server(() => page([document1], { totalCount: 57, outstandingAmounts: [{ currencyId: "EUR", amount: 1000 }, { currencyId: "USD", amount: 250.5 }] }));
    renderWithApi(<DocumentsPage />);
    expect(await screen.findByText("57 invoices", { exact: false })).toBeTruthy();
    expect(screen.getByText("€1,000.00 outstanding")).toBeTruthy();
    expect(screen.getByText("$250.50 outstanding")).toBeTruthy();
  });

  it("filters go to the API as they are, and a new filter goes back to page 1", async () => {
    const { requests } = server(() => page([document1], { totalCount: 25 }));
    renderWithApi(<DocumentsPage />);
    await screen.findByText("FT 2026/1");
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    await waitFor(() => expect(reads(requests).at(-1)?.get("page")).toBe("2"));
    fireEvent.change(document.getElementById("documents-status") as HTMLElement, { target: { value: "Closed" } });
    fireEvent.change(document.getElementById("documents-kind") as HTMLElement, { target: { value: "Confirming" } });
    await waitFor(() => {
      const last = reads(requests).at(-1);
      expect(last?.get("status")).toBe("Closed");
      expect(last?.get("kind")).toBe("Confirming");
      expect(last?.get("page")).toBe("1");
      expect(last?.get("pageSize")).toBe("10");
    });
  });

  it("debounces the search: one read for the whole word, none on the way", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { requests } = server();
    renderWithApi(<DocumentsPage />);
    await screen.findByText("FT 2026/1");
    const before = requests.length;
    const input = document.getElementById("documents-search") as HTMLElement;
    for (const value of ["o", "of", "ofi"]) {
      fireEvent.change(input, { target: { value } });
      await act(() => vi.advanceTimersByTimeAsync(100));
    }
    expect(requests.length).toBe(before);
    await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS));
    await waitFor(() => expect(requests.length).toBe(before + 1));
    expect(reads(requests).at(-1)?.get("search")).toBe("ofi");
  });

  it("loading, empty, filtered empty and error states", async () => {
    server(() => ({ ...page([]), delay: 20 }));
    renderWithApi(<DocumentsPage />);
    expect(screen.getByText(/This can take a moment/)).toBeTruthy();
    expect(await screen.findByText(/No documents yet/)).toBeTruthy();
    fireEvent.change(document.getElementById("documents-status") as HTMLElement, { target: { value: "Paid" } });
    expect(await screen.findByText("No documents match these filters.")).toBeTruthy();
    cleanup();

    server(() => ({ status: 502, json: { status: 502, code: "backend_unavailable" } }));
    renderWithApi(<DocumentsPage />);
    expect(await screen.findByText("The service is temporarily unavailable. Please try again later.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });
});
