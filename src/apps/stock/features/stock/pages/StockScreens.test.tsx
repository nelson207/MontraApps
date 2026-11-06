// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeStore, mockFetch, renderWithApi } from "@platform/features/news/testing/renderWithApi";
import AgreementDetailPage from "./AgreementDetailPage";
import AgreementsPage from "./AgreementsPage";
import StockUnitDetailPage from "./StockUnitDetailPage";
import StockUnitsPage from "./StockUnitsPage";

const contract = (n: number, extra: object = {}) => ({
  id: `AQ/c+${n}`,
  number: 50000 + n,
  description: `Financing ${n}`,
  companyId: 1,
  companyAbbreviation: "Montra",
  currencyId: "USD",
  suppliers: [{ interventionId: "s", entityId: "e", name: "Importer" }],
  availableAmount: 1000,
  totalAmount: 4000,
  maxPerVehicle: 500,
  termDays: 90,
  ratePhases: [
    { rate: 3.5, fromDate: "2026-01-02" },
    { rate: 4.1, fromDate: "2026-07-01" },
  ],
  equipmentStateIds: [1],
  equipmentTypeIds: [5],
  canAddStock: true,
  ...extra,
});

const lists = (url: URL) => {
  if (url.pathname === "/api/equipments/types") return { json: [{ id: 5, abbreviation: "Light" }] };
  if (url.pathname === "/api/equipments/states") return { json: [{ id: 1, abbreviation: "New" }] };
  return undefined;
};

