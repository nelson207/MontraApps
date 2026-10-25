import type { JwtPayload } from "jwt-decode";
import { jwtDecode } from "jwt-decode";
import { selectAuthToken, useAppSelector } from "@platform/app/store";

/** Older .NET name claim (still read when the API's short claims are missing) */
const NAME_CLAIM =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name" as const;

type CustomJwtPayload = JwtPayload & {
  /** Full name, e.g. "Ana Silva" */
  fn?: string;
  /** Login name, e.g. "asilva" */
  name?: string;
  [NAME_CLAIM]?: string;
};

function getUserName(token: string | null): string {
  if (!token) return "Guest";

  try {
    const claims = jwtDecode<CustomJwtPayload>(token);
    return claims.fn?.trim() || claims.name?.trim() || claims[NAME_CLAIM] || "User";
  } catch (error) {
    console.error("Failed to decode token:", error);
    return "User";
  }
}

function getInitials(name: string): string {
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  const initials =
    parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2);
  return initials.toUpperCase();
}

export function useCurrentUser() {
  const name = getUserName(useAppSelector(selectAuthToken));
  return { name, initials: getInitials(name) };
}
