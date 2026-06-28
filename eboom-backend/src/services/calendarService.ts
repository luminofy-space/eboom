import { and, eq, gte, inArray, isNotNull, lte, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db/client";
import {
  currencies,
  expensePayments,
  expenses,
  incomeEntries,
  incomes,
  savingsGoals,
  subWallets,
  transfers,
  wallets,
} from "../db/schema";
import type { CalendarEvent, RecurrencePatternInput } from "../types/calendar";

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d;
}

function clampDayOfMonth(year: number, month: number, day: number): number {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Math.min(day, lastDay);
}

function parsePattern(raw: unknown): RecurrencePatternInput | null {
  if (!raw || typeof raw !== "object") return null;
  const pattern = raw as Record<string, unknown>;
  const frequency = pattern.frequency;
  if (
    frequency !== "daily" &&
    frequency !== "weekly" &&
    frequency !== "monthly" &&
    frequency !== "yearly"
  ) {
    return null;
  }

  return {
    frequency,
    interval: Math.max(1, Number(pattern.interval) || 1),
    daysOfWeek: Array.isArray(pattern.daysOfWeek)
      ? pattern.daysOfWeek.map(Number).filter((d) => d >= 0 && d <= 6)
      : undefined,
    dayOfMonth:
      pattern.dayOfMonth !== undefined ? Number(pattern.dayOfMonth) || 1 : undefined,
    startDate: typeof pattern.startDate === "string" ? pattern.startDate : undefined,
    endDate: typeof pattern.endDate === "string" ? pattern.endDate : undefined,
  };
}

export function expandRecurrences(
  pattern: RecurrencePatternInput,
  rangeStart: Date,
  rangeEnd: Date,
  anchor: Date = new Date()
): string[] {
  const patternStart = startOfDay(
    pattern.startDate ? new Date(pattern.startDate) : anchor
  );
  const patternEnd = pattern.endDate
    ? startOfDay(new Date(pattern.endDate))
    : startOfDay(rangeEnd);

  const effectiveStart = startOfDay(
    rangeStart > patternStart ? rangeStart : patternStart
  );
  const effectiveEnd = startOfDay(rangeEnd < patternEnd ? rangeEnd : patternEnd);

  if (effectiveStart > effectiveEnd) return [];

  const interval = Math.max(1, pattern.interval || 1);
  const dates = new Set<string>();

  switch (pattern.frequency) {
    case "daily": {
      let cursor = startOfDay(patternStart);
      while (cursor < effectiveStart) {
        cursor = addDays(cursor, interval);
      }
      while (cursor <= effectiveEnd) {
        dates.add(toDateKey(cursor));
        cursor = addDays(cursor, interval);
      }
      break;
    }
    case "weekly": {
      const daysOfWeek =
        pattern.daysOfWeek && pattern.daysOfWeek.length > 0
          ? pattern.daysOfWeek
          : [patternStart.getUTCDay()];

      let weekStart = startOfDay(patternStart);
      weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());

      while (weekStart <= effectiveEnd) {
        if (weekStart >= patternStart) {
          for (const day of daysOfWeek) {
            const occurrence = addDays(weekStart, day);
            if (
              occurrence >= patternStart &&
              occurrence >= effectiveStart &&
              occurrence <= effectiveEnd
            ) {
              dates.add(toDateKey(occurrence));
            }
          }
        }
        weekStart = addDays(weekStart, 7 * interval);
      }
      break;
    }
    case "monthly": {
      const dayOfMonth = pattern.dayOfMonth ?? patternStart.getUTCDate();
      let cursor = new Date(
        Date.UTC(
          patternStart.getUTCFullYear(),
          patternStart.getUTCMonth(),
          clampDayOfMonth(
            patternStart.getUTCFullYear(),
            patternStart.getUTCMonth(),
            dayOfMonth
          )
        )
      );

      while (cursor < effectiveStart) {
        cursor = addMonths(cursor, interval);
        cursor = new Date(
          Date.UTC(
            cursor.getUTCFullYear(),
            cursor.getUTCMonth(),
            clampDayOfMonth(cursor.getUTCFullYear(), cursor.getUTCMonth(), dayOfMonth)
          )
        );
      }

      while (cursor <= effectiveEnd) {
        if (cursor >= patternStart) {
          dates.add(toDateKey(cursor));
        }
        cursor = addMonths(cursor, interval);
        cursor = new Date(
          Date.UTC(
            cursor.getUTCFullYear(),
            cursor.getUTCMonth(),
            clampDayOfMonth(cursor.getUTCFullYear(), cursor.getUTCMonth(), dayOfMonth)
          )
        );
      }
      break;
    }
    case "yearly": {
      let cursor = new Date(
        Date.UTC(
          patternStart.getUTCFullYear(),
          patternStart.getUTCMonth(),
          patternStart.getUTCDate()
        )
      );

      while (cursor < effectiveStart) {
        cursor = addYears(cursor, interval);
      }

      while (cursor <= effectiveEnd) {
        if (cursor >= patternStart) {
          dates.add(toDateKey(cursor));
        }
        cursor = addYears(cursor, interval);
      }
      break;
    }
  }

  return Array.from(dates).sort();
}

