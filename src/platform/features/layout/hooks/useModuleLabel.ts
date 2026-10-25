import { useTranslation } from "react-i18next";
import type { AppModule } from "@platform/app/contract";

/**
 * Module labels and menu sections in the user's language. They're English in the apps'
 * modules.ts and translated by that English text: the app's own in its messages ("app"
 * namespace), the shared ones (Home, News, Users, Overview…) in the "layout" namespace;
 * untranslated → the English text.
 */
export function useMenuText() {
  // fallback: look in "app", then in "layout" (react-i18next only uses the first one otherwise)
  const { t } = useTranslation(["app", "layout"], { nsMode: "fallback" });
  const text = (group: "modules" | "sections", english: string) =>
    t(`${group}.${english}` as never, { defaultValue: english }) as string;
  return {
    moduleLabel: (module: Pick<AppModule, "label">) => text("modules", module.label),
    sectionLabel: (section: string) => text("sections", section),
  };
}

/** A module's label in the user's language (see useMenuText) */
export function useModuleLabel(): (module: Pick<AppModule, "label">) => string {
  return useMenuText().moduleLabel;
}
