import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

export interface WalletEntry {
  id: number;
  incomeId: number;
  incomeName?: string;
  categoryName?: string;
  destinationWalletId: number;
  amount: string;
  expectedDate: string | null;
  receivedDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface WalletPayment {
  id: number;
  expenseId: number;
  expenseName?: string;
  categoryName?: string;
  sourceWalletId: number;
  amount: string;
  dueDate: string | null;
  paidDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface WalletStats {
  totalReceived: number;
  receivedCount: number;
  totalPending: number;
  pendingCount: number;
  totalPaid: number;
  paidCount: number;
  totalDue: number;
  dueCount: number;
  entryCount: number;
  paymentCount: number;
  averageReceived: number;
  averagePaid: number;
  monthOverMonthEntryChange: number | null;
  monthOverMonthPaymentChange: number | null;
}

export function computeWalletStats(entries: WalletEntry[], payments: WalletPayment[]): WalletStats {
  const now = dayjs();
  const currentMonth = now.startOf("month");
  const previousMonth = currentMonth.subtract(1, "month");

  // Income entries stats
  const receivedEntries = entries.filter((e) => e.receivedDate);
  const totalReceived = receivedEntries.reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0);
  const receivedCount = receivedEntries.length;
  const averageReceived = receivedCount > 0 ? totalReceived / receivedCount : 0;

  const pendingEntries = entries.filter(
    (e) => !e.receivedDate && (!e.expectedDate || dayjs(e.expectedDate).isAfter(now, "day"))
  );
  const totalPending = pendingEntries.reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0);
  const pendingCount = pendingEntries.length;

  // Expense payments stats
  const paidPayments = payments.filter((p) => p.paidDate);
  const totalPaid = paidPayments.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
  const paidCount = paidPayments.length;
  const averagePaid = paidCount > 0 ? totalPaid / paidCount : 0;

  const duePayments = payments.filter(
    (p) => !p.paidDate && (!p.dueDate || dayjs(p.dueDate).isBefore(now, "day"))
  );
  const totalDue = duePayments.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
  const dueCount = duePayments.length;

  // Month-over-month changes
  const currentMonthReceivedCount = receivedEntries.filter((e) =>
    dayjs(e.receivedDate).isBetween(currentMonth, now, null, "[]")
  ).length;
  const previousMonthReceivedCount = receivedEntries.filter((e) =>
    dayjs(e.receivedDate).isBetween(previousMonth, currentMonth, null, "[]")
  ).length;
  const monthOverMonthEntryChange =
    previousMonthReceivedCount > 0
      ? ((currentMonthReceivedCount - previousMonthReceivedCount) / previousMonthReceivedCount) * 100
      : null;

  const currentMonthPaidCount = paidPayments.filter((p) =>
    dayjs(p.paidDate).isBetween(currentMonth, now, null, "[]")
  ).length;
  const previousMonthPaidCount = paidPayments.filter((p) =>
    dayjs(p.paidDate).isBetween(previousMonth, currentMonth, null, "[]")
  ).length;
  const monthOverMonthPaymentChange =
    previousMonthPaidCount > 0
      ? ((currentMonthPaidCount - previousMonthPaidCount) / previousMonthPaidCount) * 100
      : null;

  return {
    totalReceived,
    receivedCount,
    totalPending,
    pendingCount,
    totalPaid,
    paidCount,
    totalDue,
    dueCount,
    entryCount: entries.length,
    paymentCount: payments.length,
    averageReceived,
    averagePaid,
    monthOverMonthEntryChange,
    monthOverMonthPaymentChange,
  };
}

export function formatMoney(amount: number | string, symbol?: string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return "—";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(num);
  return symbol ? `${symbol}${formatted}` : formatted;
}

interface ChartDataPoint {
  date: string;
  entries: number;
  payments: number;
}

export function buildChartData(
  entries: WalletEntry[],
  payments: WalletPayment[],
  timeRange: string
): ChartDataPoint[] {
  const days = getTimeRangeDays(timeRange);
  const startDate = dayjs().subtract(days, "day");
  const map = new Map<string, ChartDataPoint>();

  // Initialize dates
  for (let i = 0; i <= days; i++) {
    const date = startDate.add(i, "day").format("YYYY-MM-DD");
    map.set(date, { date, entries: 0, payments: 0 });
  }

  // Add entries
  entries
    .filter((e) => e.receivedDate)
    .forEach((e) => {
      const date = dayjs(e.receivedDate).format("YYYY-MM-DD");
      const existing = map.get(date);
      if (existing) {
        existing.entries += parseFloat(e.amount || "0");
      }
    });

  // Add payments
  payments
    .filter((p) => p.paidDate)
    .forEach((p) => {
      const date = dayjs(p.paidDate).format("YYYY-MM-DD");
      const existing = map.get(date);
      if (existing) {
        existing.payments += parseFloat(p.amount || "0");
      }
    });

  return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getTimeRangeDays(timeRange: string): number {
  switch (timeRange) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
    default:
      return 90;
  }
}