import { useTranslation } from "react-i18next";
import { useAppSelector } from "@platform/app/store";
import { selectTheme } from "@platform/features/theme/themeSlice";
import { formatDate } from "@platform/utils/dateFormat";

// Amounts in the contract's currency and the language shown; dates in the user's date format
// (Settings → Appearance). A missing amount is null, never 0: each screen says how it shows it.

/** null when there is no amount. A currency Intl can't read is written next to the number. */
export function formatMoney(value: number | null | undefined, currencyId: string | null | undefined, locale?: string): string | null {
  if (value === null || value === undefined) return null;
  const plain = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  if (currencyId) {
    try {
      return new Intl.NumberFormat(locale, { ...plain, style: "currency", currency: currencyId }).format(value);
    } catch {
      return `${new Intl.NumberFormat(locale, plain).format(value)} ${currencyId}`;
    }
  }
  return new Intl.NumberFormat(locale, plain).format(value);
}

/** The rate as the API returns it (4.25 → "4.25%"), never recalculated */
export const formatRate = (rate: number | null | undefined, locale?: string): string | null =>
  rate === null || rate === undefined ? null : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(rate)}%`;

export function useStockFormat() {
  const { i18n } = useTranslation();
  const { dateFormat } = useAppSelector(selectTheme);
  const locale = i18n.resolvedLanguage ?? i18n.language;
  return {
    locale,
    money: (value: number | null | undefined, currencyId?: string | null) => formatMoney(value, currencyId, locale),
    rate: (rate: number | null | undefined) => formatRate(rate, locale),
    /** "" when there is no date */
    date: (iso: string | null | undefined) => formatDate(iso, dateFormat),
    number: (value: number) => new Intl.NumberFormat(locale).format(value),
  };
}
