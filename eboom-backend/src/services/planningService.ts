import { and, eq, gte, inArray, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { db } from "../db/client";
import {
  budgetLines,
  budgets,
  currencies,
  expenseCategories,
  expensePayments,
  expenses,
  savingsGoals,
  subWallets,
  wallets,
} from "../db/schema";
import { getCalendarEvents } from "./calendarService";
import type {
  BudgetAlertNotification,
  BudgetLineInput,
  BudgetLineProgress,
  BudgetPeriodType,
  BudgetProgress,
  BudgetSuggestionCategory,
  BudgetSuggestions,
  BudgetCurrencyDashboardCard,
  BudgetDashboardSummary,
  BudgetPeriodDashboardSummary,
  CashFlowForecast,
  ForecastDayPoint,
  PeriodBounds,
  SavingsGoalProgress,
} from "../types/planning";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseAmount(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

function formatAmount(value: number): string {
  return value.toFixed(8).replace(/\.?0+$/, "") || "0";
}

function roundToFriendly(value: number): number {
  if (value <= 0) return 0;
  if (value < 100) return Math.ceil(value / 5) * 5;
  return Math.ceil(value / 10) * 10;
}

function getWeekStart(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export function resolvePeriodBounds(
  periodType: BudgetPeriodType,
  referenceDate: Date = new Date()
): PeriodBounds {
  const ref = startOfDay(referenceDate);

  if (periodType === "weekly") {
    const start = getWeekStart(ref);
    const end = endOfDay(addDays(start, 6));
    return { start, end, periodKey: `week:${toDateKey(start)}` };
  }

  if (periodType === "yearly") {
    const start = startOfDay(new Date(Date.UTC(ref.getUTCFullYear(), 0, 1)));
    const end = endOfDay(new Date(Date.UTC(ref.getUTCFullYear(), 11, 31)));
    return { start, end, periodKey: `year:${ref.getUTCFullYear()}` };
  }

  const start = startOfDay(new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1)));
  const lastDay = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0));
  const end = endOfDay(lastDay);
  return {
    start,
    end,
    periodKey: `month:${ref.getUTCFullYear()}-${String(ref.getUTCMonth() + 1).padStart(2, "0")}`,
  };
}

export function resolvePreviousPeriodBounds(
  periodType: BudgetPeriodType,
  referenceDate: Date = new Date()
): PeriodBounds {
  const current = resolvePeriodBounds(periodType, referenceDate);

  if (periodType === "weekly") {
    return resolvePeriodBounds(periodType, addDays(current.start, -1));
  }
  if (periodType === "yearly") {
    const prev = new Date(current.start);
    prev.setUTCFullYear(prev.getUTCFullYear() - 1);
    return resolvePeriodBounds(periodType, prev);
  }

  const prev = new Date(current.start);
  prev.setUTCMonth(prev.getUTCMonth() - 1);
  return resolvePeriodBounds(periodType, prev);
}

function computePercent(spent: number, limit: number): number {
  if (limit <= 0) return spent > 0 ? 100 : 0;
  return Math.round((spent / limit) * 1000) / 10;
}

