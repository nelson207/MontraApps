// @vitest-environment jsdom
import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockFetch, renderWithApi } from "@platform/features/news/testing/renderWithApi";
import { EQUIPMENT_ASSET } from "../../model/business";
import type { CredOperDraft } from "../../model/credOperDraft";
import { CustomerCard, FinancingCard, PeopleCard, VehicleCards } from "./ReviewCards";

beforeEach(() => {
  mockFetch(() => ({ json: [] }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const op = (overrides: Partial<CredOperDraft> = {}) =>
  ({ insurances: [], aplBusinessId: 4, assetTypeId: EQUIPMENT_ASSET, ...overrides }) as unknown as CredOperDraft;

describe("CustomerCard", () => {
  it("leads with the customer's name and fiscal number", () => {
    renderWithApi(<CustomerCard op={op({ customerName: "Ana Silva", customerVAT: { legalDocNumber: "123456789" } } as Partial<CredOperDraft>)} />);
    expect(screen.getByText("Ana Silva")).toBeTruthy();
    expect(screen.getByText("AS")).toBeTruthy();
    expect(screen.getByText("Fiscal number 123456789")).toBeTruthy();
  });

  it("empty fields aren't listed", () => {
    renderWithApi(<CustomerCard op={op({ customerName: "Ana Silva" })} />);
    expect(screen.queryByText("Landline")).toBeNull();
    expect(screen.queryByText("Not filled")).toBeNull();
  });

  it("says so when there's no customer yet", () => {
    renderWithApi(<CustomerCard op={op()} />);
    expect(screen.getByText("No customer yet.")).toBeTruthy();
  });
});

describe("VehicleCards", () => {
  const vehicle = (equipment: object) => op({ assets: [{ equipment }] } as Partial<CredOperDraft>);

  it("leads with what tells it apart", () => {
    renderWithApi(<VehicleCards op={vehicle({ description: "Red van", licencePlate: "AA-00-BB" })} />);
    expect(screen.getByText("Red van")).toBeTruthy();
    expect(screen.getByText("AA-00-BB")).toBeTruthy();
  });

  it("keeps the rest a click away", () => {
    renderWithApi(<VehicleCards op={vehicle({ licencePlate: "AA-00-BB", doors: 5 })} />);
    expect((screen.getByText("Show all details").closest("details") as HTMLDetailsElement).open).toBe(false);
  });

  it("nothing to show: says so, without an empty lead or details", () => {
    renderWithApi(<VehicleCards op={vehicle({})} />);
    expect(screen.getByText("No details yet.")).toBeTruthy();
    expect(screen.queryByText("Show all details")).toBeNull();
    // The card's own title only
    expect(screen.getAllByText("Vehicle")).toHaveLength(1);
  });

  it("no more details to open: no link to them", () => {
    renderWithApi(<VehicleCards op={vehicle({ licencePlate: "AA-00-BB" })} />);
    expect(screen.queryByText("Show all details")).toBeNull();
  });
});

describe("PeopleCard", () => {
  it("shows everyone at once", () => {
    const people = [
      { credOperIntervType: 1, entity: { fullName: "Ana Silva" }, person: {} },
      { credOperIntervType: 2, entity: { fullName: "Rui Lopes" }, person: {} },
    ];
    renderWithApi(<PeopleCard op={op({ interventions: people } as Partial<CredOperDraft>)} />);
    expect(screen.getByText("Ana Silva")).toBeTruthy();
    expect(screen.getByText("Rui Lopes")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /next/i })).toBeNull();
  });

  it("says so when there's no one", () => {
    renderWithApi(<PeopleCard op={op({ interventions: [] })} />);
    expect(screen.getByText("No people added.")).toBeTruthy();
  });
});

describe("FinancingCard", () => {
  it("leaves the amounts and the term to the overview", () => {
    const financing = op({ amount: 18_000, conditions: [{ term: 60 }], assets: [{ equipment: { netAmount: 20_000, retakeAmount: 2_000 } }] } as Partial<CredOperDraft>);
    renderWithApi(<FinancingCard op={financing} options={{} as never} />);
    expect(screen.queryByText("Financed amount")).toBeNull();
    expect(screen.queryByText("Term")).toBeNull();
    expect(screen.queryByText("Initial entry")).toBeNull();
  });
});