function predictedEventId(type: "income" | "expense", entityId: number, dateKey: string): number {
  const hashSource = `${type}-${entityId}-${dateKey}`;
  let hash = 0;
  for (let i = 0; i < hashSource.length; i++) {
    hash = (hash << 5) - hash + hashSource.charCodeAt(i);
    hash |= 0;
  }
  return hash > 0 ? -hash : hash;
}

function resolveStatus(
  eventDate: Date,
  isCompleted: boolean,
  now: Date
): CalendarEvent["status"] {
  if (isCompleted) return "completed";
  const today = startOfDay(now);
  const due = startOfDay(eventDate);
  if (due < today) return "overdue";
  return "pending";
}

function entryDateKey(date: Date | null | undefined): string | null {
  if (!date) return null;
  return toDateKey(new Date(date));
}

export async function getCalendarEvents(
  canvasId: number,
  startDate?: string,
  endDate?: string
): Promise<CalendarEvent[]> {
  const now = new Date();
  const rangeStart = startOfDay(startDate ? new Date(startDate) : now);
  const rangeEnd = startOfDay(
    endDate ? new Date(endDate) : addMonths(rangeStart, 1)
  );

  const [canvasIncomes, canvasExpenses, currencyRows] = await Promise.all([
    db
      .select()
      .from(incomes)
      .where(and(eq(incomes.canvasId, canvasId), eq(incomes.isArchived, false))),
    db
      .select()
      .from(expenses)
      .where(and(eq(expenses.canvasId, canvasId), eq(expenses.isArchived, false))),
    db.select().from(currencies),
  ]);

  const currencyById = new Map(currencyRows.map((c) => [c.id, c.code]));

  const incomeIds = canvasIncomes.map((i) => i.id);
  const expenseIds = canvasExpenses.map((e) => e.id);

  const [entries, payments] = await Promise.all([
    incomeIds.length
      ? db
          .select()
          .from(incomeEntries)
          .where(
            and(
              inArray(incomeEntries.incomeId, incomeIds),
              or(
                and(
                  isNotNull(incomeEntries.expectedDate),
                  gte(incomeEntries.expectedDate, rangeStart),
                  lte(incomeEntries.expectedDate, rangeEnd)
                ),
                and(
                  isNotNull(incomeEntries.receivedDate),
                  gte(incomeEntries.receivedDate, rangeStart),
                  lte(incomeEntries.receivedDate, rangeEnd)
                )
              )
            )
          )
      : Promise.resolve([]),
    expenseIds.length
      ? db
          .select()
          .from(expensePayments)
          .where(
            and(
              inArray(expensePayments.expenseId, expenseIds),
              or(
                and(
                  isNotNull(expensePayments.dueDate),
                  gte(expensePayments.dueDate, rangeStart),
                  lte(expensePayments.dueDate, rangeEnd)
                ),
                and(
                  isNotNull(expensePayments.paidDate),
                  gte(expensePayments.paidDate, rangeStart),
                  lte(expensePayments.paidDate, rangeEnd)
                )
              )
            )
          )
      : Promise.resolve([]),
  ]);

  const allIncomeEntries = incomeIds.length
    ? await db
        .select()
        .from(incomeEntries)
        .where(inArray(incomeEntries.incomeId, incomeIds))
    : [];

  const allExpensePayments = expenseIds.length
    ? await db
        .select()
        .from(expensePayments)
        .where(inArray(expensePayments.expenseId, expenseIds))
    : [];

  const events: CalendarEvent[] = [];
  const coveredIncomeDates = new Map<number, Set<string>>();
  const coveredExpenseDates = new Map<number, Set<string>>();

  for (const income of canvasIncomes) {
    const currency = currencyById.get(income.currencyId) ?? "";
    const incomeEntriesForEntity = allIncomeEntries.filter((e) => e.incomeId === income.id);

    for (const entry of entries.filter((e) => e.incomeId === income.id)) {
      const eventDate = entry.expectedDate ?? entry.receivedDate;
      if (!eventDate) continue;

      const dateKey = entryDateKey(eventDate);
      if (!dateKey) continue;

      if (!coveredIncomeDates.has(income.id)) {
        coveredIncomeDates.set(income.id, new Set());
      }
      coveredIncomeDates.get(income.id)!.add(dateKey);

      events.push({
        id: entry.id,
        type: "income",
        entityId: income.id,
        entryId: entry.id,
        date: new Date(eventDate).toISOString(),
        amount: String(entry.amount),
        currency,
        status: resolveStatus(new Date(eventDate), !!entry.receivedDate, now),
        isPredicted: false,
        info: income.name,
      });
    }

    if (income.isRecurring) {
      const pattern = parsePattern(income.recurrencePattern);
      if (!pattern) continue;

      const anchor =
        incomeEntriesForEntity.find((e) => e.expectedDate)?.expectedDate ??
        income.createdAt ??
        now;

      const occurrenceDates = expandRecurrences(pattern, rangeStart, rangeEnd, new Date(anchor));

      for (const dateKey of occurrenceDates) {
        if (coveredIncomeDates.get(income.id)?.has(dateKey)) continue;

        const matchingEntry = incomeEntriesForEntity.find(
          (e) => entryDateKey(e.expectedDate) === dateKey
        );

        if (matchingEntry) continue;

        events.push({
          id: predictedEventId("income", income.id, dateKey),
          type: "income",
          entityId: income.id,
          date: new Date(`${dateKey}T00:00:00.000Z`).toISOString(),
          amount: String(income.amount),
          currency,
          status: resolveStatus(new Date(`${dateKey}T00:00:00.000Z`), false, now),
          isPredicted: true,
          info: income.name,
        });
      }
    }
  }

  for (const expense of canvasExpenses) {
    const currency = currencyById.get(expense.currencyId) ?? "";
    const expensePaymentsForEntity = allExpensePayments.filter(
      (p) => p.expenseId === expense.id
    );
    const defaultAmount =
      expensePaymentsForEntity.length > 0
        ? String(expensePaymentsForEntity[expensePaymentsForEntity.length - 1].amount)
        : "0";

    for (const payment of payments.filter((p) => p.expenseId === expense.id)) {
      const eventDate = payment.dueDate ?? payment.paidDate;
      if (!eventDate) continue;

      const dateKey = entryDateKey(eventDate);
      if (!dateKey) continue;

      if (!coveredExpenseDates.has(expense.id)) {
        coveredExpenseDates.set(expense.id, new Set());
      }
      coveredExpenseDates.get(expense.id)!.add(dateKey);

      events.push({
        id: payment.id + 1_000_000_000,
        type: "expense",
        entityId: expense.id,
        entryId: payment.id,
        date: new Date(eventDate).toISOString(),
        amount: String(payment.amount),
        currency,
        status: resolveStatus(new Date(eventDate), !!payment.paidDate, now),
        isPredicted: false,
        info: expense.name,
      });
    }

    if (expense.isRecurring) {
      const pattern = parsePattern(expense.recurrencePattern);
      if (!pattern) continue;

      const anchor =
        expensePaymentsForEntity.find((p) => p.dueDate)?.dueDate ??
        expense.createdAt ??
        now;

      const occurrenceDates = expandRecurrences(pattern, rangeStart, rangeEnd, new Date(anchor));

      for (const dateKey of occurrenceDates) {
        if (coveredExpenseDates.get(expense.id)?.has(dateKey)) continue;

        const matchingPayment = expensePaymentsForEntity.find(
          (p) => entryDateKey(p.dueDate) === dateKey
        );

        if (matchingPayment) continue;

        events.push({
          id: predictedEventId("expense", expense.id, dateKey),
          type: "expense",
          entityId: expense.id,
          date: new Date(`${dateKey}T00:00:00.000Z`).toISOString(),
          amount: defaultAmount,
          currency,
          status: resolveStatus(new Date(`${dateKey}T00:00:00.000Z`), false, now),
          isPredicted: true,
          info: expense.name,
        });
      }
    }
  }

  const calSourceSubWallet = alias(subWallets, "cal_source_sub_wallet");
  const calDestSubWallet = alias(subWallets, "cal_dest_sub_wallet");
  const calSourceWallet = alias(wallets, "cal_source_wallet");
  const calDestWallet = alias(wallets, "cal_dest_wallet");
  const calSourceCurrency = alias(currencies, "cal_source_currency");
  const calDestCurrency = alias(currencies, "cal_dest_currency");

  const transferRows = await db
    .select({
      id: transfers.id,
      sourceAmount: transfers.sourceAmount,
      destinationAmount: transfers.destinationAmount,
      transactionFee: transfers.transactionFee,
      transferDate: transfers.transferDate,
      sourceWalletName: calSourceWallet.name,
      destinationWalletName: calDestWallet.name,
      sourceCurrencyCode: calSourceCurrency.code,
      destinationCurrencyCode: calDestCurrency.code,
    })
    .from(transfers)
    .innerJoin(calSourceSubWallet, eq(transfers.sourceWalletId, calSourceSubWallet.id))
    .innerJoin(calSourceWallet, eq(calSourceSubWallet.walletId, calSourceWallet.id))
    .innerJoin(calSourceCurrency, eq(calSourceSubWallet.currencyId, calSourceCurrency.id))
    .innerJoin(calDestSubWallet, eq(transfers.destinationWalletId, calDestSubWallet.id))
    .innerJoin(calDestWallet, eq(calDestSubWallet.walletId, calDestWallet.id))
    .innerJoin(calDestCurrency, eq(calDestSubWallet.currencyId, calDestCurrency.id))
    .where(
      and(
        eq(calSourceWallet.canvasId, canvasId),
        gte(transfers.transferDate, rangeStart),
        lte(transfers.transferDate, rangeEnd)
      )
    );

  for (const transfer of transferRows) {
    if (!transfer.transferDate) continue;

    events.push({
      id: transfer.id + 2_000_000_000,
      type: "transfer",
      entityId: transfer.id,
      entryId: transfer.id,
      date: new Date(transfer.transferDate).toISOString(),
      amount: String(transfer.destinationAmount),
      currency: transfer.destinationCurrencyCode,
      secondaryAmount: String(transfer.sourceAmount),
      secondaryCurrency: transfer.sourceCurrencyCode,
      status: "completed",
      isPredicted: false,
      info: `${transfer.sourceWalletName} → ${transfer.destinationWalletName}`,
    });
  }

  const goalRows = await db
    .select({
      id: savingsGoals.id,
      name: savingsGoals.name,
      targetAmount: savingsGoals.targetAmount,
      targetDate: savingsGoals.targetDate,
      currencyCode: currencies.code,
    })
    .from(savingsGoals)
    .innerJoin(currencies, eq(savingsGoals.currencyId, currencies.id))
    .where(
      and(
        eq(savingsGoals.canvasId, canvasId),
        eq(savingsGoals.status, "active"),
        isNotNull(savingsGoals.targetDate),
        gte(savingsGoals.targetDate, toDateKey(rangeStart)),
        lte(savingsGoals.targetDate, toDateKey(rangeEnd))
      )
    );

  for (const goal of goalRows) {
    if (!goal.targetDate) continue;

    const { getSavingsGoalProgress } = await import("./planningService");
    const progress = await getSavingsGoalProgress(goal.id);
    const targetDate = startOfDay(new Date(goal.targetDate));
    const today = startOfDay(now);

    events.push({
      id: goal.id + 3_000_000_000,
      type: "goal",
      entityId: goal.id,
      date: targetDate.toISOString(),
      amount: String(goal.targetAmount),
      currency: goal.currencyCode,
      status: targetDate < today ? "overdue" : "pending",
      isPredicted: false,
      info: goal.name,
      goalPercent: progress?.percent ?? 0,
      daysRemaining: progress?.daysRemaining ?? null,
    });
  }

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
