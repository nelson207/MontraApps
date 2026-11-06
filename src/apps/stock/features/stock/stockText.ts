import { useTranslation } from "react-i18next";
import i18n from "@platform/i18n/i18n";

// The stock screens' texts: English is written where it is used, other languages live in
// apps/stock/i18n/<language>.json under "stock" (namespace "app"). stockText.test.ts checks that
// every key used here is translated.

type Values = Record<string, string | number>;

export type StockText = (key: string, english: string, values?: Values) => string;

/** For code outside React (validation messages) */
export const tx: StockText = (key, english, values) =>
  i18n.t(`app:stock.${key}` as never, { defaultValue: english, ...values }) as string;

/** For components: re-renders them in the new language */
export function useStockText(): StockText {
  const { t } = useTranslation("app");
  return (key, english, values) => t(`stock.${key}` as never, { defaultValue: english, ...values }) as string;
}
