"use client";

import { useTranslation } from "react-i18next";
import {
  formatAmount,
  formatCurrency,
  formatDate,
  formatMoney,
  formatNumber,
  formatRelativeEdit,
  getIntlLocale,
  type FormatCurrencyOptions,
  type FormatDateOptions,
  type FormatNumberOptions,
} from "./formatters";

export function useFormatters() {
  const { i18n } = useTranslation();
  const locale = getIntlLocale(i18n.language);

  const withLocale = <T extends { locale?: string }>(options: T): T => ({
    ...options,
    locale,
  });

  return {
    locale,
    formatNumber: (value: number | string, options?: FormatNumberOptions) =>
      formatNumber(value, withLocale(options ?? {})),
    formatCurrency: (
      amount: number | string,
      symbol?: string,
      options?: FormatCurrencyOptions
    ) => formatCurrency(amount, symbol, withLocale(options ?? {})),
    formatDate: (
      date: string | Date | null | undefined,
      options: FormatDateOptions
    ) => formatDate(date, withLocale(options)),
    formatMoney: (
      amount: number | string,
      symbol?: string,
      options?: Intl.NumberFormatOptions
    ) => formatMoney(amount, symbol, options),
    formatAmount: (
      amount: string | number,
      symbol?: string,
      emDash?: string
    ) => formatAmount(amount, symbol, emDash),
    formatRelativeEdit,
  };
}