const render = (ui: React.ReactElement, route = "/") => renderWithApi(ui, { route, store: makeStore() });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Agreements", () => {
  it("shows the plafond, limit per vehicle, term, rate phases and names, in the contract's currency", async () => {
    mockFetch((url) => (url.pathname === "/api/stock/contracts" ? { json: { items: [contract(1)], page: 1, pageSize: 12, totalCount: 1 } } : lists(url)));
    render(<AgreementsPage />);
    expect(await screen.findByText("$1,000.00")).toBeTruthy();
    expect(screen.getByText("of $4,000.00")).toBeTruthy();
    expect(screen.getByText("Up to $500.00 / vehicle")).toBeTruthy();
    expect(screen.getByText("90 days")).toBeTruthy();
    expect(screen.getByText("3.5% from 02/01/2026")).toBeTruthy();
    expect(screen.getByText("4.1% from 01/07/2026")).toBeTruthy();
    expect(await screen.findByText("Light")).toBeTruthy();
    expect(await screen.findByText("New")).toBeTruthy();
  });

  it("Add stock only when canAddStock", async () => {
    mockFetch((url) =>
      url.pathname === "/api/stock/contracts" ? { json: { items: [contract(1), contract(2, { canAddStock: false })], page: 1, pageSize: 12, totalCount: 2 } } : lists(url),
    );
    render(<AgreementsPage />);
    await screen.findByText("Financing 2");
    expect(screen.getAllByRole("link", { name: /Add stock/ })).toHaveLength(1);
  });

  it("pages through the API, and encodes the opaque id in the link", async () => {
    const { requests } = mockFetch((url) =>
      url.pathname === "/api/stock/contracts"
        ? { json: { items: [contract(Number(url.searchParams.get("page")))], page: 1, pageSize: 12, totalCount: 25 } }
        : lists(url),
    );
    render(<AgreementsPage />);
    await screen.findByText("Financing 1");
    expect(screen.getByRole("link", { name: /Details/ }).getAttribute("href")).toBe("/stock/agreements/AQ%2Fc%2B1");
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    await screen.findByText("Financing 2");
    const pages = requests.filter((r) => new URL(r.url).pathname === "/api/stock/contracts").map((r) => new URL(r.url).searchParams.get("page"));
    expect(pages).toEqual(["1", "2"]);
  });

  it("empty", async () => {
    mockFetch((url) => (url.pathname === "/api/stock/contracts" ? { json: { items: [], page: 1, pageSize: 12, totalCount: 0 } } : lists(url)));
    render(<AgreementsPage />);
    expect(await screen.findByText(/no active agreements/)).toBeTruthy();
  });

  it("400 user_has_no_entity explains the user isn't linked to a dealer", async () => {
    mockFetch(() => ({ status: 400, json: { title: "x", status: 400, code: "user_has_no_entity" } }));
    render(<AgreementsPage />);
    expect(await screen.findByText(/isn't linked to a dealer/)).toBeTruthy();
  });

  it("502, with a retry", async () => {
    let calls = 0;
    mockFetch((url) =>
      url.pathname === "/api/stock/contracts"
        ? calls++ === 0
          ? { status: 502, json: { status: 502, code: "backend_unavailable" } }
          : { json: { items: [contract(1)], page: 1, pageSize: 12, totalCount: 1 } }
        : lists(url),
    );
    render(<AgreementsPage />);
    expect(await screen.findByText(/temporarily unavailable/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Financing 1")).toBeTruthy();
  });
});

const unit = (n: number, extra: object = {}) => ({
  id: `AQ/u+${n}`,
  contractId: "AQ/c+1",
  contractNumber: 50001,
  item: n,
  state: "Activate",
  amount: 1234.5,
  currencyId: "USD",
  dueDate: "2026-12-01T00:00:00",
  supplierName: "Importer",
  vin: "VIN",
  licencePlate: "AA-00-BB",
  brand: "Renault",
  model: "Clio",
  invoiceNumber: "FT 1",
  ...extra,
});

describe("Stock units", () => {
  it("lists all contracts with state labels: neutral for null, and a missing amount isn't 0", async () => {
    const { requests } = mockFetch((url) =>
      url.pathname === "/api/stock/units" ? { json: { items: [unit(1), unit(2, { state: null, amount: null }), unit(3, { state: "TermByNC" })], page: 1, pageSize: 20, totalCount: 3 } } : undefined,
    );
    render(<StockUnitsPage />);
    expect(await screen.findByText("Active")).toBeTruthy();
    expect(screen.getByText("No state")).toBeTruthy();
    expect(screen.getByText("Terminated by credit note")).toBeTruthy();
    expect(screen.getAllByText("$1,234.50")).toHaveLength(2);
    expect(screen.queryByText("$0.00")).toBeNull();
    expect(screen.getAllByText("01/12/2026").length).toBe(3);
    expect(new URL(requests[0].url).searchParams.has("contractId")).toBe(false);
  });

  it("pages through the API", async () => {
    mockFetch((url) => (url.pathname === "/api/stock/units" ? { json: { items: [unit(Number(url.searchParams.get("page")))], page: 1, pageSize: 20, totalCount: 45 } } : undefined));
    render(<StockUnitsPage />);
    await screen.findByRole("link", { name: "#1" });
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(await screen.findByRole("link", { name: "#2" })).toBeTruthy();
  });

  it("empty and error", async () => {
    mockFetch(() => ({ json: { items: [], page: 1, pageSize: 20, totalCount: 0 } }));
    render(<StockUnitsPage />);
    expect(await screen.findByText(/no stock units yet/)).toBeTruthy();
    cleanup();
    mockFetch(() => ({ status: 500, json: {} }));
    render(<StockUnitsPage />);
    expect(await screen.findByText(/couldn't be loaded/)).toBeTruthy();
  });
});

const FLOW = {
  currencyId: "USD",
  initialDate: "2026-01-01",
  finalDate: null,
  rate: 4.25,
  capital: 100,
  plafondAmount: null,
  totalCapital: 0,
  totalInterest: 7.77,
  totalExpenses: null,
  totalTaxes: null,
  totalWithoutTaxes: 1,
  totalWithTaxes: 2,
  flows: [{ number: 1, valueDate: "2026-02-03", invoiceDate: null, capital: 10, interest: null, taxAmount: 0, amount: 999.99, outstandingCapital: null }],
  otherFlows: [{ valueDate: "2026-02-04", expenseAmount: 3, taxAmount: null, amountWithTaxes: null }],
};

describe("Unit detail and cash flow", () => {
  const server = (flow: object | null, unitAnswer: object = { json: unit(1) }) =>
    mockFetch((url) => {
      if (url.pathname === "/api/stock/units/AQ%2Fu%2B1") return unitAnswer;
      if (url.pathname === "/api/stock/units/AQ%2Fu%2B1/cash-flow") return flow ? { json: flow } : { status: 404, json: { status: 404 } };
      return undefined;
    });
  const page = () =>
    render(
      <Routes>
        <Route path="/stock/units/:id" element={<StockUnitDetailPage />} />
      </Routes>,
      "/stock/units/AQ%2Fu%2B1",
    );

  it("shows the values as returned: no totals of its own, a real 0 is 0, null isn't", async () => {
    server(FLOW);
    page();
    expect(await screen.findByText("$7.77")).toBeTruthy();
    expect(screen.getByText("$999.99")).toBeTruthy();
    expect(screen.getByText("03/02/2026")).toBeTruthy();
    // totalCapital and the line's tax: a real 0
    expect(screen.getAllByText("$0.00")).toHaveLength(2);
    expect(screen.getByText("Total expenses").parentElement?.textContent).toContain("—");
    expect(screen.getByText("Plafond").parentElement?.textContent).toContain("—");
  });

  it("no flows", async () => {
    server({ ...FLOW, flows: [], otherFlows: null });
    page();
    expect(await screen.findByText("There are no cash flows yet.")).toBeTruthy();
  });

  it("a cash flow that isn't available doesn't hide the unit", async () => {
    server(null);
    page();
    expect(await screen.findByText(/isn't available/)).toBeTruthy();
    expect(screen.getByText("Unit #1")).toBeTruthy();
  });

  it("a unit that isn't this dealer's", async () => {
    server(FLOW, { status: 404, json: { status: 404 } });
    page();
    expect(await screen.findByText(/isn't available/)).toBeTruthy();
  });
});

describe("Agreement detail: netting accounts", () => {
  const server = (accounts: object) =>
    mockFetch((url) => {
      if (url.pathname.endsWith("/netting-accounts")) return accounts;
      if (url.pathname.endsWith("/cash-flow")) return { json: FLOW };
      if (url.pathname === "/api/stock/units") return { json: { items: [], page: 1, pageSize: 20, totalCount: 0 } };
      return lists(url);
    });
  const page = () =>
    render(
      <Routes>
        <Route path="/stock/agreements/:id" element={<AgreementDetailPage />} />
      </Routes>,
      "/stock/agreements/AQ%2Fc%2B1",
    );

  it("no account: the payment action is hidden", async () => {
    server({ json: [] });
    page();
    expect(await screen.findByText(/has no netting account/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Pay stocks/ })).toBeNull();
  });

  it("while the accounts can't be read the payment action is hidden too", async () => {
    server({ status: 502, json: { status: 502, code: "backend_unavailable" } });
    page();
    expect(await screen.findByText(/temporarily unavailable/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Pay stocks/ })).toBeNull();
  });

  it("an account: pay is offered; amounts in null say unavailable, with a warning on the balance", async () => {
    server({ json: [{ id: "a", number: 7001, relation: "Current", currencyId: "USD", plafondAmount: 50, totalCapital: null, totalInterest: null, totalWithTaxes: null }] });
    page();
    const link = await screen.findByRole("link", { name: /Pay stocks/ });
    expect(link.getAttribute("href")).toBe("/stock/agreements/AQ%2Fc%2B1/pay");
    expect(screen.getByText("Balance").parentElement?.textContent).toContain("unavailable");
    expect(screen.getByText("This account's balance couldn't be read.")).toBeTruthy();
    await waitFor(() => expect(screen.getAllByText("unavailable").length).toBe(3));
  });
});
