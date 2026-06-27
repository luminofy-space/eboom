import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import i18n from "./index";

dayjs.extend(relativeTime);

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  de: "de-DE",
  fa: "fa-IR",
  cs: "cs-CZ",
};

export type NumberFormatPreset = "money" | "amount" | "compact";
export type DateFormatPreset = "short" | "monthDay" | "monthShort";

const NUMBER_PRESETS: Record<NumberFormatPreset, Intl.NumberFormatOptions> = {
  money: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  amount: { minimumFractionDigits: 2, maximumFractionDigits: 8 },
  compact: { minimumFractionDigits: 0, maximumFractionDigits: 2 },
};

const DATE_PRESETS: Record<DateFormatPreset, Intl.DateTimeFormatOptions> = {
  short: { month: "short", day: "numeric", year: "numeric" },
  monthDay: { month: "short", day: "numeric" },
  monthShort: { month: "short" },
};

export function getIntlLocale(language = i18n.language): string {
  const base = language.split("-")[0];
  return LOCALE_MAP[language] ?? LOCALE_MAP[base] ?? LOCALE_MAP.en;
}

export type FormatNumberOptions = Intl.NumberFormatOptions & {
  locale?: string;
  preset?: NumberFormatPreset;
};

export function formatNumber(
  value: number | string,
  options: FormatNumberOptions = {}
): string {
  const { locale, preset = "money", ...intlOptions } = options;
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) {
    return i18n.t("common:empty.emDash");
  }

  return new Intl.NumberFormat(getIntlLocale(locale), {
    ...NUMBER_PRESETS[preset],
    ...intlOptions,
  }).format(num);
}

export type FormatCurrencyOptions = FormatNumberOptions & {
  fallback?: string;
};

export function formatCurrency(
  amount: number | string,
  symbol?: string,
  options: FormatCurrencyOptions = {}
): string {
  const { fallback, ...numberOptions } = options;
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const defaultFallback = fallback ?? i18n.t("common:empty.emDash");
  if (Number.isNaN(num)) return defaultFallback;

  const formatted = formatNumber(num, numberOptions);
  return symbol ? `${symbol}${formatted}` : formatted;
}

export type FormatDateOptions = Intl.DateTimeFormatOptions & {
  locale?: string;
  preset?: DateFormatPreset;
  fallback: string;
};

export function formatDate(
  date: string | Date | null | undefined,
  options: FormatDateOptions
): string {
  const { locale, preset = "short", fallback, ...intlOptions } = options;
  if (!date) return fallback;

  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return fallback;

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    ...DATE_PRESETS[preset],
    ...intlOptions,
  }).format(parsed);
}

export function formatMoney(
  amount: number | string,
  symbol?: string,
  options?: Intl.NumberFormatOptions
): string {
  return formatCurrency(amount, symbol, { preset: "money", ...options });
}

export function formatAmount(
  amount: string | number,
  symbol?: string,
  emDash?: string
): string {
  return formatCurrency(amount, symbol, {
    preset: "amount",
    fallback: emDash,
  });
}

export function formatRelativeTime(
  date: string | Date | null | undefined
): string {
  if (!date) return "";
  return dayjs(date).fromNow();
}
