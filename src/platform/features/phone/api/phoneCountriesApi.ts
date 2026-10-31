import { useMemo } from "react";
import { useGetApiCompaniesCountriesQuery } from "@platform/api/generated/MontraPOSApi";
import { toPhoneCountries } from "../phoneModel";

// The phone countries of every Montra app: GET /api/companies/countries (alpha-2 code, name,
// phone prefix), in the order the backend gives; the first one is the default of new phone fields.
// The same answer as the country lists of the profile and users screens (one request).
export function useGetPhoneCountriesQuery() {
  const query = useGetApiCompaniesCountriesQuery(undefined, { refetchOnMountOrArgChange: false });
  const data = useMemo(() => (query.data ? toPhoneCountries(query.data) : undefined), [query.data]);
  return { ...query, data };
}
