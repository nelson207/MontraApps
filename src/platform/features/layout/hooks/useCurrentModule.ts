import { matchPath, useLocation } from "react-router-dom";
import { APP_MODULES } from "@app/modules";

/** The module whose route matches the current URL (used for the top bar title). */
export function useCurrentModule() {
  const { pathname } = useLocation();
  return APP_MODULES.find((module) => matchPath(module.path, pathname));
}
