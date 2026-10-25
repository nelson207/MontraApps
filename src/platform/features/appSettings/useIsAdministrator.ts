import { jwtDecode } from "jwt-decode";
import { selectAuthToken, useAppSelector } from "@platform/app/store";
import { isAdministrator } from "./appSettingsModel";

/** The signed-in user has the Administrator role (JWT role claim) */
export function useIsAdministrator(): boolean {
  const token = useAppSelector(selectAuthToken);
  if (!token) return false;
  try {
    return isAdministrator(jwtDecode<Record<string, unknown>>(token));
  } catch {
    return false;
  }
}
