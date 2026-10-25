import { useEffect, useState } from "react";
import type {
  CredOperDto,
  FinancialProductDto,
} from "@platform/api/legacy/legacyApi";
import { applyProductDefaults } from "../credoperSlice";
import { useAppDispatch } from "@credit/store";
import useQuotationBootstrap from "./useQuotationBootstrap";
import { useFinancialProductDefaults } from "../api/credOperApi";

export default function useFinancialProductSync(
  credoper: CredOperDto | null,
  creoperStep: number | undefined,
  /** False while the operation has no server template yet: its defaults would have nothing to land on */
  enabled = true,
) {
  const dispatch = useAppDispatch();
  const [financialProduct, setFinancialProduct] =
    useState<FinancialProductDto>();

  const { GetFinancialProductDetail } = useQuotationBootstrap();
  // New API: POST /api/credit-operations/financial-product-defaults
  const [getProductDefaults] = useFinancialProductDefaults();

  useEffect(() => {
    const financialProductId = credoper?.financialProduct;

    if (!financialProductId || !enabled) {
      return;
    }

    let cancelled = false;

    void GetFinancialProductDetail({
      financialProductDetailsRequest: {
        finProductId: financialProductId,
      },
    })
      .unwrap()
      .then(async (data) => {
        if (cancelled) return;
        setFinancialProduct(data);
        // Only the product-derived fields: the rest of the operation may have
        // changed while the request was in flight
        const derived: Partial<CredOperDto> = {
          // The company chosen (or decided) after the business wins over the product's
          aplCompanyId: credoper?.aplCompanyId || data.aplCompanyId || 0,
          currencyId: data.currencyId ?? null,
          finProductVersion: data.finProductVersion ?? 0,
          credOperTypeId: data.OperType ?? 0,
          credOperStep: creoperStep ?? 1,
          credOperChannelId: 1,
        };
        dispatch(applyProductDefaults(derived));

        const defaults = await getProductDefaults({ ...credoper, ...derived });
        if (!cancelled && defaults != null) {
          dispatch(
            applyProductDefaults({
              firstCondition: defaults.conditions?.at(0) ?? {},
            }),
          );
        }
      })
      .catch((error: unknown) => {
        // Product details are optional enrichment; the summary shows its own errors
        console.warn("Couldn't load financial product details", error);
      });

    return () => {
      cancelled = true;
    };

    // void GetFinancialProductTermRestriction({
    //   credOperDto: credoper,
    // })
    //   .unwrap()
    //   .then((data) => {
    //     setTermRestrictions(data);
    //   });
  }, [credoper?.financialProduct, enabled]);

  return { financialProduct };
}
