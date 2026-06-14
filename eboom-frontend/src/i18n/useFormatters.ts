"use client";

import { useTranslation } from "react-i18next";
import {
  formatAmount,
  formatMoney,
  formatRelativeEdit,
  getIntlLocale,
} from "./formatters";

export function useFormatters() {
  const { i18n } = useTranslation();

  return {
    locale: getIntlLocale(i18n.language),
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
