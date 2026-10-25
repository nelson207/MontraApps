import { describe, expect, it } from "vitest";
import type { CredOperDraft } from "../model/credOperDraft";
import { validateCustomer } from "./customerRules";

const today = "2026-10-05";
const required = (jsonName: string, isVisible = true) => ({ jsonName, isRequired: true, isVisible, isReadOnly: false });

const validOperation = (): CredOperDraft => ({
  customerName: "Ana Silva",
  metadataResponse: [required("customerName")],
  insurances: [],
});

describe("customer step", () => {
  it("a valid customer has no errors", () => {
    expect(validateCustomer(validOperation(), today)).toEqual({});
  });

  it("required customer name", () => {
    const op = { ...validOperation(), customerName: "" };
    expect(validateCustomer(op, today)).toEqual({ customerName: "This field is required." });
  });

  it("hidden required field is not validated", () => {
    const op = { ...validOperation(), customerName: "", metadataResponse: [required("customerName", false)] };
    expect(validateCustomer(op, today)).toEqual({});
  });

  it("invalid e-mail format", () => {
    const op = { ...validOperation(), customerEmail: { email: "ana@" } };
    expect(validateCustomer(op, today)["customerEmail.email"]).toBe("Enter a valid e-mail address.");
  });
});
