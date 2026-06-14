import dayjs from "dayjs";
import type { IncomeEntry } from "../component/IncomeEntriesTable";

export interface ChartDataPoint {
  date: string;
  received: number;
  expected: number;
}

export function formatMoney(amount: number, symbol?: string): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return symbol ? `${symbol}${formatted}` : formatted;
}

export function getTimeRangeDays(timeRange: string): number {
  if (timeRange === "7d") return 7;
  if (timeRange === "30d") return 30;
  return 90;
}

export function buildChartData(
  entries: IncomeEntry[],
  timeRange: string
): ChartDataPoint[] {
  const days = getTimeRangeDays(timeRange);
  const startDate = dayjs().subtract(days, "day");
  const map = new Map<string, ChartDataPoint>();

  for (let i = 0; i <= days; i++) {
    const date = startDate.add(i, "day").format("YYYY-MM-DD");
    map.set(date, { date, received: 0, expected: 0 });
  }

  for (const entry of entries) {
    const amount = parseFloat(entry.amount) || 0;
    if (entry.receivedDate) {
      const date = dayjs(entry.receivedDate).format("YYYY-MM-DD");
      const existing = map.get(date);
      if (existing) existing.received += amount;
    } else if (entry.expectedDate) {
      const date = dayjs(entry.expectedDate).format("YYYY-MM-DD");
      const existing = map.get(date);
      if (existing) existing.expected += amount;
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export interface IncomeStats {
  totalReceived: number;
  totalPending: number;
  entryCount: number;
  receivedCount: number;
  pendingCount: number;
  averageReceived: number;
  monthOverMonthChange: number | null;
}

export function computeIncomeStats(entries: IncomeEntry[]): IncomeStats {
  const received = entries.filter((e) => e.receivedDate);
  const pending = entries.filter((e) => !e.receivedDate);

  const totalReceived = received.reduce(
    (sum, e) => sum + (parseFloat(e.amount) || 0),
    0
  );
  const totalPending = pending.reduce(
    (sum, e) => sum + (parseFloat(e.amount) || 0),
    0
  );

  const now = dayjs();
  const thisMonthTotal = received
    .filter((e) => dayjs(e.receivedDate).isSame(now, "month"))
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const lastMonthTotal = received
    .filter((e) => dayjs(e.receivedDate).isSame(now.subtract(1, "month"), "month"))
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  let monthOverMonthChange: number | null = null;
  if (lastMonthTotal > 0) {
    monthOverMonthChange =
      ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
  } else if (thisMonthTotal > 0) {
    monthOverMonthChange = 100;
  }

  return {
    totalReceived,
    totalPending,
    entryCount: entries.length,
    receivedCount: received.length,
    pendingCount: pending.length,
    averageReceived:
      received.length > 0 ? totalReceived / received.length : 0,
    monthOverMonthChange,
  };
}
