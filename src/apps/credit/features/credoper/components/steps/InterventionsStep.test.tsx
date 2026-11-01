// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { emptySplitApi } from "@platform/api/emptyApi";
import type { CredOperIntervDto } from "@platform/api/legacy/legacyApi";
import credoperReducer, { startNew } from "../../credoperSlice";
import entityLookupReducer from "../../entityLookup/entityLookupSlice";
import type { StepProps } from "../../wizard/stepTypes";
import InterventionsStep from "./InterventionsStep";

const person = (n: number, type: number): CredOperIntervDto => ({
  correlationID: `p${n}`,
  credOperIntervType: type,
  entity: { id: `e${n}`, fullName: `Person ${n}` },
  person: {},
});

function setup(people: CredOperIntervDto[]) {
  const store = configureStore({
    reducer: { [emptySplitApi.reducerPath]: emptySplitApi.reducer, credoper: credoperReducer, entityLookup: entityLookupReducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(emptySplitApi.middleware),
  });
  store.dispatch(startNew({ credOperStep: 2, insurances: [], interventions: people }));
  render(
    <Provider store={store}>
      <InterventionsStep {...({ errors: {} } as unknown as StepProps)} />
    </Provider>,
  );
}

/** The row's cards, in order: a person's name, or the add card's label */
const row = () =>
  [...document.querySelectorAll(".app-people-grid > *")].map(
    (card) => card.querySelector(".fw-semibold")?.textContent ?? card.textContent?.trim(),
  );

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("people of a proposal", () => {
  it("the customer, the second holder's place, then guarantors and the card to add one", () => {
    setup([person(1, 1), person(2, 4)]);
    expect(row()).toEqual(["Person 1", "Add second holder", "Person 2", "Add guarantor"]);
    // Both are on the row: no buttons in the head
    expect(within(document.querySelector(".app-section-head")!).queryByRole("button")).toBeNull();
  });

  it("the second holder next to the customer", () => {
    setup([person(1, 1), person(2, 4), person(3, 2)]);
    expect(row()).toEqual(["Person 1", "Person 3", "Person 2", "Add guarantor"]);
  });

  it("no free place on the row: adding a guarantor moves to the head", () => {
    setup([person(1, 1), person(2, 2), person(3, 4), person(4, 4)]);
    expect(row()).toEqual(["Person 1", "Person 2", "Person 3", "Person 4"]);
    expect(screen.getByRole("button", { name: /add guarantor/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Next people" })).toBeNull();
  });

  it("removing someone from the first row stays on it, even a second holder added last", async () => {
    vi.stubGlobal("confirm", () => true);
    setup([person(1, 1), person(2, 4), person(3, 4), person(4, 4), person(5, 4), person(6, 2)]);
    expect(row()).toEqual(["Person 1", "Person 6", "Person 2", "Person 3"]);
    await userEvent.click(screen.getByRole("button", { name: /^Person 6/ }));
    await userEvent.click(screen.getByRole("button", { name: "Remove Person 6" }));
    expect(row()).toEqual(["Person 1", "Add second holder", "Person 2", "Person 3"]);
    // The one before it on the row is selected now
    expect(screen.getByRole("button", { name: /^Person 1/ }).getAttribute("aria-pressed")).toBe("true");

    await userEvent.click(screen.getByRole("button", { name: "Remove Person 3" }));
    expect(row()).toEqual(["Person 1", "Add second holder", "Person 2", "Person 4"]);
    expect(screen.getByRole("button", { name: "People page 1 of 2" }).getAttribute("aria-current")).toBe("true");
  });

  it("removing from a later row stays on it", async () => {
    vi.stubGlobal("confirm", () => true);
    setup([person(1, 1), person(2, 2), person(3, 4), person(4, 4), person(5, 4), person(6, 4)]);
    await userEvent.click(screen.getByRole("button", { name: "Next people" }));
    await userEvent.click(screen.getByRole("button", { name: /^Person 6/ }));
    await userEvent.click(screen.getByRole("button", { name: "Remove Person 6" }));
    expect(row()).toEqual(["Person 5", "Add guarantor"]);
    expect(screen.getByRole("button", { name: /^Person 5/ }).getAttribute("aria-pressed")).toBe("true");
  });

  it("more than a row: paged, like the news gallery, the card to add in the last row's free place", async () => {
    setup([person(1, 1), person(2, 2), person(3, 4), person(4, 4), person(5, 4)]);
    expect(row()).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Previous people" })).toHaveProperty("disabled", true);
    // Its card is on the other row: in the head meanwhile
    expect(screen.getByRole("button", { name: /add guarantor/i })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Next people" }));
    expect(row()).toEqual(["Person 5", "Add guarantor"]);
    expect(screen.getByRole("button", { name: "People page 2 of 2" }).getAttribute("aria-current")).toBe("true");
  });
});
