import { useEffect, useRef, useState } from "react";
import type { CredOperDto } from "@platform/api/legacy/legacyApi";
import { applyProductDefaults, patchCredoper, setCredoper } from "../credoperSlice";
import { selectCredoperRevision, useAppDispatch, useAppSelector } from "@credit/store";
import { useFinancialProductDefaults } from "../api/credOperApi";
import { DEFAULT_TERM_RESTRICTIONS } from "../constants";
import { splitProductDefaults, withAcceptedDefaults, type DefaultConflict } from "../model/productDefaults";

// Every time the user changes the financial product, its defaults are loaded: blank values take
// them, values on screen the product would change wait for the user (`conflicts`, field by field).
// An operation opened with its product isn't touched: only a change brings defaults. Values the
// user doesn't see are only the backend's (the defaults' answer): the app sets none itself.
export default function useFinancialProductSync(
  credoper: CredOperDto | null,
  /** False while the operation has no server template yet: its defaults would have nothing to land on */
  enabled = true,
) {
  const dispatch = useAppDispatch();
  const revision = useAppSelector(selectCredoperRevision);
  /** The values on screen the new product would change, until the user decides */
  const [conflicts, setConflicts] = useState<DefaultConflict[]>([]);
  /** The new product's defaults are on their way: the page waits for them */
  const [isLoading, setIsLoading] = useState(false);

  // New API: POST /api/financial-products/defaults
  const [getProductDefaults] = useFinancialProductDefaults();

  // The product whose defaults the operation has (the one it was opened with, for an existing one)
  const settledProduct = useRef(credoper?.financialProduct ?? null);
  /** settledProduct, for rendering */
  const [settled, setSettled] = useState(credoper?.financialProduct ?? null);

  // No term once the product's defaults are in (none, or the operation was opened without one):
  // the slider's first point, which it shows, is the operation's, so it's calculated and saved
  const term = credoper?.conditions?.[0]?.term;
  const hasConditions = !!credoper?.conditions?.length;
  useEffect(() => {
    if (!enabled || !settled || settled !== credoper?.financialProduct || term != null) return;
    const firstTerm = DEFAULT_TERM_RESTRICTIONS.minValue;
    dispatch(applyProductDefaults(hasConditions ? { firstCondition: { term: firstTerm } } : { conditions: [{ term: firstTerm }] }));
  }, [enabled, settled, credoper?.financialProduct, term, hasConditions, dispatch]);

  useEffect(() => {
    const financialProductId = credoper?.financialProduct;

    if (!financialProductId || !enabled || financialProductId === settledProduct.current) {
      return;
    }

    const oldFinancialProductId = settledProduct.current;
    let cancelled = false;
    setConflicts([]);
    setIsLoading(true);

    const sync = async () => {
      // Only what the backend answers is set: the app derives nothing from the product itself
      const sent = credoper!;
      const defaults = await getProductDefaults(sent, oldFinancialProductId);
      if (cancelled) return;
      settledProduct.current = financialProductId;
      setSettled(financialProductId);
      const split = splitProductDefaults(sent, defaults);
      // Ignored by the store when the user changed something meanwhile
      dispatch(setCredoper(split.silent, revision));
      setConflicts(split.conflicts);
    };

    sync()
      .catch((error: unknown) => {
        // The product stays chosen; the calculation shows its own errors
        console.warn("Couldn't load financial product defaults", error);
      })
      // Settled or failed; one replaced by a newer product leaves it to that one
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      setIsLoading(false);
    };
  }, [credoper?.financialProduct, enabled]);

  /** The user's answer: the defaults they accepted replace their values (an edit), the rest stay */
  const resolveConflicts = (accepted: DefaultConflict[]) => {
    setConflicts([]);
    if (accepted.length && credoper) {
      const { assets, conditions } = withAcceptedDefaults(credoper, accepted);
      dispatch(patchCredoper({ assets, conditions }));
    }
  };

  return { conflicts, resolveConflicts, isLoading };
}
