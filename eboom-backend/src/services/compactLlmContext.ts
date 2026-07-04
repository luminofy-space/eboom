import type { CompletenessResult } from "../types/aiInsight";
import type { AiInsightFinancialContext } from "./aiInsightContextService";

/** Target max serialized size sent to the LLM per request. */
export const LLM_CONTEXT_MAX_BYTES = 3500;

function roundAmount(value: string | number | null | undefined): number {
  const n =
    typeof value === "number"
      ? value
      : parseFloat(String(value ?? "0").replace(/,/g, ""));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function compactProfile(profile: AiInsightFinancialContext["profile"]) {
  if (!profile) return null;

  const risk = profile.riskProfile as Record<string, unknown> | null;
  const goals = profile.investmentGoals as Record<string, unknown> | null;
  const esg = profile.esgPreferences as Record<string, unknown> | null;
  const knowledge = profile.financialKnowledge as Record<string, unknown> | null;
  const picture = profile.financialPicture as Record<string, unknown> | null;

  return {
    st: profile.status,
    risk: risk
      ? {
          tol: risk.riskTolerance,
          horizon: risk.investmentTimeHorizon,
          drop: risk.portfolioDropReaction,
        }
      : null,
    goals: goals
      ? {
          primary: goals.primaryGoal,
          secondary: Array.isArray(goals.secondaryGoals)
            ? goals.secondaryGoals.slice(0, 3)
            : [],
          amount: roundAmount(goals.targetAmount as string | number | null),
          timeframe: goals.targetTimeframe,
        }
      : null,
    esg: esg
      ? {
          imp: esg.esgImportance,
          avoid: Array.isArray(esg.avoidSectors) ? esg.avoidSectors.slice(0, 4) : [],
        }
      : null,
    knowledge: knowledge
      ? {
          level: knowledge.level,
          score: knowledge.score,
        }
      : null,
    picture: picture
      ? {
          cashflow: picture.expectedMonthlyCashflow,
          emergency: picture.emergencyFundCoverage,
          dependents: picture.dependentsCount,
          longTermDebt: picture.hasMajorLongTermLiabilities
            ? roundAmount(picture.majorLongTermLiabilitiesAmount as string | number | null)
            : 0,
          shortTermDebt: picture.hasShortTermLiabilities
            ? roundAmount(picture.shortTermLiabilitiesAmount as string | number | null)
            : 0,
        }
      : null,
  };
}

function compactBudgetSummary(summary: AiInsightFinancialContext["budgetSummary"]) {
  return summary.currencies.slice(0, 3).map((currency) => ({
    c: currency.currencyCode,
    mo: currency.periods.monthly
      ? {
          pct: Math.round(currency.periods.monthly.totalPercent),
          over: currency.periods.monthly.isOverLimit,
        }
      : null,
  }));
}

function compactCashFlow(
  forecast: AiInsightFinancialContext["cashFlowForecast"]
) {
  if (!forecast) return null;

  const points = forecast.points;
  const minBalance = points.reduce(
    (min, point) => Math.min(min, roundAmount(point.projectedBalance)),
    roundAmount(forecast.currentBalance)
  );
  const endBalance =
    points.length > 0
      ? roundAmount(points[points.length - 1].projectedBalance)
      : roundAmount(forecast.currentBalance);

  return {
    c: forecast.currencyCode,
    bal: roundAmount(forecast.currentBalance),
    in: roundAmount(forecast.totalExpectedIn),
    out: roundAmount(forecast.totalExpectedOut),
    minBal: minBalance,
    endBal: endBalance,
    days: points.length,
  };
}

export type CompactLlmContext = {
  cs: number;
  cbd?: CompletenessResult["breakdown"];
  p: ReturnType<typeof compactProfile>;
  n: AiInsightFinancialContext["counts"];
  w: Array<{ n: string; c: string; b: number }>;
  a: Array<{ c: string; v: number; n: number }>;
  s: Array<{ c: string; t: number }>;
  r: Array<{ t: string; n: string; a: number; c: string }>;
  bs: ReturnType<typeof compactBudgetSummary>;
  b: Array<{
    pt: string;
    c: string;
    lim: number;
    sp: number;
    pct: number;
    over: boolean;
    alert: string[];
  }>;
  cf: ReturnType<typeof compactCashFlow>;
  g: Array<{ n: string; pct: number; rem: number; c: string }>;
};

export function buildCompactLlmContext(
  context: AiInsightFinancialContext,
  completeness: CompletenessResult,
  options?: { includeBreakdown?: boolean }
): CompactLlmContext {
  return {
    cs: completeness.score,
    ...(options?.includeBreakdown ? { cbd: completeness.breakdown } : {}),
    p: compactProfile(context.profile),
    n: context.counts,
    w: context.walletBalances.slice(0, 8).map((wallet) => ({
      n: wallet.walletName,
      c: wallet.currencyCode,
      b: roundAmount(wallet.balance),
    })),
    a: context.assetsByCurrency.slice(0, 5).map((asset) => ({
      c: asset.currencyCode,
      v: roundAmount(asset.totalEstimatedValue),
      n: asset.count,
    })),
    s: context.categorySpendLast90Days.slice(0, 6).map((row) => ({
      c: row.categoryName,
      t: roundAmount(row.totalSpent),
    })),
    r: context.recentActivity.slice(0, 3).map((item) => ({
      t: item.type,
      n: item.entityName,
      a: roundAmount(item.amount),
      c: item.currencyCode,
    })),
    bs: compactBudgetSummary(context.budgetSummary),
    b: context.topBudgets.slice(0, 2).map((budget) => ({
      pt: budget.periodType,
      c: budget.currencyCode,
      lim: roundAmount(budget.totalLimit),
      sp: roundAmount(budget.totalSpent),
      pct: Math.round(budget.totalPercent),
      over: budget.isOverLimit,
      alert: budget.overThresholdCategories.slice(0, 3),
    })),
    cf: compactCashFlow(context.cashFlowForecast),
    g: context.savingsGoals.slice(0, 3).map((goal) => ({
      n: goal.name,
      pct: Math.round(goal.percent),
      rem: roundAmount(goal.remaining),
      c: goal.currencyCode,
    })),
  };
}

function shrinkCompactContext(payload: CompactLlmContext): CompactLlmContext {
  return {
    ...payload,
    w: payload.w.slice(0, 5),
    s: payload.s.slice(0, 4),
    r: payload.r.slice(0, 2),
    b: payload.b.slice(0, 1),
    g: payload.g.slice(0, 2),
    a: payload.a.slice(0, 3),
  };
}

export function serializeCompactLlmContext(
  context: AiInsightFinancialContext,
  completeness: CompletenessResult,
  options?: { includeBreakdown?: boolean }
): string {
  let payload = buildCompactLlmContext(context, completeness, options);
  let serialized = JSON.stringify(payload);

  if (serialized.length <= LLM_CONTEXT_MAX_BYTES) {
    return serialized;
  }

  payload = shrinkCompactContext(payload);
  serialized = JSON.stringify(payload);
  if (serialized.length <= LLM_CONTEXT_MAX_BYTES) {
    return serialized;
  }

  return JSON.stringify({
    cs: payload.cs,
    p: payload.p,
    n: payload.n,
    w: payload.w.slice(0, 3),
    s: payload.s.slice(0, 3),
    b: payload.b.slice(0, 1),
    g: payload.g.slice(0, 1),
    cf: payload.cf,
  });
}
