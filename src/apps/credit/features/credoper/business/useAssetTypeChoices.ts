import type { CredOperDto } from "@platform/api/legacy/legacyApi";
import { assetTypesOf, type AssetTypeOption } from "../model/business";
import type { Stage } from "../model/credOperDraft";
import { useBusinessChoices } from "./useBusinessChoices";

/**
 * The asset types the operation's business offers in its company, from the businesses' answer
 * (Settings → Application): one = decided for the user; several = the user picks one (Asset
 * step). Until the company is known, every company's: picking the business clears the company,
 * and the step after Business must already be there (the only company is decided a render later).
 * Undefined until the business is known.
 */
export function useAssetTypeChoices(stage: Stage, op: CredOperDto | null | undefined) {
  const { data: businesses, isLoading, isError, error, refetch } = useBusinessChoices(stage, op);
  const business = op?.aplBusinessId ? businesses?.find((b) => b.id === op.aplBusinessId) : undefined;
  const data: AssetTypeOption[] | undefined = business ? assetTypesOf(business, op?.aplCompanyId) : undefined;
  return { data, isLoading, isError, error, refetch };
}
