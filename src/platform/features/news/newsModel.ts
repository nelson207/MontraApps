import type { NewsDto } from "@platform/api/generated/MontraPOSApi";

// View model for news + pure helpers shared by every news view.

/** From the validity dates: not started yet / current / ended */
export type NewsStatus = "scheduled" | "active" | "expired";

export type NewsItem = {
  /** The API's opaque id (a string token): compare and send back as is */
  id: string;
  title: string;
  subtitle: string;
  body: string;
  category: string;
  publishedAt: Date | null;
  expiresAt: Date | null;
  /** A direct picture link (sample news); API news load theirs by id (GET /api/news/{id}/image) */
  image: string | null;
  /** "Read more" link of the news, if any */
  linkUrl: string | null;
  status: NewsStatus;
};

export const DEFAULT_CATEGORY = "General";

const toDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function statusOf(publishedAt: Date | null, expiresAt: Date | null, now = new Date()): NewsStatus {
  if (publishedAt && publishedAt > now) return "scheduled";
  if (expiresAt && expiresAt < now) return "expired";
  return "active";
}

/** The news type's name: from the news types, "Type n" when unknown, DEFAULT_CATEGORY when none */
const categoryOf = (typeId: number | null | undefined, typeNames: Map<number, string>) =>
  typeId == null ? DEFAULT_CATEGORY : (typeNames.get(typeId)?.trim() || `Type ${typeId}`);

/**
 * The "Read more" link as typed in the back office, or null when it isn't a web address:
 * only http(s) (no javascript:, mailto:, file paths…); a bare "www.…" gets https://. Anything
 * else would be taken as a path inside the app and lead nowhere, so no button is shown.
 */
export function webLink(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (!text) return null;
  const candidate = /^www[.]/i.test(text) ? `https://${text}` : text;
  try {
    const url = new URL(candidate);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".") ? url.href : null;
  } catch {
    return null;
  }
}

/** API → view model. Items without an id or title can't be shown or linked, so they're dropped. */
export function toNewsItem(
  dto: NewsDto & { image?: string | null },
  typeNames: Map<number, string>,
  now = new Date(),
): NewsItem | null {
  if (typeof dto.id !== "string" || !dto.id || !dto.title?.trim()) return null;
  const publishedAt = toDate(dto.validityBeginDate);
  const expiresAt = toDate(dto.validityEndDate);
  return {
    id: dto.id,
    title: dto.title.trim(),
    subtitle: dto.subtitle?.trim() ?? "",
    body: dto.body?.trim() ?? "",
    category: categoryOf(dto.newsTypeId, typeNames),
    publishedAt,
    expiresAt,
    image: dto.image?.trim() || null,
    linkUrl: webLink(dto.linkUrl),
    status: statusOf(publishedAt, expiresAt, now),
  };
}

/** Newest first; undated items last. */
export const byNewest = (a: NewsItem, b: NewsItem) =>
  (b.publishedAt?.getTime() ?? -Infinity) - (a.publishedAt?.getTime() ?? -Infinity);

// --- Text --------------------------------------------------------------------

/** Accent- and case-insensitive form of one character (keeps a 1:1 index map). */
const foldChar = (ch: string) => ch.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().charAt(0) || ch;

export const fold = (text: string) => [...text].map(foldChar).join("");

export function matchesSearch(item: NewsItem, query: string): boolean {
  const q = fold(query.trim());
  if (!q) return true;
  return fold(`${item.title} ${item.subtitle} ${item.body} ${item.category}`).includes(q);
}

/** [start, end) ranges of `query` in `text`, accent-insensitive, for highlighting. */
export function matchRanges(text: string, query: string): [number, number][] {
  const q = fold(query.trim());
  if (!q) return [];
  const chars = [...text];
  const folded = chars.map(foldChar).join("");
  const ranges: [number, number][] = [];
  for (let i = folded.indexOf(q); i !== -1; i = folded.indexOf(q, i + q.length)) {
    ranges.push([i, i + q.length]);
  }
  return ranges;
}

/** A short piece of `text` around the first match of `query`, or null if it doesn't match. */
export function snippetAround(text: string, query: string, radius = 70): string | null {
  const [first] = matchRanges(text, query);
  if (!first) return null;
  const chars = [...text];
  const start = Math.max(0, first[0] - radius);
  const end = Math.min(chars.length, first[1] + radius);
  return `${start > 0 ? "…" : ""}${chars.slice(start, end).join("").trim()}${end < chars.length ? "…" : ""}`;
}

export function excerpt(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), maxLength * 0.8)).trimEnd()}…`;
}

/** Body text as paragraphs (blank-line separated; single line breaks kept inside). */
export const paragraphs = (body: string) =>
  body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

const dateFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });

export const formatNewsDate = (date: Date | null) => (date ? dateFormat.format(date) : "—");

// --- Presentation ------------------------------------------------------------

const CATEGORY_ICONS: [RegExp, string][] = [
  [/product|produto/i, "bi-box-seam"],
  [/campaign|campanha|promo/i, "bi-megaphone"],
  [/compliance|regula|legal/i, "bi-shield-check"],
  [/system|sistema|maintenance|release/i, "bi-gear"],
  [/training|formação|formacao/i, "bi-mortarboard"],
];

export const categoryIcon = (category: string) =>
  CATEGORY_ICONS.find(([pattern]) => pattern.test(category))?.[1] ?? "bi-newspaper";

export const STATUS_LABELS: Record<NewsStatus, string> = {
  scheduled: "Scheduled",
  active: "Active",
  expired: "Expired",
};
