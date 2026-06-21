import dayjs from "dayjs";
import type {
  CanvasSummaryExpensePayment,
  CanvasSummaryIncomeEntry,
} from "../types";

export interface CashFlowChartPoint {
  date: string;
  received: number;
  paid: number;
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
