import type { CredOperDto } from "@platform/api/legacy/legacyApi";
import type { Stage } from "../model/credOperDraft";
import { useBusinessChoices } from "./useBusinessChoices";

export type CompanyOption = { id: number; label: string };

/**
 * The companies the operation's business can be done with, from the businesses' answer (one
 * item per business and company): one = the company is decided; several = the user picks one
 * (Company step). Undefined while unknown.
 */
export function useCompanyChoices(stage: Stage, op: CredOperDto | null | undefined) {
  const { data: businesses, isLoading, isError, error, refetch } = useBusinessChoices(stage, op);
  const business = op?.aplBusinessId ? businesses?.find((b) => b.id === op.aplBusinessId) : undefined;
  const data: CompanyOption[] | undefined =
    businesses && op?.aplBusinessId ? (business?.offers ?? []).map((o) => ({ id: o.companyId, label: o.companyLabel })) : undefined;
  return { data, isLoading, isError, error, refetch };
}
