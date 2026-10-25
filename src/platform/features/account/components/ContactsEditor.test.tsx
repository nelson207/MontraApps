// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { newEmail, validateContacts, type ContactsDraft } from "../contactDetails";
import ContactsEditor from "./ContactsEditor";

afterEach(cleanup);

function Editor() {
  const [value, setValue] = useState<ContactsDraft>({ emails: [newEmail(true)], phones: [], addresses: [] });
  return (
    <ContactsEditor value={value} onChange={setValue} errors={validateContacts(value)} showErrors={false} countries={[]} lists={["emails"]} idPrefix="t" />
  );
}

describe("ContactsEditor e-mails", () => {
  it("are validated as soon as the field is left, not while typing", () => {
    render(<Editor />);
    const input = screen.getByLabelText("E-mail address");

    fireEvent.change(input, { target: { value: "ana@" } });
    expect(screen.queryByText("Enter a valid e-mail address.")).toBeNull();

    fireEvent.blur(input);
    expect(screen.getByText("Enter a valid e-mail address.")).toBeTruthy();
    expect(input.getAttribute("class")).toContain("is-invalid");

    // Fixed: the message goes at once
    fireEvent.change(input, { target: { value: "ana@example.com" } });
    expect(screen.queryByText("Enter a valid e-mail address.")).toBeNull();
  });
});
