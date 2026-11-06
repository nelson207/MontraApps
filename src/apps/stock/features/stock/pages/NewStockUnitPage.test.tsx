// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StockContractDto } from "@platform/api/generated/MontraPOSApi";
import { makeStore, mockFetch, renderWithApi, type MockAnswer } from "@platform/features/news/testing/renderWithApi";
import NewStockUnitPage from "./NewStockUnitPage";

Element.prototype.scrollIntoView = () => undefined; // jsdom has none (the searchable select uses it)

const CONTRACT: StockContractDto = {
  id: "AQ/c+1",
  number: 50001,
  description: "Stock financing",
  companyId: 3,
  companyAbbreviation: "Montra",
  currencyId: "EUR",
  suppliers: [{ interventionId: "AQ/sup+1", entityId: "AQ/e", name: "Importer One" }],
  availableAmount: 100_000,
  totalAmount: 200_000,
  maxPerVehicle: 40_000,
  termDays: 180,
  ratePhases: [{ rate: 4.25, fromDate: "2026-01-01" }],
  equipmentStateIds: [0, 1],
  equipmentTypeIds: [5],
  canAddStock: true,
};

const code = (id: number, abbreviation: string) => ({ id, abbreviation, description: abbreviation });
const option = (value: string) => ({ code: value, abbreviation: value, description: value });

function server(save: () => MockAnswer, contracts: StockContractDto[] = [CONTRACT]) {
  return mockFetch((url, request) => {
    const path = url.pathname;
    if (path === "/api/stock/contracts") return { json: { items: contracts, page: 1, pageSize: 6, totalCount: contracts.length } };
    if (path === `/api/stock/contracts/${encodeURIComponent("AQ/c+1")}/units` && request.method === "POST") return save();
    if (path === "/api/equipments/types") return { json: [code(5, "Light"), code(6, "Truck")] };
    if (path === "/api/equipments/categories") return { json: [code(2, "Car")] };
    if (path === "/api/equipments/states") return { json: [code(0, "New"), code(1, "Used")] };
    if (path === "/api/equipments/brands") return { json: [option("REN")] };
    if (path === "/api/equipments/models") return { json: [option("CLIO")] };
    if (path === "/api/equipments/versions") return { json: [option("V1")] };
    return undefined;
  });
}

// Coming from an agreement's card (the contract travels in the route state)
function FromCard({ contract }: { contract: StockContractDto }) {
  const navigate = useNavigate();
  useEffect(() => void navigate("/stock/new", { state: { contract } }), [navigate, contract]);
  return null;
}

const renderPage = (contract: StockContractDto = CONTRACT) =>
  renderWithApi(
    <Routes>
      <Route path="/" element={<FromCard contract={contract} />} />
      <Route path="/stock/new" element={<NewStockUnitPage />} />
    </Routes>,
    { store: makeStore() },
  );

