import { useEffect, useMemo, useState } from "react";
import { useStore } from "react-redux";
import type { RetakeCalculation } from "@platform/api/generated/MontraPOSApi";
import type { CredOperAssetDto } from "@platform/api/legacy/legacyApi";
import { selectCredoper, useAppDispatch, type RootState } from "@credit/store";
import { useRetakeCalculation } from "../api/credOperApi";
import { patchCredoper } from "../credoperSlice";
import { latestDebounced } from "../utils/latestDebounced";

/** How long after the last keystroke the API is asked */
export const RETAKE_DELAY_MS = 400;

type Answer = { sent: CredOperAssetDto; asset: CredOperAssetDto } | null;

/**
 * The initial entry worked out by the API (POST /api/equipments/retake) as the user types it:
 * `typed("Amount")` after the percentage changed (the amount comes back), `typed("Percentage")`
 * after the amount changed. Asked once typing stops (or the field is left: `flush`), with the
 * first asset as it is then; its answer replaces that asset (with the base amount it
 * recalculated), unless a newer request was made or the asset changed meanwhile.
 */
export function useRetakeSync() {
  const store = useStore<RootState>();
  const dispatch = useAppDispatch();
  const calculateRetake = useRetakeCalculation();
  const [error, setError] = useState<unknown>(null);

  const sync = useMemo(
    () =>
      latestDebounced<RetakeCalculation, Answer>(
        async (calculate) => {
          const sent = selectCredoper(store.getState())?.assets?.[0];
          if (!sent?.equipment) return null;
          return { sent, asset: await calculateRetake(calculate, sent) };
        },
        {
          onResult: (answer) => {
            if (!answer) return;
            const assets = selectCredoper(store.getState())?.assets;
            // Changed since it was sent (another field, another asset list): that edit stands
            if (!assets?.length || assets[0] !== answer.sent) return;
            setError(null);
            dispatch(patchCredoper({ assets: [answer.asset, ...assets.slice(1)] }));
          },
          onError: setError,
        },
        RETAKE_DELAY_MS,
      ),
    [store, dispatch, calculateRetake],
  );

  // Leaving the form with a change still waiting: it's sent all the same
  useEffect(() => () => sync.flush(), [sync]);

  return {
    typed: (calculate: RetakeCalculation) => {
      setError(null);
      sync.schedule(calculate);
    },
    flush: sync.flush,
    /** The last request failed (the value typed stays; the other one is the app's estimate) */
    error,
  };
}
