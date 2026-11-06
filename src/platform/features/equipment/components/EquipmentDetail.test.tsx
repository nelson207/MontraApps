// @vitest-environment jsdom
import { cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeStore, mockFetch, renderWithApi } from "@platform/features/news/testing/renderWithApi";
import { OPTIONAL_FIELD, VEHICLE_FULL_FIELDS, VEHICLE_KIND_FIELDS, type EquipmentField, type EquipmentValue } from "../equipmentModel";
import EquipmentDetail from "./EquipmentDetail";

const lists = () =>
  mockFetch((url) => {
    if (url.pathname === "/api/equipments/types") return { json: [{ id: 5, abbreviation: "Light" }] };
    if (url.pathname === "/api/equipments/categories") return { json: [{ id: 2, abbreviation: "Car" }] };
    if (url.pathname === "/api/equipments/states") return { json: [{ id: 1, abbreviation: "New" }] };
    if (url.pathname === "/api/equipments/brands") return { json: [{ code: "REN", abbreviation: "Renault" }] };
    return undefined;
  });

const requiring = (fields: readonly string[]) => (field: EquipmentField) => ({ ...OPTIONAL_FIELD, required: fields.includes(field) });

const show = (value: EquipmentValue, rule = requiring([])) =>
  renderWithApi(<EquipmentDetail value={value} onChange={() => undefined} idPrefix="v" companyId={1} rule={rule} />, { store: makeStore() });

const brand = () => document.getElementById("v-brand") as HTMLButtonElement;
const brandReads = (requests: Request[]) => requests.filter((r) => new URL(r.url).pathname === "/api/equipments/brands");
const marked = () => screen.getAllByText("*").map((star) => star.parentElement?.textContent?.replace("*", "").trim());

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("the * follows the screen's rule", () => {
  it("nothing mandatory, no *", () => {
    lists();
    show({});
    expect(screen.queryByText("*")).toBeNull();
  });

  it("the kind of vehicle only (a quotation)", () => {
    lists();
    show({}, requiring(VEHICLE_KIND_FIELDS));
    expect(marked()).toEqual(["Equipment type", "Equipment category", "Equipment state"]);
  });

  it("the exact vehicle (a proposal, a stock unit)", () => {
    lists();
    show({}, requiring(VEHICLE_FULL_FIELDS));
    expect(marked()).toEqual(["Equipment type", "Equipment category", "Equipment state", "Brand", "Model", "Version"]);
  });
});

describe("brands wait for the type, the category and the state", () => {
  it.each<[string, EquipmentValue]>([
    ["nothing", {}],
    ["no category", { equipmentTypeId: 5, equipmentStateId: 1 }],
    ["no state", { equipmentTypeId: 5, equipmentCategoryId: 2 }],
    ["no type", { equipmentCategoryId: 2, equipmentStateId: 1 }],
  ])("%s: not loaded and not offered", async (_, value) => {
    const { requests } = lists();
    show(value);
    await screen.findByLabelText("Equipment state");
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(brandReads(requests)).toHaveLength(0);
    expect(brand().disabled).toBe(true);
    expect(brand().textContent).toContain("Select type, category and state first");
  });

  it("with all three they load", async () => {
    const { requests } = lists();
    show({ equipmentTypeId: 5, equipmentCategoryId: 2, equipmentStateId: 1 });
    await waitFor(() => expect(brandReads(requests)).toHaveLength(1));
    await waitFor(() => expect(brand().disabled).toBe(false));
  });

  it("state 0 is a real state (Novo)", async () => {
    const { requests } = lists();
    show({ equipmentTypeId: 5, equipmentCategoryId: 2, equipmentStateId: 0 });
    await waitFor(() => expect(brandReads(requests)).toHaveLength(1));
  });

  it("a state this screen hides doesn't block them", async () => {
    const { requests } = lists();
    show({ equipmentTypeId: 5, equipmentCategoryId: 2 }, (field) => ({ ...OPTIONAL_FIELD, visible: field !== "equipmentStateId" }));
    await waitFor(() => expect(brandReads(requests)).toHaveLength(1));
  });
});

describe("the company", () => {
  it("the API requires it: without one the types aren't asked for, and it says why", async () => {
    const { requests } = lists();
    renderWithApi(<EquipmentDetail value={{}} onChange={() => undefined} idPrefix="v" noCompanyHint="Select an agreement first" />, { store: makeStore() });
    await screen.findByLabelText("Equipment state");
    expect(requests.filter((r) => new URL(r.url).pathname === "/api/equipments/types")).toHaveLength(0);
    const type = document.getElementById("v-equipmentTypeId") as HTMLButtonElement;
    expect(type.disabled).toBe(true);
    expect(type.textContent).toContain("Select an agreement first");
  });
});

describe("the year and month", () => {
  it("are asked for instead of the registration date, on every screen", () => {
    lists();
    show({});
    expect(document.getElementById("v-equipYear")).not.toBeNull();
    expect(document.getElementById("v-equipMonth")).not.toBeNull();
    expect(document.getElementById("v-registrationDate")).toBeNull();
  });

  it("the * follows the screen's rule, like the other fields", () => {
    lists();
    show({}, requiring(["equipYear"]));
    expect(marked()).toEqual(["Year"]);
  });
});
