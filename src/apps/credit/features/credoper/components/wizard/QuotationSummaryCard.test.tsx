// @vitest-environment jsdom
import { cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockFetch, renderWithApi } from "@platform/features/news/testing/renderWithApi";
import { businessById, type AvailableBusiness } from "../../model/business";
import type { CredOperDraft } from "../../model/credOperDraft";
import { quotationSummaryFields } from "../../model/quotationSummary";
import QuotationSummaryCard from "./QuotationSummaryCard";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const SUMMARY = {
  id: "AQ/quote",
  number: 4521,
  aplCompanyId: 1,
  aplBusinessId: 3,
  credOperTypeId: 299,
  financialProductId: 7,
  amount: 20000,
  currencyId: "EUR",
  beginDate: "2026-10-01T00:00:00Z",
  stateId: 101010,
  stateDate: "2026-10-01",
  customerEntityId: "AEtoken",
  customerName: "João Silva",
};

/** The businesses answer the wizard already has: the names of the company, business and product */
const BUSINESSES: AvailableBusiness[] = [
  {
    ...businessById(3)!,
    offers: [{ companyId: 1, companyLabel: "Montra Leasing", financialProducts: [{ id: 7, code: "AC", description: "Auto Classic" }] }],
  },
];

const proposal = (extra: Partial<CredOperDraft>): CredOperDraft => ({ credOperStep: 2, insurances: [], ...extra });
const value = (label: string) => screen.getByText(label).nextElementSibling?.textContent;

describe("QuotationSummaryCard", () => {
  it("just converted: the conversion's summary, by name, linking to the quotation (nothing asked)", () => {
    const { fetchMock } = mockFetch(() => undefined);
    renderWithApi(<QuotationSummaryCard operation={proposal({ sourceCredOperId: "AQ/quote", sourceQuotation: SUMMARY })} businesses={BUSINESSES} />);
    const link = screen.getByRole("link", { name: "Quotation #4521" });
    expect(link.getAttribute("href")).toBe("/quotation?id=AQ%2Fquote");
    expect(value("Company")).toBe("Montra Leasing");
    expect(value("Business")).toBe(businessById(3)!.label);
    expect(value("Financial product")).toBe("Auto Classic");
    expect(value("Amount")).toMatch(/^20.000.00 EUR$/);
    expect(value("Begin date")).toBe("2026-10-01");
    expect(value("Customer")).toBe("João Silva");
    // No list of them is loaded: their ids
    expect(value("Operation type")).toBe("Type 299");
    expect(value("State")).toBe("State 101010");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reopened: the quotation is read (GET credoper/{sourceCredOperId}) and shown the same way", async () => {
    const { requests } = mockFetch((url) =>
      url.pathname === "/api/credit-operations/credoper/AQ%2Fquote"
        ? {
            json: {
              id: "AQ/quote",
              credOperNumber: 4521,
              aplCompanyId: 1,
              aplBusinessId: 3,
              credOperTypeId: 299,
              financialProductId: 7,
              amount: 20000,
              currencyId: "EUR",
              autUserStateId: 101010,
              entityName: "João Silva",
            },
          }
        : undefined,
    );
    renderWithApi(<QuotationSummaryCard operation={proposal({ id: "APtoken", sourceCredOperId: "AQ/quote" })} businesses={BUSINESSES} />);
    expect(await screen.findByRole("link", { name: "Quotation #4521" })).toBeTruthy();
    expect(value("Customer")).toBe("João Silva");
    expect(value("Financial product")).toBe("Auto Classic");
    expect(requests).toHaveLength(1);
  });

  it("a quotation the user can no longer see (404): no summary, only a note that the fields stay locked", async () => {
    const { requests } = mockFetch(() => ({ status: 404, json: { title: "Not found", status: 404 } }));
    renderWithApi(<QuotationSummaryCard operation={proposal({ id: "APtoken", sourceCredOperId: "AQ/quote" })} businesses={BUSINESSES} />);
    expect((await screen.findByRole("note")).textContent).toContain("can no longer see the quotation");
    expect(screen.queryByRole("link")).toBeNull();
    await waitFor(() => expect(requests).toHaveLength(1));
  });

  it("another failure says so, with Retry", async () => {
    mockFetch(() => ({ status: 502, json: { title: "Bad gateway", status: 502, code: "backend_unavailable" } }));
    renderWithApi(<QuotationSummaryCard operation={proposal({ id: "APtoken", sourceCredOperId: "AQ/quote" })} businesses={BUSINESSES} />);
    expect(await screen.findByRole("button", { name: "Retry" })).toBeTruthy();
  });

  it("an operation not made from a quotation: nothing", () => {
    const { container } = renderWithApi(<QuotationSummaryCard operation={proposal({})} businesses={BUSINESSES} />);
    expect(container.textContent).toBe("");
  });
});

describe("quotationSummaryFields", () => {
  it("before the businesses load, or for what they don't have: the ids", () => {
    const fields = Object.fromEntries(quotationSummaryFields(SUMMARY, undefined).map((f) => [f.label, f.value]));
    expect(fields).toMatchObject({ Company: "Company 1", "Financial product": "Product 7" });
  });
});
