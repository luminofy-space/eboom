import dayjs from "dayjs";
import type { ExpensePayment } from "../components/ExpensePaymentsTable";

export interface ChartDataPoint {
  date: string;
  paid: number;
  due: number;
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
  payments: ExpensePayment[],
  timeRange: string
): ChartDataPoint[] {
  const days = getTimeRangeDays(timeRange);
  const startDate = dayjs().subtract(days, "day").startOf("day");

  const dateMap = new Map<string, ChartDataPoint>();

  const addToMap = (dateStr: string, field: "paid" | "due", amount: number) => {
    if (dayjs(dateStr).isBefore(startDate)) return;
    const existing = dateMap.get(dateStr) ?? { date: dateStr, paid: 0, due: 0 };
    existing[field] += amount;
    dateMap.set(dateStr, existing);
  };

  for (const payment of payments) {
    const amount = parseFloat(payment.amount) || 0;
    if (payment.paidDate) {
      addToMap(dayjs(payment.paidDate).format("YYYY-MM-DD"), "paid", amount);
    } else if (payment.dueDate) {
      addToMap(dayjs(payment.dueDate).format("YYYY-MM-DD"), "due", amount);
    }
  }

  return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export interface ExpenseStats {
  totalPaid: number;
  totalUnpaid: number;
  paymentCount: number;
  paidCount: number;
  unpaidCount: number;
  averagePaid: number;
  monthOverMonthChange: number | null;
}

export function computeExpenseStats(payments: ExpensePayment[]): ExpenseStats {
  const paid = payments.filter((p) => p.paidDate);
  const unpaid = payments.filter((p) => !p.paidDate);

  const totalPaid = paid.reduce(
    (sum, p) => sum + (parseFloat(p.amount) || 0),
    0
  );
  const totalUnpaid = unpaid.reduce(
    (sum, p) => sum + (parseFloat(p.amount) || 0),
    0
  );

  const now = dayjs();
  const thisMonthTotal = paid
    .filter((p) => dayjs(p.paidDate).isSame(now, "month"))
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const lastMonthTotal = paid
    .filter((p) => dayjs(p.paidDate).isSame(now.subtract(1, "month"), "month"))
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  let monthOverMonthChange: number | null = null;
  if (lastMonthTotal > 0) {
    monthOverMonthChange =
      ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
  } else if (thisMonthTotal > 0) {
    monthOverMonthChange = 100;
  }

  return {
    totalPaid,
    totalUnpaid,
    paymentCount: payments.length,
    paidCount: paid.length,
    unpaidCount: unpaid.length,
    averagePaid: paid.length > 0 ? totalPaid / paid.length : 0,
    monthOverMonthChange,
  };
}
