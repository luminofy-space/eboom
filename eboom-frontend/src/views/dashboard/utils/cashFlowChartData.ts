import dayjs from "dayjs";
import {
  getPaidSeriesKey,
  getReceivedSeriesKey,
} from "./assignCurrencyChartColors";
import type {
  CanvasSummaryExpensePayment,
  CanvasSummaryIncomeEntry,
} from "../types";

export interface CashFlowChartPoint {
  date: string;
  received: number;
  paid: number;
}

export interface MultiCurrencyCashFlowPoint {
  date: string;
  [seriesKey: string]: string | number;
}

export function getTimeRangeDays(timeRange: string): number {
  if (timeRange === "7d") return 7;
  if (timeRange === "30d") return 30;
  return 90;
}

export function buildCashFlowChartData(
  entries: CanvasSummaryIncomeEntry[],
  payments: CanvasSummaryExpensePayment[],
  timeRange: string,
  currencyCode?: string
): CashFlowChartPoint[] {
  const days = getTimeRangeDays(timeRange);
  const startDate = dayjs().subtract(days, "day");
  const map = new Map<string, CashFlowChartPoint>();

  for (let i = 0; i <= days; i++) {
    const date = startDate.add(i, "day").format("YYYY-MM-DD");
    map.set(date, { date, received: 0, paid: 0 });
  }

  const filteredEntries = currencyCode
    ? entries.filter((e) => e.currencyCode === currencyCode)
    : entries;
  const filteredPayments = currencyCode
    ? payments.filter((p) => p.currencyCode === currencyCode)
    : payments;

  for (const entry of filteredEntries) {
    if (!entry.receivedDate) continue;
    const amount = parseFloat(entry.amount) || 0;
    const date = dayjs(entry.receivedDate).format("YYYY-MM-DD");
    const existing = map.get(date);
    if (existing) existing.received += amount;
  }

  for (const payment of filteredPayments) {
    if (!payment.paidDate) continue;
    const amount = parseFloat(payment.amount) || 0;
    const date = dayjs(payment.paidDate).format("YYYY-MM-DD");
    const existing = map.get(date);
    if (existing) existing.paid += amount;
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function buildMultiCurrencyCashFlowChartData(
  entries: CanvasSummaryIncomeEntry[],
  payments: CanvasSummaryExpensePayment[],
  timeRange: string,
  currencyCodes: string[]
): MultiCurrencyCashFlowPoint[] {
  const days = getTimeRangeDays(timeRange);
  const startDate = dayjs().subtract(days, "day");
  const map = new Map<string, MultiCurrencyCashFlowPoint>();

  for (let i = 0; i <= days; i++) {
    const date = startDate.add(i, "day").format("YYYY-MM-DD");
    const point: MultiCurrencyCashFlowPoint = { date };
    for (const code of currencyCodes) {
      point[getReceivedSeriesKey(code)] = 0;
      point[getPaidSeriesKey(code)] = 0;
    }
    map.set(date, point);
  }

  for (const entry of entries) {
    if (!entry.receivedDate || !currencyCodes.includes(entry.currencyCode)) continue;
    const amount = parseFloat(entry.amount) || 0;
    const date = dayjs(entry.receivedDate).format("YYYY-MM-DD");
    const existing = map.get(date);
    const key = getReceivedSeriesKey(entry.currencyCode);
    if (existing) {
      existing[key] = (Number(existing[key]) || 0) + amount;
    }
  }

  for (const payment of payments) {
    if (!payment.paidDate || !currencyCodes.includes(payment.currencyCode)) continue;
    const amount = parseFloat(payment.amount) || 0;
    const date = dayjs(payment.paidDate).format("YYYY-MM-DD");
    const existing = map.get(date);
    const key = getPaidSeriesKey(payment.currencyCode);
    if (existing) {
      existing[key] = (Number(existing[key]) || 0) + amount;
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
