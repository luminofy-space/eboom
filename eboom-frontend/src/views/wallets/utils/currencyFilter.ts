import dayjs from "dayjs";
import {
  getCurrencyBaseColor,
} from "@/src/views/dashboard/utils/assignCurrencyChartColors";
import type { WalletEntry, WalletPayment, WalletTransfer } from "./utils";
import { getTimeRangeDays } from "./utils";

export interface WalletSubWallet {
  currencyId: number;
  amount: string;
  currency?: { id: number; code: string; symbol: string } | null;
}

export interface WalletCurrencyOption {
  code: string;
  symbol: string;
  currencyId: number;
  balance: string;
}

export function getWalletIncomingSeriesKey(currencyCode: string): string {
  return `${currencyCode}_incoming`;
}

export function getWalletOutgoingSeriesKey(currencyCode: string): string {
  return `${currencyCode}_outgoing`;
}

export function getWalletTransferInSeriesKey(currencyCode: string): string {
  return `${currencyCode}_transferIn`;
}

export function getWalletTransferOutSeriesKey(currencyCode: string): string {
  return `${currencyCode}_transferOut`;
}

export function getWalletCurrencyFromSeriesKey(seriesKey: string): string {
  const suffixes = ["_incoming", "_outgoing", "_transferIn", "_transferOut"] as const;
  for (const suffix of suffixes) {
    if (seriesKey.endsWith(suffix)) {
      return seriesKey.slice(0, -suffix.length);
    }
  }
  return seriesKey;
}

