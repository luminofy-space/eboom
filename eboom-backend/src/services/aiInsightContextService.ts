import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { budgets, savingsGoals } from "../db/schema";
import type { AiInsightProfile } from "../db/schema/models";
import type { CompletenessResult, CompletenessSignals } from "../types/aiInsight";
import { computeCompletenessScoreFromSignals } from "../types/aiInsight";
import { getCanvasSummary } from "./dashboardService";
import {
  getBudgetProgress,
  getBudgetSummaryForCanvas,
  getCanvasCurrencyUsage,
  getCashFlowForecast,
  getSavingsGoalProgress,
} from "./planningService";

const CONTEXT_MAX_BYTES = 6000;

function parseAmount(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function aggregateCategorySpend(
  payments: Array<{
    categoryName: string | null;
    amount: string;
    paidDate: string | null;
  }>,
  daysBack = 90
): Array<{ categoryName: string; totalSpent: number; paymentCount: number }> {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - daysBack);

  const map = new Map<string, { totalSpent: number; paymentCount: number }>();

  for (const payment of payments) {
    if (!payment.paidDate) continue;
    if (new Date(payment.paidDate) < cutoff) continue;
    const name = payment.categoryName ?? "Uncategorized";
    const existing = map.get(name) ?? { totalSpent: 0, paymentCount: 0 };
    existing.totalSpent += parseAmount(payment.amount);
    existing.paymentCount += 1;
    map.set(name, existing);
  }

  return Array.from(map.entries())
    .map(([categoryName, data]) => ({ categoryName, ...data }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 6);
}

async function resolvePrimaryCurrencyId(canvasId: number): Promise<number | null> {
  const usage = await getCanvasCurrencyUsage(canvasId);
  if (!usage.length) return null;
  const sorted = [...usage].sort((a, b) => b.usageCount - a.usageCount);
  return sorted[0]?.currencyId ?? null;
}

async function gatherCompletenessSignals(canvasId: number): Promise<CompletenessSignals> {
  const summary = await getCanvasSummary(canvasId);
  const hasWalletsWithBalance = summary.walletBalances.some(
    (w) => parseAmount(w.balance) !== 0
  );

  const [budgetRows, goalRows] = await Promise.all([
    db.select({ id: budgets.id }).from(budgets).where(eq(budgets.canvasId, canvasId)).limit(1),
    db
      .select({ id: savingsGoals.id })
      .from(savingsGoals)
      .where(and(eq(savingsGoals.canvasId, canvasId), eq(savingsGoals.status, "active")))
      .limit(1),
  ]);

  return {
    hasWalletsWithBalance: summary.counts.wallets > 0 && hasWalletsWithBalance,
    hasIncomes: summary.counts.incomes > 0,
    hasExpenses: summary.counts.expenses > 0,
    hasAssets: summary.counts.assets > 0,
    hasBudget: budgetRows.length > 0,
    hasSavingsGoal: goalRows.length > 0,
  };
}

export async function computeCompletenessScore(
  canvasId: number,
  profile: AiInsightProfile | null
): Promise<CompletenessResult> {
  const signals = await gatherCompletenessSignals(canvasId);
  return computeCompletenessScoreFromSignals(profile, signals);
}

export type AiInsightFinancialContext = {
  counts: { wallets: number; incomes: number; expenses: number; assets: number };
  walletBalances: Array<{
    walletName: string;
    currencyCode: string;
    balance: string;
  }>;
  assetsByCurrency: Array<{
    currencyCode: string;
    totalHoldingValue: string;
    count: number;
  }>;
  categorySpendLast90Days: Array<{
    categoryName: string;
    totalSpent: number;
    paymentCount: number;
  }>;
  recentActivity: Array<{
    type: string;
    entityName: string;
    amount: string;
    currencyCode: string;
    status: string;
  }>;
  budgetSummary: Awaited<ReturnType<typeof getBudgetSummaryForCanvas>>;
  topBudgets: Array<{
    periodType: string;
    currencyCode: string;
    totalLimit: string;
    totalSpent: string;
    totalRemaining: string;
    totalPercent: number;
    isOverLimit: boolean;
    overThresholdCategories: string[];
  }>;
  cashFlowForecast: Awaited<ReturnType<typeof getCashFlowForecast>> | null;
  savingsGoals: Array<{
    name: string;
    targetAmount: string;
    percent: number;
    remaining: string;
    currencyCode: string;
  }>;
  profile: {
    status: string;
    currentStep: number;
    riskProfile: unknown;
    investmentGoals: unknown;
    esgPreferences: unknown;
    financialKnowledge: unknown;
    financialPicture: unknown;
  } | null;
};

function trimContextToSize(context: AiInsightFinancialContext): AiInsightFinancialContext {
  let serialized = JSON.stringify(context);
  if (serialized.length <= CONTEXT_MAX_BYTES) return context;

  const trimmed = { ...context };
  trimmed.recentActivity = trimmed.recentActivity.slice(0, 2);
  trimmed.categorySpendLast90Days = trimmed.categorySpendLast90Days.slice(0, 4);
  trimmed.topBudgets = trimmed.topBudgets.slice(0, 2);
  trimmed.savingsGoals = trimmed.savingsGoals.slice(0, 2);
  trimmed.walletBalances = trimmed.walletBalances.slice(0, 8);

  serialized = JSON.stringify(trimmed);
  if (serialized.length <= CONTEXT_MAX_BYTES) return trimmed;

  trimmed.cashFlowForecast = trimmed.cashFlowForecast
    ? {
        currencyId: trimmed.cashFlowForecast.currencyId,
        currencyCode: trimmed.cashFlowForecast.currencyCode,
        currencySymbol: trimmed.cashFlowForecast.currencySymbol,
        startDate: trimmed.cashFlowForecast.startDate,
        endDate: trimmed.cashFlowForecast.endDate,
        currentBalance: trimmed.cashFlowForecast.currentBalance,
        totalExpectedIn: trimmed.cashFlowForecast.totalExpectedIn,
        totalExpectedOut: trimmed.cashFlowForecast.totalExpectedOut,
        points: [],
      }
    : null;

  return trimmed;
}

export async function buildFinancialContext(
  canvasId: number,
  profile: AiInsightProfile | null
): Promise<{ context: AiInsightFinancialContext; completeness: CompletenessResult }> {
  const [summary, budgetSummary, completeness, primaryCurrencyId] = await Promise.all([
    getCanvasSummary(canvasId),
    getBudgetSummaryForCanvas(canvasId),
    computeCompletenessScore(canvasId, profile),
    resolvePrimaryCurrencyId(canvasId),
  ]);

  const canvasBudgets = await db
    .select()
    .from(budgets)
    .where(eq(budgets.canvasId, canvasId))
    .limit(2);

  const topBudgets = (
    await Promise.all(canvasBudgets.map((b) => getBudgetProgress(b.id)))
  )
    .filter((p): p is NonNullable<typeof p> => p != null)
    .map((p) => ({
      periodType: p.periodType,
      currencyCode: p.currencyCode,
      totalLimit: p.totalLimit,
      totalSpent: p.totalSpent,
      totalRemaining: p.totalRemaining,
      totalPercent: p.totalPercent,
      isOverLimit: p.isOverLimit,
      overThresholdCategories: p.lines
        .filter((line) => line.isOverThreshold || line.isOverLimit)
        .map((line) => line.categoryName),
    }));

  let cashFlowForecast: Awaited<ReturnType<typeof getCashFlowForecast>> | null = null;
  if (primaryCurrencyId) {
    cashFlowForecast = await getCashFlowForecast(
      canvasId,
      primaryCurrencyId,
      addDaysIso(0),
      addDaysIso(14)
    );
  }

  const activeGoals = await db
    .select()
    .from(savingsGoals)
    .where(and(eq(savingsGoals.canvasId, canvasId), eq(savingsGoals.status, "active")))
    .limit(3);

  const savingsGoalProgress = (
    await Promise.all(activeGoals.map((g) => getSavingsGoalProgress(g.id)))
  )
    .filter((g): g is NonNullable<typeof g> => g != null)
    .map((g) => ({
      name: g.name,
      targetAmount: g.targetAmount,
      percent: g.percent,
      remaining: g.remaining,
      currencyCode: g.currencyCode,
    }));

  const context: AiInsightFinancialContext = {
    counts: summary.counts,
    walletBalances: summary.walletBalances.slice(0, 10).map((w) => ({
      walletName: w.walletName,
      currencyCode: w.currencyCode,
      balance: w.balance,
    })),
    assetsByCurrency: summary.assetsByCurrency.map((a) => ({
      currencyCode: a.currencyCode,
      totalHoldingValue: a.totalHoldingValue,
      count: a.count,
    })),
    categorySpendLast90Days: aggregateCategorySpend(summary.expensePayments),
    recentActivity: summary.recentActivity.slice(0, 3).map((a) => ({
      type: a.type,
      entityName: a.entityName,
      amount: a.amount,
      currencyCode: a.currencyCode,
      status: a.status,
    })),
    budgetSummary,
    topBudgets,
    cashFlowForecast,
    savingsGoals: savingsGoalProgress,
    profile: profile
      ? {
          status: profile.status,
          currentStep: profile.currentStep,
          riskProfile: profile.riskProfile,
          investmentGoals: profile.investmentGoals,
          esgPreferences: profile.esgPreferences,
          financialKnowledge: profile.financialKnowledge,
          financialPicture: profile.financialPicture,
        }
      : null,
  };

  return {
    context: trimContextToSize(context),
    completeness,
  };
}
