// Shared results view (Tasks, News, Users, searches): the rules every list applies.

/** Colour of a row's accent bar or of a chip when on (styles: platform/styles/results.scss) */
export type Tone = "primary" | "secondary" | "success" | "info" | "warning" | "orange" | "danger";

/** Chip click: add/remove `value`; with `only`, select just `value` */
export function toggleChip(selected: string[], value: string, only: boolean): string[] {
  if (only) return [value];
  return selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
}

/** The page clamped to the existing ones, and the 1-based range it shows ("21–23 of 23") */
export function pageRange(page: number, pageSize: number, total: number) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const first = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const last = Math.min(current * pageSize, total);
  return { page: current, pageCount, first, last };
}

/** The items of one page (a page beyond the last shows the last) */
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const { page: current } = pageRange(page, pageSize, items.length);
  return items.slice((current - 1) * pageSize, current * pageSize);
}