export function getWalletCurrencyOptions(
  subWallets: WalletSubWallet[] | undefined
): WalletCurrencyOption[] {
  if (!subWallets?.length) return [];

  return subWallets
    .filter((sw) => sw.currency?.code)
    .map((sw) => ({
      code: sw.currency!.code,
      symbol: sw.currency!.symbol,
      currencyId: sw.currencyId,
      balance: sw.amount,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

/** Prefer the sub-wallet with the largest balance (not alphabetical order). */
export function getDefaultWalletCurrencyCode(
  options: WalletCurrencyOption[]
): string {
  if (!options.length) return "";
  return options.reduce((best, option) =>
    Math.abs(parseFloat(option.balance) || 0) >
    Math.abs(parseFloat(best.balance) || 0)
      ? option
      : best
  ).code;
}

export function getCurrencySymbolForCode(
  code: string,
  options: WalletCurrencyOption[],
  entries: WalletEntry[],
  payments: WalletPayment[]
): string {
  const fromSub = options.find((o) => o.code === code)?.symbol;
  if (fromSub) return fromSub;
  const fromEntry = entries.find((e) => e.currencyCode === code)?.currencySymbol;
  if (fromEntry) return fromEntry;
  const fromPayment = payments.find((p) => p.currencyCode === code)?.currencySymbol;
  return fromPayment ?? code;
}

export function filterEntriesByCurrency(
  entries: WalletEntry[],
  currencyCode?: string
): WalletEntry[] {
  if (!currencyCode) return entries;
  return entries.filter((e) => e.currencyCode === currencyCode);
}

export function filterPaymentsByCurrency(
  payments: WalletPayment[],
  currencyCode?: string
): WalletPayment[] {
  if (!currencyCode) return payments;
  return payments.filter((p) => p.currencyCode === currencyCode);
}

export function filterTransfersByCurrency(
  transfers: WalletTransfer[],
  walletId: number,
  currencyCode?: string
): WalletTransfer[] {
  if (!currencyCode) return transfers;

  return transfers.filter((transfer) => {
    const isTransferIn =
      transfer.destinationWalletId === walletId &&
      transfer.destinationCurrencyCode === currencyCode;
    const isTransferOut =
      transfer.sourceWalletId === walletId &&
      transfer.sourceCurrencyCode === currencyCode;
    return isTransferIn || isTransferOut;
  });
}

export interface MultiCurrencyWalletChartPoint {
  date: string;
  [seriesKey: string]: string | number;
}

export function buildWalletMultiCurrencySeriesKeys(currencyCodes: string[]): string[] {
  return currencyCodes.flatMap((code) => [
    getWalletIncomingSeriesKey(code),
    getWalletOutgoingSeriesKey(code),
    getWalletTransferInSeriesKey(code),
    getWalletTransferOutSeriesKey(code),
  ]);
}

export function assignWalletCurrencyChartColors(
  currencyCodes: string[]
): Record<string, string> {
  const colorMap: Record<string, string> = {};
  const total = currencyCodes.length;

  currencyCodes.forEach((code, index) => {
    const baseColor = getCurrencyBaseColor(code, index, total);
    colorMap[getWalletIncomingSeriesKey(code)] = baseColor;
    colorMap[getWalletOutgoingSeriesKey(code)] = baseColor;
    colorMap[getWalletTransferInSeriesKey(code)] = baseColor;
    colorMap[getWalletTransferOutSeriesKey(code)] = baseColor;
  });

  return colorMap;
}

export function buildMultiCurrencyWalletChartData(
  entries: WalletEntry[],
  payments: WalletPayment[],
  transfers: WalletTransfer[],
  walletId: number,
  timeRange: string,
  currencyCodes: string[]
): MultiCurrencyWalletChartPoint[] {
  const days = getTimeRangeDays(timeRange);
  const startDate = dayjs().subtract(days, "day");
  const map = new Map<string, MultiCurrencyWalletChartPoint>();

  for (let i = 0; i <= days; i++) {
    const date = startDate.add(i, "day").format("YYYY-MM-DD");
    const point: MultiCurrencyWalletChartPoint = { date };
    for (const code of currencyCodes) {
      point[getWalletIncomingSeriesKey(code)] = 0;
      point[getWalletOutgoingSeriesKey(code)] = 0;
      point[getWalletTransferInSeriesKey(code)] = 0;
      point[getWalletTransferOutSeriesKey(code)] = 0;
    }
    map.set(date, point);
  }

  for (const entry of entries) {
    if (!entry.receivedDate || !entry.currencyCode) continue;
    if (!currencyCodes.includes(entry.currencyCode)) continue;
    const date = dayjs(entry.receivedDate).format("YYYY-MM-DD");
    const existing = map.get(date);
    const key = getWalletIncomingSeriesKey(entry.currencyCode);
    if (existing) {
      existing[key] = (Number(existing[key]) || 0) + (parseFloat(entry.amount) || 0);
    }
  }

  for (const payment of payments) {
    if (!payment.paidDate || !payment.currencyCode) continue;
    if (!currencyCodes.includes(payment.currencyCode)) continue;
    const date = dayjs(payment.paidDate).format("YYYY-MM-DD");
    const existing = map.get(date);
    const key = getWalletOutgoingSeriesKey(payment.currencyCode);
    if (existing) {
      existing[key] = (Number(existing[key]) || 0) + (parseFloat(payment.amount) || 0);
    }
  }

  for (const transfer of transfers) {
    const date = dayjs(transfer.transferDate).format("YYYY-MM-DD");
    const existing = map.get(date);
    if (!existing) continue;

    if (
      transfer.destinationWalletId === walletId &&
      currencyCodes.includes(transfer.destinationCurrencyCode)
    ) {
      const key = getWalletTransferInSeriesKey(transfer.destinationCurrencyCode);
      existing[key] =
        (Number(existing[key]) || 0) + (parseFloat(transfer.destinationAmount) || 0);
    }

    if (
      transfer.sourceWalletId === walletId &&
      currencyCodes.includes(transfer.sourceCurrencyCode)
    ) {
      const key = getWalletTransferOutSeriesKey(transfer.sourceCurrencyCode);
      existing[key] =
        (Number(existing[key]) || 0) + (parseFloat(transfer.sourceAmount) || 0);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
