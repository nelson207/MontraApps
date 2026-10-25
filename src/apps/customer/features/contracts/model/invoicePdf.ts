import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPE_LABELS, formatDate, formatEuro, type InvoiceDocument } from "./contracts";

// A one-page PDF of an invoiced document, built by hand (PDF 1.4, the standard Helvetica fonts,
// WinAnsi text): used when the API has no PDF to give (development samples). The real document
// comes from the API (GET …/Documents/{id}/Pdf).

type Context = { contractNumber: string; customerName: string; lender: string };

/** Text as PDF string bytes: WinAnsi, with "€" at 0x80 and anything else unknown as "?" */
const winAnsi = (text: string) =>
  [...text.replace(/[\u00a0\u202f]/g, " ")]
    .map((c) => (c === "€" ? "\x80" : c.charCodeAt(0) < 256 ? c : "?"))
    .join("");

const escape = (text: string) => winAnsi(text).replace(/[\\()]/g, (c) => `\\${c}`);

type Line = { x: number; y: number; text: string; size?: number; bold?: boolean; right?: boolean };

// Helvetica is ~0.5em per character on average: enough to right-align short amounts
const approxWidth = (text: string, size: number) => text.length * size * 0.5;

function content(lines: Line[], rules: number[]): string {
  const text = lines.map(({ x, y, text, size = 10, bold = false, right = false }) => {
    const left = right ? x - approxWidth(text, size) : x;
    return `BT /${bold ? "F2" : "F1"} ${size} Tf 1 0 0 1 ${left.toFixed(1)} ${y} Tm (${escape(text)}) Tj ET`;
  });
  const strokes = rules.map((y) => `0.8 G 0.5 w 50 ${y} m 545 ${y} l S`);
  return [...strokes, "0 g", ...text].join("\n");
}

export function invoicePdf(doc: InvoiceDocument, { contractNumber, customerName, lender }: Context): Uint8Array {
  const lines: Line[] = [
    { x: 50, y: 780, text: lender, size: 16, bold: true },
    { x: 545, y: 780, text: DOCUMENT_TYPE_LABELS[doc.type].toUpperCase(), size: 16, bold: true, right: true },
    { x: 545, y: 762, text: doc.number, size: 11, right: true },

    { x: 50, y: 720, text: "Customer", size: 9 },
    { x: 50, y: 706, text: customerName, size: 11, bold: true },
    { x: 50, y: 690, text: `Contract ${contractNumber}`, size: 10 },

    { x: 330, y: 720, text: "Issue date", size: 9 },
    { x: 330, y: 706, text: formatDate(doc.issueDate), size: 11 },
    { x: 445, y: 720, text: "Due date", size: 9 },
    { x: 445, y: 706, text: formatDate(doc.dueDate), size: 11 },
    { x: 330, y: 690, text: `Status: ${DOCUMENT_STATUS_LABELS[doc.status]}`, size: 10 },

    { x: 50, y: 650, text: doc.description, size: 11, bold: true },
    { x: 50, y: 620, text: "Description", size: 9, bold: true },
    { x: 420, y: 620, text: "VAT", size: 9, bold: true, right: true },
    { x: 545, y: 620, text: "Amount", size: 9, bold: true, right: true },
  ];

  let y = 600;
  for (const line of doc.lines) {
    lines.push(
      { x: 50, y, text: line.description },
      { x: 420, y, text: line.taxRate ? `${line.taxRate}%` : "Exempt", right: true },
      { x: 545, y, text: formatEuro(line.net), right: true },
    );
    y -= 18;
  }

  const totalsTop = y - 14;
  lines.push(
    { x: 400, y: totalsTop, text: "Net" },
    { x: 545, y: totalsTop, text: formatEuro(doc.net), right: true },
    { x: 400, y: totalsTop - 18, text: "VAT" },
    { x: 545, y: totalsTop - 18, text: formatEuro(doc.tax), right: true },
    { x: 400, y: totalsTop - 40, text: "Total", size: 12, bold: true },
    { x: 545, y: totalsTop - 40, text: formatEuro(doc.total), size: 12, bold: true, right: true },
    { x: 50, y: 60, text: `${lender} · Document issued through Montra Customer`, size: 8 },
  );

  const stream = content(lines, [740, 630, y + 6, totalsTop - 26]);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];

  // Every character is one byte, so string offsets are byte offsets
  let pdf = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n";
  const offsets = objects.map((body, i) => {
    const offset = pdf.length;
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

  return Uint8Array.from(pdf, (c) => c.charCodeAt(0));
}
