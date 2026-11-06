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
  store.dispatch(startNew({ credOperStep: 2, credOperClassification: 1, insurances: [], interventions: people }));
  const formProps = { options: { credOperClassifications: [], financialProducts: [] }, fetchingOptions: {} };
  render(
    <Provider store={store}>
      <InterventionsStep {...({ errors: {}, formProps } as unknown as StepProps)} />
    </Provider>,
  );
  return store;
}

/** Remove them, and say yes */
const removePerson = async (name: string) => {
  await userEvent.click(screen.getByRole("button", { name: `Remove ${name}` }));
  await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: /^Remove / }));
};

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
    setup([person(1, 1), person(2, 4), person(3, 4), person(4, 4), person(5, 4), person(6, 2)]);
    expect(row()).toEqual(["Person 1", "Person 6", "Person 2", "Person 3"]);
    await userEvent.click(screen.getByRole("button", { name: /^Person 6/ }));
    await removePerson("Person 6");
    expect(row()).toEqual(["Person 1", "Add second holder", "Person 2", "Person 3"]);
    // The one before it on the row is selected now
    expect(screen.getByRole("button", { name: /^Person 1/ }).getAttribute("aria-pressed")).toBe("true");

    await removePerson("Person 3");
    expect(row()).toEqual(["Person 1", "Add second holder", "Person 2", "Person 4"]);
    expect(screen.getByRole("button", { name: "People page 1 of 2" }).getAttribute("aria-current")).toBe("true");
  });

  it("removing from a later row stays on it", async () => {
    setup([person(1, 1), person(2, 2), person(3, 4), person(4, 4), person(5, 4), person(6, 4)]);
    await userEvent.click(screen.getByRole("button", { name: "Next people" }));
    await userEvent.click(screen.getByRole("button", { name: /^Person 6/ }));
    await removePerson("Person 6");
    expect(row()).toEqual(["Person 5", "Add guarantor"]);
    expect(screen.getByRole("button", { name: /^Person 5/ }).getAttribute("aria-pressed")).toBe("true");
  });

  it.each([
    ["guarantor", 4, "Keep guarantor", "Remove guarantor"],
    ["second holder", 2, "Keep second holder", "Remove second holder"],
  ])("removing a %s asks first, in the app's own box, with keeping them ready to press", async (_, type, keep, confirm) => {
    const browserConfirm = vi.fn(() => true);
    vi.stubGlobal("confirm", browserConfirm);
    const store = setup([person(1, 1), person(2, type)]);
    const before = store.getState().credoper;

    const opener = screen.getByRole("button", { name: "Remove Person 2" });
    await userEvent.click(opener);
    const dialog = screen.getByRole("alertdialog", { name: "Remove Person 2?" });
    expect(dialog.textContent).toContain("Person 2 will be taken off this proposal");
    expect(within(dialog).getByRole("button", { name: confirm })).toBeTruthy();
    expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: keep }));
    expect(browserConfirm).not.toHaveBeenCalled();
    expect(store.getState().credoper).toEqual(before);

    // Not removed: as it was, and back on the button
    await userEvent.click(within(dialog).getByRole("button", { name: keep }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(store.getState().credoper).toEqual(before);
    expect(document.activeElement).toBe(opener);

    await userEvent.click(opener);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(store.getState().credoper).toEqual(before);

    await removePerson("Person 2");
    expect(store.getState().credoper.data?.interventions?.map((p) => p.correlationID)).toEqual(["p1"]);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("someone with no name yet: the box says what they are", async () => {
    setup([person(1, 1), { correlationID: "p2", credOperIntervType: 4, entity: {}, person: {} }]);
    await userEvent.click(screen.getByRole("button", { name: /^Remove / }));
    expect(screen.getByRole("alertdialog", { name: "Remove this guarantor?" }).textContent).toContain("This guarantor will be taken off");
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