async function aggregateSpentByCategory(
  canvasId: number,
  currencyId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<Map<number, { spent: number; count: number }>> {
  const rows = await db
    .select({
      categoryId: expenses.expenseCategoryId,
      amount: expensePayments.amount,
    })
    .from(expensePayments)
    .innerJoin(expenses, eq(expensePayments.expenseId, expenses.id))
    .where(
      and(
        eq(expenses.canvasId, canvasId),
        eq(expenses.currencyId, currencyId),
        eq(expenses.isArchived, false),
        isNotNull(expensePayments.paidDate),
        gte(expensePayments.paidDate, periodStart),
        lte(expensePayments.paidDate, periodEnd)
      )
    );

  const map = new Map<number, { spent: number; count: number }>();
  for (const row of rows) {
    const existing = map.get(row.categoryId) ?? { spent: 0, count: 0 };
    existing.spent += parseAmount(row.amount);
    existing.count += 1;
    map.set(row.categoryId, existing);
  }
  return map;
}

async function aggregateTotalSpent(
  canvasId: number,
  currencyId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  const map = await aggregateSpentByCategory(canvasId, currencyId, periodStart, periodEnd);
  let total = 0;
  for (const { spent } of map.values()) total += spent;
  return total;
}

async function countUnscheduledPayments(
  canvasId: number,
  currencyId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(expensePayments)
    .innerJoin(expenses, eq(expensePayments.expenseId, expenses.id))
    .where(
      and(
        eq(expenses.canvasId, canvasId),
        eq(expenses.currencyId, currencyId),
        eq(expenses.isArchived, false),
        isNull(expensePayments.paidDate),
        isNotNull(expensePayments.dueDate),
        gte(expensePayments.dueDate, periodStart),
        lte(expensePayments.dueDate, periodEnd)
      )
    );
  return row?.count ?? 0;
}

export async function getBudgetSuggestions(
  canvasId: number,
  currencyId: number,
  periodType: BudgetPeriodType
): Promise<BudgetSuggestions | null> {
  const [currency] = await db.select().from(currencies).where(eq(currencies.id, currencyId));
  if (!currency) return null;

  const previous = resolvePreviousPeriodBounds(periodType);
  const spentByCategory = await aggregateSpentByCategory(
    canvasId,
    currencyId,
    previous.start,
    previous.end
  );

  const categoryIds = [...spentByCategory.keys()];
  const categoryRows =
    categoryIds.length > 0
      ? await db
          .select({ id: expenseCategories.id, name: expenseCategories.name })
          .from(expenseCategories)
          .where(inArray(expenseCategories.id, categoryIds))
      : [];

  const categoryNameById = new Map(categoryRows.map((c) => [c.id, c.name]));

  const categories: BudgetSuggestionCategory[] = categoryIds
    .map((categoryId) => {
      const data = spentByCategory.get(categoryId)!;
      const friendly = roundToFriendly(data.spent);
      return {
        categoryId,
        categoryName: categoryNameById.get(categoryId) ?? "Unknown",
        suggestedAmount: formatAmount(friendly),
        rawAmount: formatAmount(data.spent),
        paymentCount: data.count,
      };
    })
    .sort((a, b) => parseAmount(b.rawAmount) - parseAmount(a.rawAmount));

  const rawTotal = categories.reduce((sum, c) => sum + parseAmount(c.rawAmount), 0);
  const suggestedTotal = roundToFriendly(rawTotal * 1.1);

  return {
    currencyId,
    currencyCode: currency.code,
    currencySymbol: currency.symbol,
    periodType,
    referencePeriodStart: previous.start.toISOString(),
    referencePeriodEnd: previous.end.toISOString(),
    suggestedTotal: formatAmount(suggestedTotal),
    categories,
  };
}

export async function getCanvasCurrencyUsage(canvasId: number): Promise<
  Array<{ currencyId: number; currencyCode: string; currencySymbol: string; usageCount: number }>
> {
  const expenseRows = await db
    .select({ currencyId: expenses.currencyId })
    .from(expenses)
    .where(and(eq(expenses.canvasId, canvasId), eq(expenses.isArchived, false)));

  const walletRows = await db
    .select({ currencyId: subWallets.currencyId })
    .from(subWallets)
    .innerJoin(wallets, eq(subWallets.walletId, wallets.id))
    .where(and(eq(wallets.canvasId, canvasId), eq(wallets.isArchived, false)));

  const counts = new Map<number, number>();
  for (const row of [...expenseRows, ...walletRows]) {
    counts.set(row.currencyId, (counts.get(row.currencyId) ?? 0) + 1);
  }

  if (counts.size === 0) return [];

  const currencyRows = await db
    .select()
    .from(currencies)
    .where(inArray(currencies.id, [...counts.keys()]));

  return currencyRows
    .map((c) => ({
      currencyId: c.id,
      currencyCode: c.code,
      currencySymbol: c.symbol,
      usageCount: counts.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.usageCount - a.usageCount);
}

function buildLineProgress(
  line: typeof budgetLines.$inferSelect,
  categoryName: string,
  spent: number,
  defaultThreshold: number
): BudgetLineProgress {
  const limit = parseAmount(line.amountLimit);
  const remaining = Math.max(0, limit - spent);
  const threshold = line.alertThresholdPercent ?? defaultThreshold;
  const percent = computePercent(spent, limit);

  return {
    lineId: line.id,
    expenseCategoryId: line.expenseCategoryId,
    categoryName,
    limit: formatAmount(limit),
    spent: formatAmount(spent),
    remaining: formatAmount(remaining),
    percent,
    alertThresholdPercent: threshold,
    isOverThreshold: limit > 0 && percent >= threshold,
    isOverLimit: spent > limit,
  };
}

export async function getBudgetProgress(
  budgetId: number,
  referenceDate: Date = new Date()
): Promise<BudgetProgress | null> {
  const [budget] = await db.select().from(budgets).where(eq(budgets.id, budgetId));
  if (!budget) return null;

  const [currency] = await db.select().from(currencies).where(eq(currencies.id, budget.currencyId));
  if (!currency) return null;

  const bounds = resolvePeriodBounds(budget.periodType as BudgetPeriodType, referenceDate);
  const lines = await db.select().from(budgetLines).where(eq(budgetLines.budgetId, budgetId));

  const categoryIds = lines.map((l) => l.expenseCategoryId);
  const categoryRows =
    categoryIds.length > 0
      ? await db
          .select({ id: expenseCategories.id, name: expenseCategories.name })
          .from(expenseCategories)
          .where(inArray(expenseCategories.id, categoryIds))
      : [];
  const categoryNameById = new Map(categoryRows.map((c) => [c.id, c.name]));

  const spentByCategory = await aggregateSpentByCategory(
    budget.canvasId,
    budget.currencyId,
    bounds.start,
    bounds.end
  );

  const lineProgress = lines.map((line) =>
    buildLineProgress(
      line,
      categoryNameById.get(line.expenseCategoryId) ?? "Unknown",
      spentByCategory.get(line.expenseCategoryId)?.spent ?? 0,
      budget.alertThresholdPercent
    )
  );

  const totalSpent = await aggregateTotalSpent(
    budget.canvasId,
    budget.currencyId,
    bounds.start,
    bounds.end
  );
  const totalLimit = parseAmount(budget.totalLimit);
  const totalRemaining = Math.max(0, totalLimit - totalSpent);
  const totalPercent = computePercent(totalSpent, totalLimit);
  const unscheduledPaymentCount = await countUnscheduledPayments(
    budget.canvasId,
    budget.currencyId,
    bounds.start,
    bounds.end
  );

  return {
    budgetId: budget.id,
    canvasId: budget.canvasId,
    currencyId: budget.currencyId,
    currencyCode: currency.code,
    currencySymbol: currency.symbol,
    periodType: budget.periodType as BudgetPeriodType,
    periodStart: bounds.start.toISOString(),
    periodEnd: bounds.end.toISOString(),
    periodKey: bounds.periodKey,
    totalLimit: formatAmount(totalLimit),
    totalSpent: formatAmount(totalSpent),
    totalRemaining: formatAmount(totalRemaining),
    totalPercent,
    alertThresholdPercent: budget.alertThresholdPercent,
    isOverThreshold: totalLimit > 0 && totalPercent >= budget.alertThresholdPercent,
    isOverLimit: totalSpent > totalLimit,
    lines: lineProgress,
    unscheduledPaymentCount,
  };
}

function emptyBudgetPeriods(): Record<BudgetPeriodType, BudgetPeriodDashboardSummary | null> {
  return {
    weekly: null,
    monthly: null,
    yearly: null,
  };
}

function countCategoryStatus(lines: BudgetLineProgress[]): Pick<
  BudgetPeriodDashboardSummary,
  "categoryOverLimit" | "categoryOverThreshold" | "categoryOnTrack"
> {
  let categoryOverLimit = 0;
  let categoryOverThreshold = 0;
  let categoryOnTrack = 0;

  for (const line of lines) {
    if (line.isOverLimit) categoryOverLimit++;
    else if (line.isOverThreshold) categoryOverThreshold++;
    else categoryOnTrack++;
  }

  return { categoryOverLimit, categoryOverThreshold, categoryOnTrack };
}

export async function getBudgetSummaryForCanvas(
  canvasId: number,
  referenceDate: Date = new Date()
): Promise<BudgetDashboardSummary> {
  const canvasBudgets = await db.select().from(budgets).where(eq(budgets.canvasId, canvasId));
  const byCurrency = new Map<number, BudgetCurrencyDashboardCard>();

  for (const budget of canvasBudgets) {
    const progress = await getBudgetProgress(budget.id, referenceDate);
    if (!progress) continue;

    let card = byCurrency.get(progress.currencyId);
    if (!card) {
      card = {
        currencyId: progress.currencyId,
        currencyCode: progress.currencyCode,
        currencySymbol: progress.currencySymbol,
        periods: emptyBudgetPeriods(),
      };
      byCurrency.set(progress.currencyId, card);
    }

    const categoryStatus = countCategoryStatus(progress.lines);
    card.periods[progress.periodType as BudgetPeriodType] = {
      totalPercent: progress.totalPercent,
      isOverLimit: progress.isOverLimit,
      isOverThreshold: progress.isOverThreshold,
      ...categoryStatus,
    };
  }

  return {
    currencies: Array.from(byCurrency.values()).sort((a, b) =>
      a.currencyCode.localeCompare(b.currencyCode)
    ),
  };
}

export async function getCanvasLiquidBalance(
  canvasId: number,
  currencyId: number
): Promise<number> {
  const rows = await db
    .select({ amount: subWallets.amount })
    .from(subWallets)
    .innerJoin(wallets, eq(subWallets.walletId, wallets.id))
    .where(
      and(
        eq(wallets.canvasId, canvasId),
        eq(wallets.isArchived, false),
        eq(subWallets.currencyId, currencyId)
      )
    );

  return rows.reduce((sum, row) => sum + parseAmount(row.amount), 0);
}

export async function getSavingsGoalProgress(goalId: number): Promise<SavingsGoalProgress | null> {
  const [goal] = await db
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.id, goalId));
  if (!goal) return null;

  const [currency] = await db.select().from(currencies).where(eq(currencies.id, goal.currencyId));
  if (!currency) return null;

  const availableAmount = await getCanvasLiquidBalance(goal.canvasId, goal.currencyId);
  const targetAmount = parseAmount(goal.targetAmount);
  const remaining = Math.max(0, targetAmount - availableAmount);
  const percent = computePercent(availableAmount, targetAmount);

  let daysRemaining: number | null = null;
  if (goal.targetDate) {
    const today = startOfDay(new Date());
    const target = startOfDay(new Date(goal.targetDate));
    daysRemaining = Math.ceil((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  }

  return {
    goalId: goal.id,
    canvasId: goal.canvasId,
    name: goal.name,
    status: goal.status as SavingsGoalProgress["status"],
    currencyCode: currency.code,
    currencySymbol: currency.symbol,
    targetAmount: formatAmount(targetAmount),
    currentAmount: formatAmount(availableAmount),
    availableBalance: formatAmount(availableAmount),
    remaining: formatAmount(remaining),
    percent,
    targetDate: goal.targetDate ? String(goal.targetDate) : null,
    daysRemaining,
    alertThresholdPercent: goal.alertThresholdPercent,
    isOverThreshold: targetAmount > 0 && percent >= goal.alertThresholdPercent,
  };
}

export async function getCashFlowForecast(
  canvasId: number,
  currencyId: number,
  startDate: string,
  endDate: string
): Promise<CashFlowForecast | null> {
  const [currency] = await db.select().from(currencies).where(eq(currencies.id, currencyId));
  if (!currency) return null;

  const events = await getCalendarEvents(canvasId, startDate, endDate);
  const currencyEvents = events.filter((e) => {
    const codeMatch = e.currency === currency.code;
    return codeMatch;
  });

  const walletRows = await db
    .select({ amount: subWallets.amount })
    .from(subWallets)
    .innerJoin(wallets, eq(subWallets.walletId, wallets.id))
    .where(
      and(
        eq(wallets.canvasId, canvasId),
        eq(wallets.isArchived, false),
        eq(subWallets.currencyId, currencyId)
      )
    );

  const currentBalance = walletRows.reduce((sum, row) => sum + parseAmount(row.amount), 0);

  const rangeStart = startOfDay(new Date(startDate));
  const rangeEnd = startOfDay(new Date(endDate));
  const dayMap = new Map<string, { expectedIn: number; expectedOut: number }>();

  for (let cursor = new Date(rangeStart); cursor <= rangeEnd; cursor = addDays(cursor, 1)) {
    dayMap.set(toDateKey(cursor), { expectedIn: 0, expectedOut: 0 });
  }

  for (const event of currencyEvents) {
    const dateKey = toDateKey(new Date(event.date));
    const bucket = dayMap.get(dateKey);
    if (!bucket) continue;

    const amount = parseAmount(event.amount);
    if (event.status === "completed") continue;

    if (event.type === "income") {
      bucket.expectedIn += amount;
    } else if (event.type === "expense") {
      bucket.expectedOut += amount;
    }
  }

  let runningBalance = currentBalance;
  let totalExpectedIn = 0;
  let totalExpectedOut = 0;
  const points: ForecastDayPoint[] = [];

  for (const [date, bucket] of [...dayMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    totalExpectedIn += bucket.expectedIn;
    totalExpectedOut += bucket.expectedOut;
    const net = bucket.expectedIn - bucket.expectedOut;
    runningBalance += net;

    points.push({
      date,
      expectedIn: formatAmount(bucket.expectedIn),
      expectedOut: formatAmount(bucket.expectedOut),
      netExpected: formatAmount(net),
      projectedBalance: formatAmount(runningBalance),
    });
  }

  return {
    currencyId,
    currencyCode: currency.code,
    currencySymbol: currency.symbol,
    startDate,
    endDate,
    currentBalance: formatAmount(currentBalance),
    totalExpectedIn: formatAmount(totalExpectedIn),
    totalExpectedOut: formatAmount(totalExpectedOut),
    points,
  };
}

export async function getBudgetAlertsForUser(userId: number): Promise<BudgetAlertNotification[]> {
  const { canvasMembers, canvases } = await import("../db/schema");
  const memberships = await db
    .select({ canvasId: canvasMembers.canvasId, canvasName: canvases.name })
    .from(canvasMembers)
    .innerJoin(canvases, eq(canvasMembers.canvasId, canvases.id))
    .where(and(eq(canvasMembers.userId, userId), eq(canvases.isArchived, false)));

  const alerts: BudgetAlertNotification[] = [];

  for (const { canvasId, canvasName } of memberships) {
    const canvasBudgets = await db.select().from(budgets).where(eq(budgets.canvasId, canvasId));

    for (const budget of canvasBudgets) {
      if (!budget.alertsEnabled) continue;
      const progress = await getBudgetProgress(budget.id);
      if (!progress) continue;

      if (progress.isOverThreshold) {
        alerts.push({
          type: "budget_total",
          budgetId: budget.id,
          canvasId,
          canvasName,
          label: budget.name ?? `${progress.periodType} budget`,
          percent: progress.totalPercent,
          threshold: progress.alertThresholdPercent,
          spent: progress.totalSpent,
          limit: progress.totalLimit,
          currencyCode: progress.currencyCode,
          currencySymbol: progress.currencySymbol,
          periodKey: progress.periodKey,
        });
      }

      for (const line of progress.lines) {
        if (!line.isOverThreshold) continue;
        alerts.push({
          type: "budget_category",
          budgetId: budget.id,
          lineId: line.lineId,
          canvasId,
          canvasName,
          label: line.categoryName,
          percent: line.percent,
          threshold: line.alertThresholdPercent,
          spent: line.spent,
          limit: line.limit,
          currencyCode: progress.currencyCode,
          currencySymbol: progress.currencySymbol,
          periodKey: progress.periodKey,
        });
      }
    }

    const goals = await db
      .select()
      .from(savingsGoals)
      .where(and(eq(savingsGoals.canvasId, canvasId), eq(savingsGoals.status, "active")));

    for (const goal of goals) {
      const progress = await getSavingsGoalProgress(goal.id);
      if (!progress?.isOverThreshold) continue;
      alerts.push({
        type: "savings_goal",
        goalId: goal.id,
        canvasId,
        canvasName,
        label: progress.name,
        percent: progress.percent,
        threshold: progress.alertThresholdPercent,
        spent: progress.currentAmount,
        limit: progress.targetAmount,
        currencyCode: progress.currencyCode,
        currencySymbol: progress.currencySymbol,
        periodKey: `goal:${goal.id}`,
      });
    }
  }

  return alerts.sort((a, b) => b.percent - a.percent);
}

export function budgetAlertSourceKey(alert: BudgetAlertNotification): string {
  if (alert.type === "budget_total") {
    return `budget:total:${alert.budgetId}:${alert.periodKey}:${alert.threshold}`;
  }
  if (alert.type === "budget_category") {
    return `budget:line:${alert.lineId}:${alert.periodKey}:${alert.threshold}`;
  }
  return `budget:goal:${alert.goalId}:${alert.threshold}`;
}

export async function upsertBudgetWithLines(
  canvasId: number,
  userId: number,
  input: {
    currencyId: number;
    periodType: BudgetPeriodType;
    totalLimit: string;
    alertThresholdPercent?: number;
    alertsEnabled?: boolean;
    name?: string | null;
    lines: BudgetLineInput[];
  }
): Promise<{ budget: typeof budgets.$inferSelect; lines: typeof budgetLines.$inferSelect[] }> {
  const bounds = resolvePeriodBounds(input.periodType);
  const periodStartStr = toDateKey(bounds.start);

  const [existing] = await db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.canvasId, canvasId),
        eq(budgets.currencyId, input.currencyId),
        eq(budgets.periodType, input.periodType)
      )
    );

  let budget: typeof budgets.$inferSelect;

  if (existing) {
    const [updated] = await db
      .update(budgets)
      .set({
        totalLimit: input.totalLimit,
        alertThresholdPercent: input.alertThresholdPercent ?? existing.alertThresholdPercent,
        alertsEnabled: input.alertsEnabled ?? existing.alertsEnabled,
        name: input.name ?? existing.name,
        periodStart: periodStartStr,
        lastModifiedBy: userId,
        lastModifiedAt: new Date(),
      })
      .where(eq(budgets.id, existing.id))
      .returning();
    budget = updated;
    await db.delete(budgetLines).where(eq(budgetLines.budgetId, budget.id));
  } else {
    const [created] = await db
      .insert(budgets)
      .values({
        canvasId,
        currencyId: input.currencyId,
        periodType: input.periodType,
        periodStart: periodStartStr,
        totalLimit: input.totalLimit,
        alertThresholdPercent: input.alertThresholdPercent ?? 80,
        alertsEnabled: input.alertsEnabled ?? true,
        name: input.name ?? null,
        createdBy: userId,
        lastModifiedBy: userId,
      })
      .returning();
    budget = created;
  }

  const insertedLines =
    input.lines.length > 0
      ? await db
          .insert(budgetLines)
          .values(
            input.lines.map((line) => ({
              budgetId: budget.id,
              expenseCategoryId: line.expenseCategoryId,
              amountLimit: line.amountLimit,
              alertThresholdPercent: line.alertThresholdPercent ?? null,
            }))
          )
          .returning()
      : [];

  return { budget, lines: insertedLines };
}

export async function getBudgetWithLines(budgetId: number) {
  const [budget] = await db.select().from(budgets).where(eq(budgets.id, budgetId));
  if (!budget) return null;

  const lines = await db.select().from(budgetLines).where(eq(budgetLines.budgetId, budgetId));
  const [currency] = await db.select().from(currencies).where(eq(currencies.id, budget.currencyId));

  const categoryIds = lines.map((l) => l.expenseCategoryId);
  const categoryRows =
    categoryIds.length > 0
      ? await db
          .select({ id: expenseCategories.id, name: expenseCategories.name })
          .from(expenseCategories)
          .where(inArray(expenseCategories.id, categoryIds))
      : [];

  return {
    budget,
    lines: lines.map((line) => ({
      ...line,
      categoryName:
        categoryRows.find((c) => c.id === line.expenseCategoryId)?.name ?? "Unknown",
    })),
    currency,
  };
}
