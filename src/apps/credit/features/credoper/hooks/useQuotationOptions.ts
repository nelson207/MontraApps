import { useMemo } from "react";
import { useGetApiCreditOperationsClassificationsQuery, type CredOperClassificationDto } from "@platform/api/generated/MontraPOSApi";
import type { CodeAbbreviation } from "@platform/api/legacy/legacyApi";
import { APP_SETTINGS } from "@credit/appSettings";
import { productsOf, type AvailableBusiness } from "../model/business";
import type { OptionsState, UseQuotationOptionsParams } from "../types/credoperTypes";

/** A business's financial products in a company, as the wizard's option list ({ code: id, abbreviation, description }) */
export const financialProductOptions = (business: AvailableBusiness | undefined, companyId?: number | null): CodeAbbreviation[] =>
  productsOf(business, companyId).map((p) => ({
    code: String(p.id),
    abbreviation: p.code ?? null,
    description: p.description ?? null,
  }));

/** The contract classifications as the wizard's option list ({ code: id, abbreviation, description }) */
export const classificationOptions = (dtos: CredOperClassificationDto[] | undefined): CodeAbbreviation[] =>
  (dtos ?? []).flatMap((c) =>
    typeof c.id === "number"
      ? [{ code: String(c.id), abbreviation: c.abbreviation?.trim() || c.description?.trim() || `Classification ${c.id}`, description: c.description ?? null }]
      : [],
  );

// Lists of the operation itself. The financial products are the chosen business's in the
// operation's company, from the Business step's answer (GET /api/credit-operations/businesses):
// never fetched again. The contract classifications are the ones the app's settings offer for the
// business in the company (GET /api/credit-operations/classifications; [] = none configured):
// asked once both are known (picking a business clears the company until it's decided for the
// user, with one company, or chosen in the Company step). The equipment lists (types,
// categories, states) are the shared equipment detail's (platform/features/equipment).
export function useQuotationOptions({ business, companyId, loadingBusinesses }: UseQuotationOptionsParams) {
  const waiting = !business || !companyId;
  const classifications = useGetApiCreditOperationsClassificationsQuery(
    { application: APP_SETTINGS.identifier, companyId: companyId ?? 0, businessId: business?.id ?? 0 },
    { skip: waiting },
  );
  const credOperClassifications = useMemo(() => classificationOptions(classifications.currentData), [classifications.currentData]);

  const options: OptionsState = { financialProducts: financialProductOptions(business, companyId), credOperClassifications };
  return {
    options,
    /** The chosen business's products are still loading */
    loadingFinancialProducts: !business && loadingBusinesses,
    /** The classifications are loading, or waiting for the business and the company */
    loadingClassifications: waiting || (classifications.isFetching && !classifications.currentData),
  };
}
