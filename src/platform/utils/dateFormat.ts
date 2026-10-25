// Date format for typing and showing dates in fields (Settings → Appearance → Date format).
// Forms always exchange ISO dates (yyyy-MM-dd); the format is only what the user sees and types.

export const DATE_FORMATS = ["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"] as const;
export type DateFormat = (typeof DATE_FORMATS)[number];
export const DEFAULT_DATE_FORMAT: DateFormat = "dd/MM/yyyy";

/** A saved format, or the default when missing/unknown */
export const parseDateFormat = (value: unknown): DateFormat =>
  (DATE_FORMATS as readonly unknown[]).includes(value) ? (value as DateFormat) : DEFAULT_DATE_FORMAT;

type Part = "dd" | "MM" | "yyyy";

/** "dd/MM/yyyy" → parts in order + the separator */
function layout(format: DateFormat): { parts: Part[]; separator: string } {
  const separator = format.includes("/") ? "/" : "-";
  return { parts: format.split(separator) as Part[], separator };
}

/** "2026-10-05" (a time part is ignored) → "05/10/2026"; "" when there is no date */
export function formatDate(iso: string | null | undefined, format: DateFormat): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  if (!match) return "";
  const [, yyyy, MM, dd] = match;
  const values: Record<Part, string> = { dd, MM, yyyy };
  const { parts, separator } = layout(format);
  return parts.map((part) => values[part]).join(separator);
}

/** A complete, real date typed in `format` → "yyyy-MM-dd"; null otherwise (incomplete, 31/02…) */
export function parseDate(text: string, format: DateFormat): string | null {
  const { parts, separator } = layout(format);
  const pieces = text.trim().split(separator);
  if (pieces.length !== 3 || pieces.some((piece, i) => piece.length !== parts[i].length || !/^\d+$/.test(piece))) {
    return null;
  }
  const values = Object.fromEntries(parts.map((part, i) => [part, Number(pieces[i])])) as Record<Part, number>;
  const date = new Date(Date.UTC(values.yyyy, values.MM - 1, values.dd));
  const real =
    date.getUTCFullYear() === values.yyyy && date.getUTCMonth() === values.MM - 1 && date.getUTCDate() === values.dd;
  if (!real || values.yyyy < 1000) return null;
  return date.toISOString().slice(0, 10);
}

/** What is typed, reduced to digits and laid out in `format` (separators added as it fills) */
export function maskDate(typed: string, format: DateFormat): string {
  const { parts, separator } = layout(format);
  let digits = typed.replace(/\D/g, "");
  const out: string[] = [];
  for (const part of parts) {
    if (!digits) break;
    out.push(digits.slice(0, part.length));
    digits = digits.slice(part.length);
  }
  return out.join(separator);
}
