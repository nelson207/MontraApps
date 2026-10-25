import { ageOn, toLocalDate, type LocalDate } from "./localDate";

// Date checks against today. Empty or unparseable values return null:
// whether a value is required is the field rules' job (fieldRules.ts).

export const ADULT_AGE = 18;

export function notAfterToday(value: string | null | undefined, today: LocalDate, label: string): string | null {
  const date = toLocalDate(value);
  return date && date > today ? `${label} can't be in the future.` : null;
}

export function notBeforeToday(value: string | null | undefined, today: LocalDate, label: string): string | null {
  const date = toLocalDate(value);
  return date && date < today ? `${label} has expired.` : null;
}

export function isAdult(birth: string | null | undefined, today: LocalDate): string | null {
  const date = toLocalDate(birth);
  if (!date) return null;
  if (date > today) return "Birth date can't be in the future.";
  return ageOn(date, today) < ADULT_AGE ? `Must be at least ${ADULT_AGE} years old.` : null;
}
