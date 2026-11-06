// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeStore, mockFetch } from "@platform/features/news/testing/renderWithApi";
import type { AvailableBusiness } from "../model/business";
import { useQuotationOptions } from "./useQuotationOptions";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const business = { id: 4, label: "Auto credit", offers: [] } as unknown as AvailableBusiness;

function render(params: Parameters<typeof useQuotationOptions>[0]) {
  const store = makeStore();
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  return renderHook(() => useQuotationOptions(params), { wrapper });
}

describe("contract classifications (GET /api/credit-operations/classifications)", () => {
  it("asks for the app's classifications of the business in the company", async () => {
    const { requests } = mockFetch((url) =>
      url.pathname === "/api/credit-operations/classifications"
        ? {
            json: [
              { id: 1, abbreviation: "Private", description: "Private customer", isValid: true, entitySuperType: "Person" },
              { id: 2, abbreviation: "Acme", description: "Companies", isValid: true, entitySuperType: "Company" },
              { id: 3, abbreviation: "Public", description: "Neither", isValid: true, entitySuperType: null },
            ],
          }
        : undefined,
    );
    const { result } = render({ business, companyId: 2, loadingBusinesses: false });

    await waitFor(() => expect(result.current.options.credOperClassifications).toHaveLength(3));
    expect(result.current.options.credOperClassifications[0]).toEqual({ code: "1", abbreviation: "Private", description: "Private customer", entitySuperType: "Person" });
    expect(result.current.options.credOperClassifications.map((c) => c.entitySuperType)).toEqual(["Person", "Company", null]);
    const params = new URL(requests[0].url).searchParams;
    expect(Object.fromEntries(params)).toEqual({ application: "MONTRA_APPLICATION_CREDIT", companyId: "2", businessId: "4" });
  });

  it("waits for the business and the company (the API requires both)", async () => {
    const { requests } = mockFetch(() => ({ json: [] }));
    const noBusiness = render({ business: undefined, companyId: 2, loadingBusinesses: true });
    // A business picked: the company is still to be decided or chosen
    const noCompany = render({ business, companyId: null, loadingBusinesses: false });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(noBusiness.result.current.loadingClassifications).toBe(true);
    expect(noCompany.result.current.loadingClassifications).toBe(true);
    expect(requests).toHaveLength(0);
  });

  it("none configured is an empty list", async () => {
    mockFetch(() => ({ json: [] }));
    const { result } = render({ business, companyId: 2, loadingBusinesses: false });
    await waitFor(() => expect(result.current.loadingClassifications).toBe(false));
    expect(result.current.options.credOperClassifications).toEqual([]);
  });
});
