import { useTranslation } from "react-i18next";
import { WORK_CONTEXT } from "@app/workContext";
import type { HierarchyLevel } from "./hierarchy";

/**
 * The app's working-context texts in the user's language: level names, the member role, the
 * purpose and the impersonation note. English is the app's WORK_CONTEXT (workContext.ts); other
 * languages are in its messages under workContext (namespace "app").
 */
export function useWorkContextTexts() {
  const { t } = useTranslation("app");
  const text = (key: string, english: string) => t(`workContext.${key}` as never, { defaultValue: english }) as string;
  const { levels } = WORK_CONTEXT;
  return {
    /** "Credit intermediary" */
    label: (level: HierarchyLevel) => text(`levels.${level}.label`, levels[level].label),
    /** "credit intermediary": inside a sentence */
    name: (level: HierarchyLevel) => text(`levels.${level}.label`, levels[level].label).toLowerCase(),
    /** "credit intermediaries" */
    plural: (level: HierarchyLevel) => text(`levels.${level}.plural`, levels[level].plural),
    memberRole: text("memberRole", WORK_CONTEXT.memberRole),
    purpose: text("purpose", WORK_CONTEXT.purpose),
    impersonationNote: text("impersonationNote", WORK_CONTEXT.impersonationNote),
  };
}
