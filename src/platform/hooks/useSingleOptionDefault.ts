import { useEffect, useRef } from "react";

// The rule of every Montra app: when something has to be chosen and there is only one option, it is
// chosen by default. SelectField applies it to every select; pickers built another way (radio cards)
// call this directly.

/** A few tries, in case a form's setter was overwritten; a form that refuses the value isn't asked forever */
const MAX_TRIES = 3;

/**
 * Selects `only` (the single option of an empty field; null when that isn't the case). It is checked
 * after every render, not only when `only` changes: two fields selecting at once may save from the
 * same snapshot of the form, one overwriting the other, and the one lost has to try again.
 */
export function useSingleOptionDefault<T extends string | number>(only: T | null, select: (value: T) => void): void {
  const tried = useRef<{ value: T | null; count: number }>({ value: null, count: 0 });

  useEffect(() => {
    if (only === null) {
      tried.current = { value: null, count: 0 };
      return;
    }
    if (tried.current.value !== only) tried.current = { value: only, count: 0 };
    if (tried.current.count >= MAX_TRIES) return;
    tried.current.count += 1;
    select(only);
  });
}
