import { useEffect, useState } from "react";
import type { FactoringAdvanceSummaryDto } from "@platform/api/generated/MontraPOSApi";
import { useDebouncedValue } from "@platform/hooks/useDebouncedValue";
import { useReadAdvanceSummaryMutation } from "../api/factoringApi";

export const SUMMARY_DEBOUNCE_MS = 500;

export type SummaryInput = { contractId: string; documentIds: string[]; amount: number; valueDate: string };

type Answer = { key: string; data?: FactoringAdvanceSummaryDto; error?: unknown };

/**
 * The cost of a confirming advance for these inputs (null: not complete yet). An answer only counts
 * for the inputs it was asked for: a late answer about an older selection is never shown.
 */
export function useAdvanceSummary(input: SummaryInput | null) {
  const [read] = useReadAdvanceSummaryMutation();
  const [answer, setAnswer] = useState<Answer | null>(null);
  const key = input ? JSON.stringify(input) : null;
  const debounced = useDebouncedValue(key, SUMMARY_DEBOUNCE_MS);

  useEffect(() => {
    if (!debounced) return;
    const { contractId, ...body } = JSON.parse(debounced) as SummaryInput;
    const request = read({ contractId, body });
    let cancelled = false;
    request.unwrap().then(
      (data) => {
        if (!cancelled) setAnswer({ key: debounced, data });
      },
      (error: unknown) => {
        if (!cancelled) setAnswer({ key: debounced, error });
      },
    );
    return () => {
      cancelled = true;
      request.abort();
    };
  }, [debounced, read]);

  const current = key && answer?.key === key ? answer : null;
  return { isLoading: !!key && !current, summary: current?.data ?? null, error: current?.error ?? null };
}
