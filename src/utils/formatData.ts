export function formatDate(value?: string | Date | null): string {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(navigator.language).format(date);
}
