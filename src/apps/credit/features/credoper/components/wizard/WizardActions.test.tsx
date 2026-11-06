// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import WizardActions from "./WizardActions";

const props = {
  isFirst: false,
  isLast: true,
  onBack: () => undefined,
  onNext: () => undefined,
  onSave: () => undefined,
  isSaving: false,
  showConvert: false,
  canConvert: false,
  onConvert: () => undefined,
  isConverting: false,
};

const button = (name: string | RegExp) => screen.getByRole("button", { name }) as HTMLButtonElement;

afterEach(cleanup);

describe("WizardActions", () => {
  it("Save is off while saving", () => {
    render(<WizardActions {...props} isSaving />);
    expect(button(/saving/i).disabled).toBe(true);
  });

  it("Save calls back", async () => {
    const onSave = vi.fn();
    render(<WizardActions {...props} onSave={onSave} />);
    await userEvent.click(button("Save"));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("carries the save's result and its sheet", () => {
    render(<WizardActions {...props} status={<span>Not saved</span>} sheet={<div>The messages</div>} />);
    expect(screen.getByText("Not saved")).toBeTruthy();
    expect(screen.getByText("The messages")).toBeTruthy();
  });

  it("is a bar of its own", () => {
    const { container } = render(<WizardActions {...props} />);
    expect(container.querySelector(".app-wizard-bar")).toBeTruthy();
  });

  describe("when Next is waiting for something", () => {
    const financial = { ...props, isLast: false };

    it("Next doesn't lead and says why, but still answers a click", async () => {
      const onNext = vi.fn();
      render(<WizardActions {...financial} onNext={onNext} nextBlocked nextHint="Calculate before moving on." />);
      expect(button(/Next/).className).not.toContain("btn-primary");
      expect(screen.getByRole("status").textContent).toContain("Calculate before moving on.");
      await userEvent.click(button(/Next/));
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it("otherwise Next leads", () => {
      render(<WizardActions {...financial} />);
      expect(button(/Next/).className).toContain("btn-primary");
    });

    it("has no Calculate of its own", () => {
      render(<WizardActions {...financial} nextBlocked />);
      expect(screen.queryByRole("button", { name: "Calculate" })).toBeNull();
    });
  });
});
