import { useEffect, useState } from "react";
import type { CodeAbbreviation } from "@platform/api/legacy/legacyApi";
import { productsOf, type AvailableBusiness } from "../model/business";
import type { OptionsState, UseQuotationOptionsParams } from "../types/credoperTypes";
import useQuotationBootstrap from "./useQuotationBootstrap";

/** A business's financial products in a company, as the wizard's option list ({ code: id, abbreviation, description }) */
export const financialProductOptions = (business: AvailableBusiness | undefined, companyId?: number | null): CodeAbbreviation[] =>
  productsOf(business, companyId).map((p) => ({
    code: String(p.id),
    abbreviation: p.code ?? null,
    description: p.description ?? null,
  }));

// Lists of the operation itself. The financial products are the chosen business's in the
// operation's company, from the Business step's answer (GET /api/credit-operations/businesses):
// never fetched again. The equipment lists (types, categories, states) are the shared equipment detail's
// (platform/features/equipment).
export function useQuotationOptions({ business, companyId, loadingBusinesses }: UseQuotationOptionsParams) {
  const [credOperClassifications, setClassifications] = useState<CodeAbbreviation[]>([]);
  const { GetCredoperClassifications } = useQuotationBootstrap();

  useEffect(() => {
    let stale = false;
    GetCredoperClassifications({ getCredOperClassificationByKeysV2Request: {} })
      .unwrap()
      .then((data) => {
        if (!stale) setClassifications(data ?? []);
      })
      .catch((err: unknown) => console.error("Failed to fetch credOperClassifications:", err));
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once
  }, []);

  const options: OptionsState = { financialProducts: financialProductOptions(business, companyId), credOperClassifications };
  return {
    options,
    /** The chosen business's products are still loading */
    loadingFinancialProducts: !business && loadingBusinesses,
  };
}
