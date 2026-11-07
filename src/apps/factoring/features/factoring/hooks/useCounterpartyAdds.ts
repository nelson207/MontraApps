import { useRef, useState } from "react";
import { problemStatus } from "@platform/api/problemCode";
import { useAddCounterpartyMutation } from "../api/factoringApi";
import { isDefiniteRefusal } from "../model/problems";
import { classifyCounterparty, type ApiMessage } from "../model/submission";

// Adding an existing entity to the agreement, by tax number. What happened to each number is kept
// here, above the dialog: closing and reopening it must not offer a retry that isn't safe.

export type AddResult =
  | { kind: "added" | "uncertain" | "refused"; messages: ApiMessage[] }
  /** No answer: as good as uncertain, as this POST has no correlationId to repeat it safely */
  | { kind: "noAnswer" }
  | { kind: "tooMany" }
  | { kind: "rejected"; error: unknown };

/** After these, the same tax number isn't offered again */
export const isFinalAdd = (result: AddResult | undefined) => result?.kind === "added" || result?.kind === "uncertain" || result?.kind === "noAnswer";

const keyOf = (contractId: string, taxNumber: string) => `${contractId}|${taxNumber}`;

export function useCounterpartyAdds() {
  const [post] = useAddCounterpartyMutation();
  const [results, setResults] = useState<Record<string, AddResult>>({});
  const [adding, setAdding] = useState(false);
  const busy = useRef(false);

  return {
    adding,
    resultOf: (contractId: string, taxNumber: string): AddResult | undefined => results[keyOf(contractId, taxNumber)],
    add: async (contractId: string, taxNumber: string) => {
      const key = keyOf(contractId, taxNumber);
      if (busy.current || isFinalAdd(results[key])) return;
      busy.current = true;
      setAdding(true);
      let result: AddResult;
      try {
        result = classifyCounterparty(await post({ contractId, taxNumber }).unwrap());
      } catch (error) {
        if (problemStatus(error) === 429) result = { kind: "tooMany" };
        else result = isDefiniteRefusal(error) ? { kind: "rejected", error } : { kind: "noAnswer" };
      }
      busy.current = false;
      setAdding(false);
      setResults((all) => ({ ...all, [key]: result }));
    },
  };
}

export type CounterpartyAdds = ReturnType<typeof useCounterpartyAdds>;
