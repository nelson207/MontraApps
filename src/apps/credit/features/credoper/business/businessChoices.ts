import type { CredOperDto } from "@platform/api/legacy/legacyApi";
import { restrictTo } from "@platform/features/appSettings/appSettingsModel";
import { convertedFromQuotation, type Stage } from "../model/credOperDraft";
import type { Business } from "../model/business";

/**
 * The businesses the Business step offers. The backend already limits `available` to the
 * application's available businesses; a new proposal is further limited to the ones that can
 * start in proposal (Settings → Application). A proposal converted from a quotation keeps its
 * business, and an existing operation always lists its own.
 */
export function businessChoices<B extends Business>(
  available: B[],
  { stage, op, proposalBusinesses }: { stage: Stage; op: CredOperDto; proposalBusinesses?: (string | number)[] },
): B[] {
  if (stage !== "proposal" || convertedFromQuotation(op)) return available;
  const allowed = op.aplBusinessId ? [...(proposalBusinesses ?? []), op.aplBusinessId] : proposalBusinesses;
  return proposalBusinesses?.length ? restrictTo(available, allowed, (b) => b.id) : available;
}
