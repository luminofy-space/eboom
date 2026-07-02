import dayjs from "dayjs";
import type {
  CanvasSummaryExpensePayment,
  CanvasSummaryIncomeEntry,
} from "../types";

const INTENSITY_STEPS = 4;

export interface YearlyHeatmapDay {
  date: string;
  weekIndex: number;
  dayIndex: number;
  inYear: boolean;
  income: number;
  expense: number;
  net: number;
  direction: "profit" | "loss" | "neutral";
  intensity: number;
}

export interface YearlyHeatmapMonthLabel {
  weekIndex: number;
  monthIndex: number;
}

export interface YearlyHeatmapData {
  days: YearlyHeatmapDay[];
  totalWeeks: number;
  monthLabels: YearlyHeatmapMonthLabel[];
}

export function getDashboardCurrencyCodes(
  entries: CanvasSummaryIncomeEntry[],
  payments: CanvasSummaryExpensePayment[]
): string[] {
  return Array.from(
    new Set([
      ...entries.map((entry) => entry.currencyCode),
      ...payments.map((payment) => payment.currencyCode),
    ])
  ).sort((a, b) => a.localeCompare(b));
}

function getIntensity(value: number, maxValue: number): number {
  if (value <= 0 || maxValue <= 0) return 0;
  const ratio = Math.min(1, value / maxValue);
  return Math.max(1, Math.ceil(ratio * INTENSITY_STEPS));
}

export function getAvailableHeatmapYears(
  entries: CanvasSummaryIncomeEntry[],
  payments: CanvasSummaryExpensePayment[],
  currencyCode?: string
): number[] {
  const years = new Set<number>();
  const nowYear = dayjs().year();
  years.add(nowYear);

  for (const entry of entries) {
    if (currencyCode && entry.currencyCode !== currencyCode) continue;
    if (!entry.receivedDate) continue;
    years.add(dayjs(entry.receivedDate).year());
  }

  for (const payment of payments) {
    if (currencyCode && payment.currencyCode !== currencyCode) continue;
    if (!payment.paidDate) continue;
    years.add(dayjs(payment.paidDate).year());
  }

  return Array.from(years).sort((a, b) => b - a);
}

export function buildYearlyHeatmapData(
  entries: CanvasSummaryIncomeEntry[],
  payments: CanvasSummaryExpensePayment[],
  year: number,
  currencyCode?: string
): YearlyHeatmapData {
  const yearStart = dayjs(`${year}-01-01`);
  const yearEnd = dayjs(`${year}-12-31`);
  const heatmapStart = yearStart.startOf("week");
  const heatmapEnd = yearEnd.endOf("week");
  const totalDays = heatmapEnd.diff(heatmapStart, "day") + 1;

  const map = new Map<
    string,
    { weekIndex: number; dayIndex: number; inYear: boolean; income: number; expense: number }
  >();

  for (let i = 0; i < totalDays; i++) {
    const date = heatmapStart.add(i, "day");
    const dateKey = date.format("YYYY-MM-DD");
    map.set(dateKey, {
      weekIndex: Math.floor(i / 7),
      dayIndex: date.day(),
      inYear: date.isSame(yearStart, "year"),
      income: 0,
      expense: 0,
    });
  }

  const filteredEntries = currencyCode
    ? entries.filter((entry) => entry.currencyCode === currencyCode)
    : entries;
  const filteredPayments = currencyCode
    ? payments.filter((payment) => payment.currencyCode === currencyCode)
    : payments;

  for (const entry of filteredEntries) {
    if (!entry.receivedDate) continue;
    const dateKey = dayjs(entry.receivedDate).format("YYYY-MM-DD");
    const existing = map.get(dateKey);
    if (!existing) continue;
    existing.income += parseFloat(entry.amount) || 0;
  }

  for (const payment of filteredPayments) {
    if (!payment.paidDate) continue;
    const dateKey = dayjs(payment.paidDate).format("YYYY-MM-DD");
    const existing = map.get(dateKey);
    if (!existing) continue;
    existing.expense += parseFloat(payment.amount) || 0;
  }

  let maxProfit = 0;
  let maxLoss = 0;
  for (const item of map.values()) {
    const net = item.income - item.expense;
    if (net > 0) maxProfit = Math.max(maxProfit, net);
    if (net < 0) maxLoss = Math.max(maxLoss, Math.abs(net));
  }

  const days: YearlyHeatmapDay[] = Array.from(map.entries())
    .map(([date, item]) => {
      const net = item.income - item.expense;
      const direction: YearlyHeatmapDay["direction"] =
        net > 0 ? "profit" : net < 0 ? "loss" : "neutral";
      const intensity =
        direction === "profit"
          ? getIntensity(net, maxProfit)
          : direction === "loss"
            ? getIntensity(Math.abs(net), maxLoss)
            : 0;
      return {
        date,
        weekIndex: item.weekIndex,
        dayIndex: item.dayIndex,
        inYear: item.inYear,
        income: item.income,
        expense: item.expense,
        net,
        direction,
        intensity,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const monthLabels: YearlyHeatmapMonthLabel[] = [];
  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const monthDate = dayjs(new Date(year, monthIndex, 1));
    const weekIndex = Math.floor(monthDate.startOf("week").diff(heatmapStart, "day") / 7);
    const lastLabel = monthLabels[monthLabels.length - 1];
    if (!lastLabel || lastLabel.weekIndex !== weekIndex) {
      monthLabels.push({ weekIndex, monthIndex });
    }
  }

  return {
    days,
    totalWeeks: Math.ceil(totalDays / 7),
    monthLabels,
  };
}
