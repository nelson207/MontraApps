import { useGetApiCreditOperationsBusinessesQuery } from "@platform/api/generated/MontraPOSApi";
import type { CredOperDto } from "@platform/api/legacy/legacyApi";
import { APP_SETTINGS } from "@credit/appSettings";
import { useGetScreenCustomizationQuery } from "@platform/features/appSettings/api/appSettingsApi";
import { proposalBusinessIds } from "@platform/features/appSettings/appSettingsModel";
import type { Stage } from "../model/credOperDraft";
import { toAvailableBusinesses } from "../model/business";
import { businessChoices } from "./businessChoices";

/** GET /api/credit-operations/businesses: the backend applies the configured companies and businesses */
const BUSINESSES_REQUEST = { application: APP_SETTINGS.identifier, includeProductsWithoutImporters: true };

/**
 * The businesses the Business step offers for this operation, each with its financial products
 * (see businessChoices). The Wizard keeps this subscribed for the whole operation, so the
 * products step and going back to the businesses use the same answer: no reload.
 */
export function useBusinessChoices(stage: Stage, op: CredOperDto | null | undefined) {
  const available = useGetApiCreditOperationsBusinessesQuery(BUSINESSES_REQUEST, { refetchOnMountOrArgChange: false });
  // Only a new proposal needs the application settings; a failure there means no restriction
  const settings = useGetScreenCustomizationQuery(APP_SETTINGS.identifier, { skip: stage !== "proposal" });
  const waitingForSettings = stage === "proposal" && settings.isLoading;

  const data =
    available.currentData && op && !waitingForSettings
      ? businessChoices(toAvailableBusinesses(available.currentData), {
          stage,
          op,
          proposalBusinesses: proposalBusinessIds(settings.currentData?.settings.companies ?? []),
        })
      : undefined;

  return {
    data,
    isLoading: available.isFetching || waitingForSettings,
    isError: available.isError,
    error: available.error,
    refetch: available.refetch,
  };
}
