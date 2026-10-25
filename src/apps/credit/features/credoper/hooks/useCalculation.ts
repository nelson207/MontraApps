import { useState } from "react";
import { selectCredoperRevision, useAppDispatch, useAppSelector } from "@credit/store";
import { useCalculateCredOper } from "../api/credOperApi";
import { DEFAULT_TERM_RESTRICTIONS } from "../constants";
import { setCredoper, updateConditionAt } from "../credoperSlice";
import type { CredOperDraft } from "../model/credOperDraft";

export const money = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });
export const percent = (value?: number | null) =>
  value == null ? "—" : `${value.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;

/** The inputs a calculation depends on; when they change, shown results are outdated. */
const calculationInputs = (op: CredOperDraft) =>
  JSON.stringify([
    op.amount,
    op.financialProduct,
    op.conditions?.[0]?.term,
    op.assets?.[0]?.equipment?.netAmount,
    op.assets?.[0]?.equipment?.retakeAmount,
    op.assets?.[0]?.equipment?.retakePercentage,
  ]);

/** Calculate + term stepper shared by the side panel and the Summary step. */
export function useCalculation(operation: CredOperDraft) {
  const dispatch = useAppDispatch();
  const revision = useAppSelector(selectCredoperRevision);
  // New API: POST /api/credit-operations/calculate-credoper (answer merged over the draft)
  const [calculate, { isLoading, error: requestError, reset }] = useCalculateCredOper();
  const [failure, setFailure] = useState<unknown>(null);
  const error = requestError ?? failure;
  const [calculatedFor, setCalculatedFor] = useState<string | null>(null);

  const condition = operation.conditions?.[0];
  const term = condition?.term ?? null;
  const { minValue, maxValue, stepValue } = DEFAULT_TERM_RESTRICTIONS;

  const changeTerm = (delta: number) => {
    if (term == null) return;
    const next = Math.min(maxValue, Math.max(minValue, term + delta));
    dispatch(updateConditionAt({ index: 0, changes: { term: next } }));
  };

  const run = async () => {
    reset();
    setFailure(null);
    try {
      const result = await calculate(operation);
      // Ignored by the store when the user changed something meanwhile
      dispatch(setCredoper(result, revision));
      setCalculatedFor(calculationInputs({ ...result, insurances: operation.insurances }));
    } catch (failed) {
      // Request errors are exposed by the mutation; a calculation the API refused, here
      setFailure(failed);
    }
  };

  return {
    condition,
    term,
    monthly: condition?.flows?.[0]?.amount,
    isStale: calculatedFor !== null && calculatedFor !== calculationInputs(operation),
    termStep: stepValue,
    canDecrease: term != null && term > minValue,
    canIncrease: term != null && term < maxValue,
    decrease: () => changeTerm(-stepValue),
    increase: () => changeTerm(stepValue),
    run,
    isLoading,
    error,
  };
}
