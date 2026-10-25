import { describe, expect, it } from "vitest";
import { invoicePdf } from "./invoicePdf";
import type { InvoiceDocument } from "./contracts";

const DOC: InvoiceDocument = {
  id: 7,
  number: "FT 2026/0042",
  type: "invoice",
  issueDate: "2026-09-25",
  dueDate: "2026-10-15",
  description: "Installment 21 of 60",
  installment: 21,
  lines: [
    { description: "Principal", net: 305.12 },
    { description: "Interest (contract (C-1))", net: 72.38 },
    { description: "Processing fee", net: 2.5, taxRate: 23 },
  ],
  net: 380,
  tax: 0.58,
  total: 380.58,
  status: "open",
};

const text = (bytes: Uint8Array) => new TextDecoder("latin1").decode(bytes);

describe("invoicePdf", () => {
  const pdf = text(invoicePdf(DOC, { contractNumber: "C-1", customerName: "Ana Silva", lender: "Montra Finance" }));

  it("is a PDF document with the invoice's figures", () => {
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(pdf).toContain("FT 2026/0042");
    expect(pdf).toContain("Ana Silva");
    expect(pdf).toContain("380,58");
  });

  it("escapes parentheses in the text", () => expect(pdf).toContain("Interest \\(contract \\(C-1\\)\\)"));

  it("its cross-reference table points at each object", () => {
    // The table itself (not the "xref" inside "startxref")
    const at = pdf.lastIndexOf("\nxref\n") + 1;
    const xref = pdf.slice(at);
    const offsets = [...xref.matchAll(/^(\d{10}) 00000 n/gm)].map((m) => Number(m[1]));
    expect(offsets.length).toBeGreaterThan(3);
    offsets.forEach((offset, i) => expect(pdf.slice(offset, offset + 10)).toMatch(new RegExp(`^${i + 1} 0 obj`)));
    expect(Number(pdf.match(/startxref\s+(\d+)/)![1])).toBe(at);
  });
});
