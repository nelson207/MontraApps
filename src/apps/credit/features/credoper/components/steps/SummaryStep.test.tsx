// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import { mockFetch, TEST_TOKEN } from "@platform/features/news/testing/renderWithApi";
import credoperReducer, { startNew } from "../../credoperSlice";
import { EQUIPMENT_ASSET } from "../../model/business";
import type { CredOperDraft } from "../../model/credOperDraft";
import type { StepDef, StepIssues } from "../../wizard/steps";
import { DealOverview, Readiness } from "./SummaryStep";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const saved = { id: "AQtoken", credOperNumber: 1042, insurances: [] } as unknown as CredOperDraft;
const issues: StepIssues[] = [
  { step: { id: "financial", label: "Financial data", icon: "bi-cash" } as StepDef, issues: [{ key: "term", message: "Required" }] },
];

function setup(groups: StepIssues[], resultsShown: boolean) {
  const store = configureStore({ reducer: { credoper: credoperReducer } });
  store.dispatch(startNew(saved));
  return render(
    <Provider store={store}>
      <Readiness groups={groups} stage="quotation" operation={saved} goTo={() => undefined} resultsShown={resultsShown} />
    </Provider>,
  );
}

describe("Readiness", () => {
  it("says the operation is ready when nothing else reports on it", () => {
    setup([], false);
    expect(screen.getByText("Ready")).toBeTruthy();
  });

  it("gives way to the save results, which say more than 'everything is saved'", () => {
    const { container } = setup([], true);
    expect(container.textContent).toBe("");
  });

  it("still lists what blocks saving next to the save results", () => {
    setup(issues, true);
    expect(screen.getByText(/1 thing to fix/)).toBeTruthy();
  });

  it("shows what blocks saving as an error", () => {
    const { container } = setup(issues, false);
    expect(container.querySelector(".app-readiness.has-issues .bi-x-octagon-fill")).toBeTruthy();
    expect(container.querySelector(".badge.text-bg-danger")).toBeTruthy();
  });
});

describe("DealOverview", () => {
  const deal = (overrides: Partial<CredOperDraft> = {}) =>
    ({
      insurances: [],
      aplBusinessId: 4,
      assetTypeId: EQUIPMENT_ASSET,
      amount: 18_000,
      customerName: "Ana Silva",
      assets: [{ equipment: { netAmount: 20_000, retakeAmount: 2_000, licencePlate: "AA-00-BB" } }],
      conditions: [{ term: 60, implicitRate: 7.9, annualRate: 9.42, flows: [{ amount: 372.18 }], totalAmountChargedToCustomer: 22_330.8 }],
      ...overrides,
    }) as unknown as CredOperDraft;

  function show(operation: CredOperDraft, props: { stale?: boolean; onEdit?: () => void } = {}) {
    mockFetch(() => ({ json: [] }));
    const store = configureStore({
      reducer: {
        [emptySplitApi.reducerPath]: emptySplitApi.reducer,
        auth: () => ({ token: TEST_TOKEN, isAuthenticated: true }),
      },
      middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
    });
    return render(
      <Provider store={store}>
        <DealOverview operation={operation} {...props} />
      </Provider>,
    );
  }
  const normal = (text?: string | null) => text?.replace(/\s+/g, " ");

  it("opens with the sentence stating the deal", () => {
    const { container } = show(deal());
    expect(normal(container.querySelector(".app-deal-line")?.textContent)).toMatch(/over 60 months to finance AA-00-BB for Ana Silva\.$/);
  });

  it("shows the payment, the rates and the total to pay", () => {
    const { container } = show(deal());
    const text = normal(container.textContent)!;
    expect(text).toContain("Monthly payment");
    expect(text).toMatch(/372,18/);
    expect(text).toContain("TAN");
    expect(text).toContain("TAEG");
    expect(text).toContain("Total to pay");
    expect(text).toMatch(/22\D?330,80/);
  });

  it("leaves the total out when it isn't there yet", () => {
    show(deal({ conditions: [{ term: 60 }] }));
    expect(screen.queryByText("Total to pay")).toBeNull();
    expect(screen.getByText(/Not calculated yet/)).toBeTruthy();
  });

  it("draws how it's paid, to scale", () => {
    const { container } = show(deal());
    const widths = [...container.querySelectorAll<HTMLElement>(".app-deal-bar > span")].map((part) => part.style.flexBasis);
    expect(widths).toEqual(["10%", "90%"]);
    expect(screen.getByText("Initial entry")).toBeTruthy();
    expect(screen.getByText("Financed amount")).toBeTruthy();
    expect(screen.queryByText(/Fees, insurance/)).toBeNull();
  });

  it("shows financed fees and insurance as a part of their own", () => {
    const { container } = show(deal({ amount: 23_000 }));
    expect(container.querySelectorAll(".app-deal-bar > span")).toHaveLength(3);
    expect(screen.getByText("Financed equipment")).toBeTruthy();
    expect(screen.getByText("Fees, insurance and other costs")).toBeTruthy();
  });

  it("without the bar, says the amounts in words", () => {
    const { container } = show(deal({ aplBusinessId: 2, assetTypeId: null, assets: [] }));
    expect(container.querySelector(".app-deal-bar")).toBeNull();
    expect(screen.getByText("Financed amount")).toBeTruthy();
  });

  it("without the bar, shows the initial entry and the base amount when there are", () => {
    show(deal({ aplBusinessId: 13, assets: [{ equipment: { netAmount: 20_000, retakeAmount: 2_000 } }, { equipment: { netAmount: 15_000 } }] }));
    expect(screen.getByText("Total of the vehicles")).toBeTruthy();
    expect(screen.getByText("Initial entry")).toBeTruthy();
  });

  it("figures that aren't there yet aren't listed", () => {
    show(deal({ aplBusinessId: 2, assetTypeId: null, assets: [], conditions: [{ term: 12 }] }));
    expect(screen.queryByText("TAN")).toBeNull();
    expect(screen.queryByText("TAEG")).toBeNull();
    expect(screen.queryByText("Loan amount")).toBeNull();
  });

  it("flags the figures once the values changed since calculating", () => {
    const { container } = show(deal(), { stale: true });
    expect(container.querySelector(".app-deal-pay.is-stale")).toBeTruthy();
    expect(screen.getByText(/Values changed/)).toBeTruthy();
  });
});