async function pick(field: string, name: string) {
  const id = `stock.equipment-${field}`;
  await waitFor(() => expect((document.getElementById(id) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(document.getElementById(id) as HTMLElement);
  fireEvent.click(await screen.findByRole("option", { name }));
}

async function fillVehicle(amount = "25000") {
  await pick("equipmentTypeId", "Light");
  await pick("equipmentCategoryId", "Car");
  await pick("equipmentStateId", "New");
  await pick("brand", "REN");
  await pick("model", "CLIO");
  await pick("version", "V1");
  fireEvent.change(document.getElementById("stock.equipment-vin") as HTMLElement, { target: { value: "VF1RJA00X12345678" } });
  fireEvent.change(document.getElementById("stock.equipment-equipYear") as HTMLElement, { target: { value: "2026" } });
  fireEvent.change(document.getElementById("stock-amount") as HTMLElement, { target: { value: amount } });
  fireEvent.click(screen.getByRole("button", { name: /Next/ }));
  await screen.findByLabelText(/Invoice number/);
}

const submit = () => screen.getByRole("button", { name: /Save stock unit/ });

async function fillAndSubmit() {
  await fillVehicle();
  fireEvent.change(screen.getByLabelText(/Invoice number/), { target: { value: "FT 2026/1" } });
  fireEvent.click(submit());
}

const posts = (requests: Request[]) => requests.filter((r) => r.method === "POST");

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("validation", () => {
  it("doesn't go on with a bad VIN or an amount above the limit per vehicle", async () => {
    server(() => ({ json: {} }));
    renderPage();
    await screen.findByText(/Up to €40,000.00 for this vehicle/);
    fireEvent.change(document.getElementById("stock.equipment-vin") as HTMLElement, { target: { value: "SHORT" } });
    fireEvent.change(document.getElementById("stock-amount") as HTMLElement, { target: { value: "40000.01" } });
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(await screen.findByText("The VIN has exactly 17 characters.")).toBeTruthy();
    expect(screen.getByText("Up to €40,000.00 per vehicle on this agreement.")).toBeTruthy();
    expect(screen.queryByLabelText(/Invoice number/)).toBeNull();
  });

  it("the registration date is gone; the year is required, and the month once the vehicle is used", async () => {
    server(() => ({ json: {} }));
    renderPage();
    await screen.findByText(/Up to €40,000.00 for this vehicle/);
    expect(document.getElementById("stock.equipment-registrationDate")).toBeNull();
    const label = (id: string) => document.querySelector(`label[for="${id}"]`)?.textContent;
    expect(label("stock.equipment-equipYear")).toContain("*");
    expect(label("stock.equipment-equipMonth")).not.toContain("*");
    await pick("equipmentStateId", "Used");
    expect(label("stock.equipment-equipMonth")).toContain("*");
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(await screen.findByText("Enter the year.")).toBeTruthy();
    expect(screen.getByText("Enter the month.")).toBeTruthy();
    await pick("equipmentStateId", "New");
    expect(label("stock.equipment-equipMonth")).not.toContain("*");
    expect(screen.queryByText("Enter the month.")).toBeNull();
  });

  it("the invoice number is required", async () => {
    const { requests } = server(() => ({ json: {} }));
    renderPage();
    await fillVehicle();
    fireEvent.click(submit());
    expect(await screen.findByText("Enter the invoice number.")).toBeTruthy();
    expect(posts(requests)).toHaveLength(0);
  });

  it("the contract's lists limit the types and states offered, by their names from the equipment lists", async () => {
    server(() => ({ json: {} }));
    renderPage();
    const id = "stock.equipment-equipmentTypeId";
    await waitFor(() => expect(document.getElementById(id)).toBeTruthy());
    fireEvent.click(document.getElementById(id) as HTMLElement);
    expect(await screen.findByRole("option", { name: "Light" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Truck" })).toBeNull();
  });

  it("no agreement chosen yet: the types aren't asked for (the API requires the company)", async () => {
    const { requests } = server(() => ({ json: {} }), [CONTRACT, { ...CONTRACT, id: "AQ/c+2", number: 50002 }]);
    renderWithApi(<NewStockUnitPage />, { store: makeStore() });
    await screen.findAllByRole("radio");
    expect((document.getElementById("stock.equipment-equipmentTypeId") as HTMLButtonElement).textContent).toContain("Select an agreement first");
    await new Promise((resolve) => setTimeout(resolve, 20));
    const withoutCompany = requests.map((r) => new URL(r.url)).filter((url) => url.pathname === "/api/equipments/types" && !url.searchParams.has("companyId"));
    expect(withoutCompany).toHaveLength(0);
  });

  it("no equipment types set up for the application: it says so, instead of an empty list", async () => {
    mockFetch((url) => {
      if (url.pathname === "/api/equipments/types") return { json: [] };
      if (url.pathname === "/api/equipments/states") return { json: [code(0, "Novo")] };
      return undefined;
    });
    renderPage();
    expect(await screen.findByText(/No equipment types are set up/)).toBeTruthy();
  });

  it("an empty list means no restriction", async () => {
    server(() => ({ json: {} }));
    renderPage({ ...CONTRACT, equipmentTypeIds: [] });
    const id = "stock.equipment-equipmentTypeId";
    await waitFor(() => expect(document.getElementById(id)).toBeTruthy());
    fireEvent.click(document.getElementById(id) as HTMLElement);
    expect(await screen.findByRole("option", { name: "Truck" })).toBeTruthy();
  });

  it("with more than one supplier one must be chosen; with one it is preselected", async () => {
    const two = { ...CONTRACT, suppliers: [{ interventionId: "AQ/a", name: "A" }, { interventionId: "AQ/b", name: "B" }] };
    const { requests } = server(() => ({ json: { isSaved: false, messages: [] } }));
    renderPage(two);
    await fillVehicle();
    fireEvent.change(screen.getByLabelText(/Invoice number/), { target: { value: "FT" } });
    fireEvent.click(submit());
    expect(await screen.findByText("Select the supplier.")).toBeTruthy();
    expect(posts(requests)).toHaveLength(0);
    fireEvent.click(document.getElementById("stock-supplier") as HTMLElement);
    fireEvent.click(await screen.findByRole("option", { name: "B" }));
    fireEvent.click(submit());
    await waitFor(() => expect(posts(requests)).toHaveLength(1));
    expect((await posts(requests)[0].clone().json()).supplierInterventionId).toBe("AQ/b");
  });
});

describe("saving", () => {
  it("sends the agreed body to the encoded contract", async () => {
    const { requests } = server(() => ({ json: { isSaved: true, stock: null, messages: [] } }));
    renderPage();
    await fillAndSubmit();
    await screen.findByText("Stock saved, but not active");
    expect(new URL(posts(requests)[0].url).pathname).toBe("/api/stock/contracts/AQ%2Fc%2B1/units");
    expect(await posts(requests)[0].clone().json()).toMatchObject({
      correlationId: expect.any(String),
      supplierInterventionId: "AQ/sup+1",
      amount: 25000,
      invoiceNumber: "FT 2026/1",
      equipment: { equipmentTypeId: 5, equipmentCategoryId: 2, equipmentStateId: 0, equipmentBrand: "REN", equipmentModel: "CLIO", equipVersion: "V1", serialNumber: "VF1RJA00X12345678", equipYear: 2026, equipMonth: null },
    });
  });

  it("isSaved: true says it isn't active, also with stock: null, and can't be submitted again", async () => {
    const { requests } = server(() => ({ json: { isSaved: true, stock: null, messages: [{ severity: "Info", text: "Aguarda ativação." }] } }));
    renderPage();
    await fillAndSubmit();
    expect(await screen.findByText("Stock saved, but not active")).toBeTruthy();
    expect(screen.getByText(/isn't active yet/)).toBeTruthy();
    expect(screen.getByText("Aguarda ativação.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Save stock unit/ })).toBeNull();
    expect(posts(requests)).toHaveLength(1);
  });

  it("isSaved: false keeps the form and shows the messages; the next try has a new id", async () => {
    const { requests } = server(() => ({ json: { isSaved: false, messages: [{ severity: "Error", text: "Fatura recusada." }] } }));
    renderPage();
    await fillAndSubmit();
    expect(await screen.findByText("Fatura recusada.")).toBeTruthy();
    expect((screen.getByLabelText(/Invoice number/) as HTMLInputElement).value).toBe("FT 2026/1");
    fireEvent.click(submit());
    await waitFor(() => expect(posts(requests)).toHaveLength(2));
    const [first, second] = await Promise.all(posts(requests).map((r) => r.clone().json()));
    expect(second.correlationId).not.toBe(first.correlationId);
  });

  it.each([
    ["stock_vehicle_limit_exceeded", "The amount is above this agreement's limit per vehicle."],
    ["stock_type_not_configured", "This agreement isn't set up for stock of this type. Contact the back office."],
    ["validation_failed", "Some of the values aren't valid. Check the form and try again."],
  ])("400 %s shows its message and keeps the form", async (errorCode, message) => {
    server(() => ({ status: 400, json: { title: "x", status: 400, code: errorCode } }));
    renderPage();
    await fillAndSubmit();
    expect(await screen.findByText(message)).toBeTruthy();
    expect((screen.getByLabelText(/Invoice number/) as HTMLInputElement).disabled).toBe(false);
  });

  it("no answer: it may be saved, so only the same request can be repeated", async () => {
    let calls = 0;
    const { requests } = server(() => {
      if (calls++ === 0) throw new TypeError("Failed to fetch");
      return { json: { isSaved: true, stock: null, messages: [] } };
    });
    renderPage();
    await fillAndSubmit();
    const retry = await screen.findByRole("button", { name: "Try again" });
    expect((screen.getByLabelText(/Invoice number/) as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(retry);
    await screen.findByText("Stock saved, but not active");
    const [first, second] = await Promise.all(posts(requests).map((r) => r.clone().json()));
    expect(second).toEqual(first);
  });

  it("a double click saves once", async () => {
    const { requests } = server(() => ({ json: { isSaved: true, stock: null, messages: [] }, delay: 20 }));
    renderPage();
    await fillVehicle();
    fireEvent.change(screen.getByLabelText(/Invoice number/), { target: { value: "FT" } });
    const button = submit();
    fireEvent.click(button);
    fireEvent.click(button);
    await screen.findByText("Stock saved, but not active");
    expect(posts(requests)).toHaveLength(1);
  });

  it("only one agreement that can take stock: it is chosen by default", async () => {
    server(() => ({ json: {} }), [CONTRACT, { ...CONTRACT, id: "AQ/c+2", number: 50002, canAddStock: false }]);
    renderWithApi(<NewStockUnitPage />, { store: makeStore() });
    expect(await screen.findByText(/Up to €40,000.00 for this vehicle on agreement 50001/)).toBeTruthy();
    await waitFor(() => expect(screen.getAllByRole("radio").filter((radio) => (radio as HTMLInputElement).checked)).toHaveLength(1));
  });

  it("several agreements: the user chooses", async () => {
    server(() => ({ json: {} }), [CONTRACT, { ...CONTRACT, id: "AQ/c+2", number: 50002 }]);
    renderWithApi(<NewStockUnitPage />, { store: makeStore() });
    await screen.findAllByRole("radio");
    expect(screen.getAllByRole("radio").filter((radio) => (radio as HTMLInputElement).checked)).toHaveLength(0);
  });

  it("a contract that can't take stock can't be chosen", async () => {
    server(() => ({ json: {} }), [{ ...CONTRACT, canAddStock: false }]);
    renderWithApi(<NewStockUnitPage />, { store: makeStore() });
    const radio = await screen.findByRole("radio");
    expect((radio as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText("Can't take new stock")).toBeTruthy();
  });
});
