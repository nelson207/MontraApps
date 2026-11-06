import { skipToken } from "@reduxjs/toolkit/query";
import { useGetApiCreditOperationsAssetTypesQuery } from "@platform/api/generated/MontraPOSApi";
import type { CredOperDto } from "@platform/api/legacy/legacyApi";
import { APP_SETTINGS } from "@credit/appSettings";
import { productsOf, toAssetTypeOptions, type AssetTypeOption } from "../model/business";
import type { Stage } from "../model/credOperDraft";
import { useBusinessChoices } from "./useBusinessChoices";

/**
 * The asset types the operation's business offers in its company
 * (GET /api/credit-operations/asset-types, for the business, the company and that company's
 * financial products of the business): one = decided for the user; several = the user picks one
 * (Asset type step). Asked once the business and the company are both decided (chosen, or set for
 * the user when there's only one); undefined until then and while loading.
 */
export function useAssetTypeChoices(stage: Stage, op: CredOperDto | null | undefined) {
  const { data: businesses } = useBusinessChoices(stage, op);
  const businessId = op?.aplBusinessId;
  const companyId = op?.aplCompanyId;
  const business = businessId ? businesses?.find((b) => b.id === businessId) : undefined;
  // The company must be one the business offers: a company left from another business isn't asked for
  const offered = !!companyId && !!business?.offers.some((o) => o.companyId === companyId);

  const answer = useGetApiCreditOperationsAssetTypesQuery(
    businessId && companyId && offered
      ? {
          application: APP_SETTINGS.identifier,
          businessId,
          companyId,
          financialProductIds: productsOf(business, companyId).flatMap((p) => (typeof p.id === "number" ? [p.id] : [])),
        }
      : skipToken,
  );

  const data: AssetTypeOption[] | undefined = answer.currentData ? toAssetTypeOptions(answer.currentData) : undefined;
  return { data, isLoading: answer.isFetching, isError: answer.isError, error: answer.error, refetch: answer.refetch };
}
