// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SelectFieldProps } from "./fieldProps";
import SelectField from "./SelectField";

Element.prototype.scrollIntoView = () => undefined; // jsdom has none

const ONE = [{ value: 7, label: "Only" }];
const TWO = [...ONE, { value: 8, label: "Other" }];

function setup(props: Partial<SelectFieldProps> = {}) {
  const onChange = vi.fn();
  const view = render(<SelectField id="f" value={undefined} options={ONE} onChange={onChange} {...props} />);
  return { onChange, ...view };
}

afterEach(cleanup);

describe("only one option: selected by default", () => {
  it("an empty field selects it", () => {
    const { onChange } = setup();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ target: { value: "7" } });
  });

  it.each([[null], [""]])("%j counts as empty", (value) => expect(setup({ value }).onChange).toHaveBeenCalled());

  it("one left among disabled ones is the only choice", () =>
    expect(setup({ options: [{ value: 1, label: "No", disabled: true }, ...ONE] }).onChange).toHaveBeenCalledWith({ target: { value: "7" } }));

  it("as soon as the list arrives", () => {
    const { onChange, rerender } = setup({ options: [], isLoading: true });
    expect(onChange).not.toHaveBeenCalled();
    rerender(<SelectField id="f" value={undefined} options={ONE} onChange={onChange} />);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("again when the form empties it", () => {
    function Form() {
      const [value, setValue] = useState<string | undefined>(undefined);
      return (
        <>
          <SelectField id="f" value={value} options={ONE} onChange={(e) => setValue(e.target.value)} />
          <button onClick={() => setValue(undefined)}>clear</button>
          <output>{value ?? "empty"}</output>
        </>
      );
    }
    render(<Form />);
    expect(screen.getByRole("status").textContent).toBe("7");
    fireEvent.click(screen.getByRole("button", { name: "clear" }));
    expect(screen.getByRole("status").textContent).toBe("7");
  });

  it("the choice can be seen on the field", () => {
    function Form() {
      const [value, setValue] = useState<string>();
      return <SelectField id="f" value={value} options={ONE} onChange={(e) => setValue(e.target.value)} />;
    }
    render(<Form />);
    expect(document.getElementById("f")?.textContent).toContain("Only");
  });
});

describe("left alone", () => {
  it.each<[string, Partial<SelectFieldProps>]>([
    ["several options", { options: TWO }],
    ["no options", { options: [] }],
    ["already chosen", { value: 7 }],
    ["0 is a value", { value: 0 }],
    ["disabled", { disabled: true }],
    ["hidden", { visible: false }],
    ["still loading", { isLoading: true }],
    ["more pages to come", { hasMore: true }],
    ["loading more", { isLoadingMore: true }],
    ["the only option can't be chosen", { options: [{ value: 7, label: "No", disabled: true }] }],
    ["the only option is 'nothing'", { options: [{ value: "", label: "All" }] }],
  ])("%s", (_, props) => expect(setup(props).onChange).not.toHaveBeenCalled());

  it("one result of a search isn't the only option", async () => {
    const onChange = vi.fn();
    const onSearchChange = vi.fn();
    const field = (options = TWO) => <SelectField id="f" value={undefined} options={options} onChange={onChange} onSearchChange={onSearchChange} />;
    const { rerender } = render(field());
    fireEvent.click(document.getElementById("f") as HTMLElement);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "on" } });
    expect(onSearchChange).toHaveBeenLastCalledWith("on");
    rerender(field(ONE));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("a form that refuses the value isn't asked forever", () => {
    function Stubborn() {
      const [, render] = useState(0);
      return <SelectField id="f" value={undefined} options={ONE} onChange={() => { calls.count += 1; render((n) => n + 1); }} />;
    }
    const calls = { count: 0 };
    render(<Stubborn />);
    expect(calls.count).toBe(3);
  });
});

describe("two fields at once", () => {
  it("a form saving from one snapshot loses neither", () => {
    // Like Credit's setters: each change is written over the values this render saw
    function Form() {
      const [form, setForm] = useState<{ a?: string; b?: string }>({});
      return (
        <>
          <SelectField id="a" value={form.a} options={ONE} onChange={(e) => setForm({ ...form, a: e.target.value })} />
          <SelectField id="b" value={form.b} options={[{ value: 9, label: "B" }]} onChange={(e) => setForm({ ...form, b: e.target.value })} />
          <output>{JSON.stringify(form)}</output>
        </>
      );
    }
    render(<Form />);
    expect(JSON.parse(screen.getByRole("status").textContent ?? "")).toEqual({ a: "7", b: "9" });
  });
});
