import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { formatMoney } from "@/src/i18n/formatters";

export { formatMoney };

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
  currencyId?: number;
  currencyCode?: string;
  currencySymbol?: string;
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
  currencyId?: number;
  currencyCode?: string;
  currencySymbol?: string;
}

export interface WalletTransfer {
  id: number;
  sourceWalletId: number;
  sourceWalletName: string;
  sourceCurrencyId: number;
  sourceCurrencyCode: string;
  sourceCurrencySymbol: string;
  destinationWalletId: number;
  destinationWalletName: string;
  destinationCurrencyId: number;
  destinationCurrencyCode: string;
  destinationCurrencySymbol: string;
  sourceAmount: string;
  destinationAmount: string;
  exchangeRate: string | null;
  transactionFee: string;
  transferDate: string;
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
  transferInCount: number;
  transferOutCount: number;
  averageReceived: number;
  averagePaid: number;
  monthOverMonthEntryChange: number | null;
  monthOverMonthPaymentChange: number | null;
}

export function computeWalletStats(
  entries: WalletEntry[],
  payments: WalletPayment[],
  transfers: WalletTransfer[] = [],
  walletId?: number
): WalletStats {
  const now = dayjs();
  const currentMonth = now.startOf("month");
  const previousMonth = currentMonth.subtract(1, "month");

  // Income entries stats
  const receivedEntries = entries.filter((e) => e.receivedDate);
  const totalReceived = receivedEntries.reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0);
  const receivedCount = receivedEntries.length;

  const pendingEntries = entries.filter(
    (e) => !e.receivedDate && (!e.expectedDate || dayjs(e.expectedDate).isAfter(now, "day"))
  );
  const totalPending = pendingEntries.reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0);
  const pendingCount = pendingEntries.length;

  // Expense payments stats
  const paidPayments = payments.filter((p) => p.paidDate);
  const totalPaid = paidPayments.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
  const paidCount = paidPayments.length;

  const duePayments = payments.filter(
    (p) => !p.paidDate && (!p.dueDate || dayjs(p.dueDate).isBefore(now, "day"))
  );
  const totalDue = duePayments.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
  const dueCount = duePayments.length;

  const transferIn = walletId
    ? transfers.filter((t) => t.destinationWalletId === walletId)
    : [];
  const transferOut = walletId
    ? transfers.filter((t) => t.sourceWalletId === walletId)
    : [];

  const totalTransferIn = transferIn.reduce(
    (sum, t) => sum + parseFloat(t.destinationAmount || "0"),
    0
  );
  const totalTransferOut = transferOut.reduce(
    (sum, t) => sum + parseFloat(t.sourceAmount || "0"),
    0
  );

  const combinedTotalReceived = totalReceived + totalTransferIn;
  const combinedReceivedCount = receivedCount + transferIn.length;
  const combinedTotalPaid = totalPaid + totalTransferOut;
  const combinedPaidCount = paidCount + transferOut.length;

  // Month-over-month changes
  const currentMonthReceivedCount = receivedEntries.filter((e) =>
    dayjs(e.receivedDate).isBetween(currentMonth, now, null, "[]")
  ).length;
  const previousMonthReceivedCount = receivedEntries.filter((e) =>
    dayjs(e.receivedDate).isBetween(previousMonth, currentMonth, null, "[]")
  ).length;
  const currentMonthTransferInCount = transferIn.filter((t) =>
    dayjs(t.transferDate).isBetween(currentMonth, now, null, "[]")
  ).length;
  const previousMonthTransferInCount = transferIn.filter((t) =>
    dayjs(t.transferDate).isBetween(previousMonth, currentMonth, null, "[]")
  ).length;
  const monthOverMonthEntryChange =
    previousMonthReceivedCount + previousMonthTransferInCount > 0
      ? ((currentMonthReceivedCount +
          currentMonthTransferInCount -
          (previousMonthReceivedCount + previousMonthTransferInCount)) /
          (previousMonthReceivedCount + previousMonthTransferInCount)) *
        100
      : null;

  const currentMonthPaidCount = paidPayments.filter((p) =>
    dayjs(p.paidDate).isBetween(currentMonth, now, null, "[]")
  ).length;
  const previousMonthPaidCount = paidPayments.filter((p) =>
    dayjs(p.paidDate).isBetween(previousMonth, currentMonth, null, "[]")
  ).length;
  const currentMonthTransferOutCount = transferOut.filter((t) =>
    dayjs(t.transferDate).isBetween(currentMonth, now, null, "[]")
  ).length;
  const previousMonthTransferOutCount = transferOut.filter((t) =>
    dayjs(t.transferDate).isBetween(previousMonth, currentMonth, null, "[]")
  ).length;
  const monthOverMonthPaymentChange =
    previousMonthPaidCount + previousMonthTransferOutCount > 0
      ? ((currentMonthPaidCount +
          currentMonthTransferOutCount -
          (previousMonthPaidCount + previousMonthTransferOutCount)) /
          (previousMonthPaidCount + previousMonthTransferOutCount)) *
        100
      : null;

  return {
    totalReceived: combinedTotalReceived,
    receivedCount: combinedReceivedCount,
    totalPending,
    pendingCount,
    totalPaid: combinedTotalPaid,
    paidCount: combinedPaidCount,
    totalDue,
    dueCount,
    entryCount: entries.length,
    paymentCount: payments.length,
    transferInCount: transferIn.length,
    transferOutCount: transferOut.length,
    averageReceived: combinedReceivedCount > 0 ? combinedTotalReceived / combinedReceivedCount : 0,
    averagePaid: combinedPaidCount > 0 ? combinedTotalPaid / combinedPaidCount : 0,
    monthOverMonthEntryChange,
    monthOverMonthPaymentChange,
  };
}

interface ChartDataPoint {
  date: string;
  entries: number;
  payments: number;
  transferIn: number;
  transferOut: number;
}

export function buildChartData(
  entries: WalletEntry[],
  payments: WalletPayment[],
  transfers: WalletTransfer[],
  walletId: number,
  timeRange: string
): ChartDataPoint[] {
  const days = getTimeRangeDays(timeRange);
  const startDate = dayjs().subtract(days, "day");
  const map = new Map<string, ChartDataPoint>();

  for (let i = 0; i <= days; i++) {
    const date = startDate.add(i, "day").format("YYYY-MM-DD");
    map.set(date, { date, entries: 0, payments: 0, transferIn: 0, transferOut: 0 });
  }

  entries
    .filter((e) => e.receivedDate)
    .forEach((e) => {
      const date = dayjs(e.receivedDate).format("YYYY-MM-DD");
      const existing = map.get(date);
      if (existing) {
        existing.entries += parseFloat(e.amount || "0");
      }
    });

  payments
    .filter((p) => p.paidDate)
    .forEach((p) => {
      const date = dayjs(p.paidDate).format("YYYY-MM-DD");
      const existing = map.get(date);
      if (existing) {
        existing.payments += parseFloat(p.amount || "0");
      }
    });

  transfers.forEach((transfer) => {
    const date = dayjs(transfer.transferDate).format("YYYY-MM-DD");
    const existing = map.get(date);
    if (!existing) return;

    if (transfer.destinationWalletId === walletId) {
      existing.transferIn += parseFloat(transfer.destinationAmount || "0");
    }
    if (transfer.sourceWalletId === walletId) {
      existing.transferOut += parseFloat(transfer.sourceAmount || "0");
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