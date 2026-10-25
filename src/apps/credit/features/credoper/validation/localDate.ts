// Calendar dates as "yyyy-MM-dd" strings in local time. Comparing these strings
// compares days, so time zones and time parts can't shift "today".

export type LocalDate = string;

const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}/;

const pad = (n: number) => String(n).padStart(2, "0");

export function todayLocal(now: Date = new Date()): LocalDate {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** "2026-10-05T00:00:00" → "2026-10-05"; anything else → null. */
export function toLocalDate(value: string | null | undefined): LocalDate | null {
  if (!value || !LOCAL_DATE.test(value)) return null;
  return value.slice(0, 10);
}

/** Completed years on `today`. A Feb-29 birthday counts from Mar 1 on non-leap years. */
export function ageOn(birth: LocalDate, today: LocalDate): number {
  const [by, bm, bd] = birth.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  const hadBirthday = tm > bm || (tm === bm && td >= bd);
  return ty - by - (hadBirthday ? 0 : 1);
}
