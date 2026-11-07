import { useTranslation } from "react-i18next";
import i18n from "@platform/i18n/i18n";

// The factoring screens' texts: English is written where it is used, other languages live in
// apps/factoring/i18n/<language>.json under "factoring" (namespace "app"). factoringText.test.ts
// checks that every key used is translated.

type Values = Record<string, string | number>;

export type FactoringText = (key: string, english: string, values?: Values) => string;

/** For code outside React (validation messages) */
export const tx: FactoringText = (key, english, values) =>
  i18n.t(`app:factoring.${key}` as never, { defaultValue: english, ...values }) as string;

/** For components: re-renders them in the new language */
export function useFactoringText(): FactoringText {
  const { t } = useTranslation("app");
  return (key, english, values) => t(`factoring.${key}` as never, { defaultValue: english, ...values }) as string;
}
