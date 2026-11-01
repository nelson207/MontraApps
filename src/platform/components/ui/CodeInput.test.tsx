// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CodeInput from "./CodeInput";

afterEach(cleanup);

function Harness({ onComplete }: { onComplete: (code: string) => void }) {
  const [code, setCode] = useState("");
  return <CodeInput label="Code" value={code} onChange={setCode} onComplete={onComplete} autoFocus />;
}

const boxes = () => screen.getAllByRole("textbox") as HTMLInputElement[];

describe("CodeInput", () => {
  it("typing fills the boxes one by one and completes on the last", async () => {
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    await userEvent.keyboard("123456");
    expect(boxes().map((b) => b.value).join("")).toBe("123456");
    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("only digits", async () => {
    render(<Harness onComplete={vi.fn()} />);
    await userEvent.keyboard("1a2");
    expect(boxes().map((b) => b.value).join("")).toBe("12");
  });

  it("Backspace clears back", async () => {
    render(<Harness onComplete={vi.fn()} />);
    await userEvent.keyboard("123{Backspace}{Backspace}");
    expect(boxes().map((b) => b.value).join("")).toBe("1");
    expect(document.activeElement).toBe(boxes()[1]);
  });

  it("a pasted code fills them all", () => {
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    fireEvent.paste(boxes()[0], { clipboardData: { getData: () => " 654 321 " } });
    expect(boxes().map((b) => b.value).join("")).toBe("654321");
    expect(onComplete).toHaveBeenCalledWith("654321");
  });
});
