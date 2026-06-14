import dayjs from "dayjs";
import i18n from "./index";

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  de: "de-DE",
  fa: "fa-IR",
  cs: "cs-CZ",
};

export function getIntlLocale(language = i18n.language): string {
  const base = language.split("-")[0];
  return LOCALE_MAP[language] ?? LOCALE_MAP[base] ?? LOCALE_MAP.en;
}

export function formatMoney(
  amount: number | string,
  symbol?: string,
  options?: Intl.NumberFormatOptions
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) {
    return i18n.t("common:empty.emDash");
  }

  const formatted = new Intl.NumberFormat(getIntlLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(num);

  return symbol ? `${symbol}${formatted}` : formatted;
}

export function formatAmount(
  amount: string | number,
  symbol?: string,
  emDash?: string
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const fallback = emDash ?? i18n.t("common:empty.emDash");
  if (Number.isNaN(num)) return fallback;

  const formatted = new Intl.NumberFormat(getIntlLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(num);

  return symbol ? `${symbol}${formatted}` : formatted;
}

export function formatRelativeEdit(
  date: string | Date | null | undefined
): string {
  if (!date) return "";
  const relativeTime = dayjs(date).fromNow();
  return i18n.t("common:gridCard.editedRelative", { relativeTime });
}
