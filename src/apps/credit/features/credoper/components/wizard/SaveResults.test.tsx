// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { operationMessages, opensAfterSave, type SaveOutcome } from "../../model/operationMessages";
import { MessageGroups, SaveSheet, SaveStatus } from "./SaveResults";

afterEach(cleanup);

const ERROR = { severity: "Error", text: "The term is too long." };
const SAVE_ERROR = { severity: "Error", text: "The document expired." };
const WARNING = { severity: "Warning", text: "Manual analysis will be needed." };
const NOTE = { severity: "Info", text: "Valid for 30 days." };

const refused: SaveOutcome = {
  saved: false,
  revision: 1,
  messages: operationMessages({ save: [SAVE_ERROR, NOTE], calculation: [ERROR, WARNING] }),
};
const saved = (save: { severity: string; text: string }[] = []): SaveOutcome => ({
  saved: true,
  revision: 1,
  messages: operationMessages({ save }),
});
const failed: SaveOutcome = { saved: false, revision: 1, messages: [], error: { status: 409 } };

const base = { title: "Quotation #1042", stage: "quotation" as const, stale: false };
const sheet = { ...base, onHide: () => undefined };
const status = { ...base, open: false, onToggle: () => undefined };

describe("opensAfterSave", () => {
  it("opens when there's something to act on or review", () => {
    expect(opensAfterSave(refused)).toBe(true);
    expect(opensAfterSave(failed)).toBe(true);
    expect(opensAfterSave(saved([WARNING]))).toBe(true);
  });

  it("stays hidden when there's nothing the user needs to do", () => {
    expect(opensAfterSave(saved([NOTE]))).toBe(false);
    expect(opensAfterSave(saved())).toBe(false);
  });
});

