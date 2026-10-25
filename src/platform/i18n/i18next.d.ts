import "i18next";
import type { EN } from "./resources";

// t("…") keys are checked against the English texts (the source of truth)
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: typeof EN & { app: Record<string, unknown> };
    returnNull: false;
  }
}