describe("SaveSheet", () => {
  it("a refused save leads with not saved, alerts, and says how many errors to fix", () => {
    render(<SaveSheet {...sheet} outcome={refused} />);
    const panel = screen.getByRole("alert");
    expect(panel.textContent).toContain("Not saved");
    expect(panel.textContent).toContain("Fix 2 errors and save again.");
  });

  it("lists every message on its own, under its level", () => {
    render(<SaveSheet {...sheet} outcome={refused} />);
    expect(screen.getByText("2 errors to fix")).toBeTruthy();
    expect(screen.getByText("1 warning to review")).toBeTruthy();
    expect(screen.getByText("1 note")).toBeTruthy();
    for (const { text } of [ERROR, SAVE_ERROR, WARNING, NOTE]) expect(screen.getByText(text)).toBeTruthy();
  });

  it("a request that failed says why and offers its action", async () => {
    const reopen = vi.fn();
    render(<SaveSheet {...sheet} outcome={failed} failure="Changed by someone else." action={{ label: "Reopen", onClick: reopen }} />);
    expect(screen.getByRole("alert").textContent).toContain("Changed by someone else.");
    await userEvent.click(screen.getByRole("button", { name: "Reopen" }));
    expect(reopen).toHaveBeenCalledTimes(1);
  });

  it("the action is off while it runs", () => {
    render(<SaveSheet {...sheet} outcome={failed} action={{ label: "Reopen", onClick: vi.fn(), busy: true }} />);
    expect((screen.getByRole("button", { name: "Reopen" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("refused with no errors listed still says it wasn't saved", () => {
    render(<SaveSheet {...sheet} outcome={{ saved: false, revision: 1, messages: operationMessages({ save: [WARNING] }) }} />);
    expect(screen.getByRole("alert").textContent).toContain("couldn't be saved");
  });

  it("a save with warnings is a saved operation, not a failure", () => {
    render(<SaveSheet {...sheet} outcome={saved([WARNING])} />);
    const panel = screen.getByRole("status");
    expect(panel.textContent).toContain("Quotation #1042 saved");
    expect(panel.textContent).toContain("Review 1 warning before you convert it to a proposal.");
    expect(panel.textContent).not.toContain("Not saved");
  });

  it("a proposal isn't told about converting", () => {
    render(<SaveSheet {...sheet} stage="proposal" title="Proposal #7" outcome={saved([WARNING])} />);
    expect(screen.getByRole("status").textContent).toContain("Review 1 warning.");
    expect(screen.getByRole("status").textContent).not.toContain("convert");
  });

  it("keeps the messages after an edit, and says they're from before it", () => {
    render(<SaveSheet {...sheet} stale outcome={refused} />);
    expect(screen.getByText(ERROR.text)).toBeTruthy();
    expect(screen.getByText(/Save again to update these results/)).toBeTruthy();
  });

  it("can be focused once a save answers", () => {
    render(<SaveSheet {...sheet} outcome={refused} />);
    expect(screen.getByRole("alert").getAttribute("tabindex")).toBe("-1");
    expect(screen.getByRole("alert").id).toBe("save-results");
  });

  it("hides with its button", async () => {
    const hide = vi.fn();
    render(<SaveSheet {...sheet} onHide={hide} outcome={refused} />);
    await userEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(hide).toHaveBeenCalledTimes(1);
  });

  it("hides with Esc while focus is inside it", async () => {
    const hide = vi.fn();
    render(<SaveSheet {...sheet} onHide={hide} outcome={refused} />);
    screen.getByRole("alert").focus();
    await userEvent.keyboard("{Escape}");
    expect(hide).toHaveBeenCalledTimes(1);
  });
});

describe("SaveStatus", () => {
  it("says the result and shows or hides the sheet", async () => {
    const toggle = vi.fn();
    render(<SaveStatus {...status} onToggle={toggle} outcome={refused} />);
    const button = screen.getByRole("button", { name: /Not saved: 2 errors, 1 warning/ });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    await userEvent.click(button);
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it("names the sheet it controls only while that's on the page", () => {
    const { rerender } = render(<SaveStatus {...status} outcome={refused} />);
    expect(screen.getByRole("button").getAttribute("aria-controls")).toBeNull();
    rerender(<SaveStatus {...status} open outcome={refused} />);
    expect(screen.getByRole("button").getAttribute("aria-controls")).toBe("save-results");
  });

  it("a saved operation with warnings reads as saved", () => {
    render(<SaveStatus {...status} outcome={saved([WARNING])} />);
    expect(screen.getByRole("button", { name: /^Saved: 1 warning/ })).toBeTruthy();
  });

  it("a saved operation with notes reads as saved", () => {
    render(<SaveStatus {...status} outcome={saved([NOTE])} />);
    expect(screen.getByRole("button", { name: /^Saved: 1 note/ })).toBeTruthy();
  });

  it("a clean save has nothing to open", () => {
    render(<SaveStatus {...status} outcome={saved()} />);
    expect(screen.getByRole("status").textContent).toContain("Quotation #1042 saved");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("a clean save can still take focus: Save was off while saving, so focus needs somewhere to go", () => {
    render(<SaveStatus {...status} outcome={saved()} />);
    expect(screen.getByRole("status").id).toBe("save-status");
    expect(screen.getByRole("status").getAttribute("tabindex")).toBe("-1");
  });

  it("a clean save edited since has nothing left to say", () => {
    const { container } = render(<SaveStatus {...status} stale outcome={saved()} />);
    expect(container.textContent).toBe("");
  });

  it("says when the result is from before the latest changes", () => {
    render(<SaveStatus {...status} stale outcome={refused} />);
    expect(screen.getByRole("button", { name: /before your latest changes/ })).toBeTruthy();
  });

  it("a failed request reads as not saved", () => {
    render(<SaveStatus {...status} outcome={failed} />);
    expect(screen.getByRole("button", { name: /^Not saved/ })).toBeTruthy();
  });
});

describe("MessageGroups", () => {
  const isOpen = (text: string) => (screen.getByText(text).closest("details") as HTMLDetailsElement).open;

  it("collapses notes beside errors or warnings", () => {
    render(<MessageGroups messages={operationMessages({ save: [WARNING, NOTE] })} />);
    expect(isOpen("1 note")).toBe(false);
  });

  it("opens notes when they are all there is", () => {
    render(<MessageGroups messages={operationMessages({ save: [NOTE] })} />);
    expect(isOpen("1 note")).toBe(true);
  });

  it("links only calculation messages to Financial data", async () => {
    const go = vi.fn();
    render(<MessageGroups messages={operationMessages({ save: [SAVE_ERROR], calculation: [ERROR] })} onGoToFinancial={go} />);
    const links = screen.getAllByRole("button", { name: "Go to Financial data" });
    expect(links).toHaveLength(1);
    expect(links[0].closest("li")?.textContent).toContain(ERROR.text);
    await userEvent.click(links[0]);
    expect(go).toHaveBeenCalledTimes(1);
  });

  it("offers no link where there's no Financial data to go to", () => {
    render(<MessageGroups messages={operationMessages({ calculation: [ERROR] })} />);
    expect(screen.queryByRole("button", { name: "Go to Financial data" })).toBeNull();
  });
});
