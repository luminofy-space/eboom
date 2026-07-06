export type AiInsightProfileStatus = "draft" | "completed";

export type FinancialKnowledgeLevel = "beginner" | "intermediate" | "advanced";

export type RiskProfileData = {
  riskTolerance: number;
  investmentTimeHorizon: "under_3" | "3_7" | "7_15" | "15_plus";
  acceptShortTermLoss: 1 | 2 | 3 | 4 | 5;
  portfolioDropReaction: "sell" | "hold" | "buy_more";
};

export type InvestmentGoalsData = {
  primaryGoal:
    | "emergency_fund"
    | "debt_payoff"
    | "home"
    | "retirement"
    | "wealth_growth"
    | "education"
    | "other";
  secondaryGoals: string[];
  targetAmount?: number | null;
  targetCurrencyId?: number | null;
  targetTimeframe: "under_1" | "1_3" | "3_10" | "10_plus";
  goalPriorityNote?: string | null;
};

export type EsgPreferencesData = {
  esgImportance: "not_important" | "somewhat" | "very_important" | "deal_breaker";
  avoidSectors: string[];
  acceptLowerReturnsForEsg: "yes" | "no" | "slightly_lower";
  preferSustainableInvestments: "yes" | "no" | "unsure";
};

export type FinancialKnowledgeData = {
  answers: Record<string, string>;
  score: number;
  level: FinancialKnowledgeLevel;
};

export type FinancialPictureData = {
  hasMajorLongTermLiabilities: boolean;
  majorLongTermLiabilitiesAmount?: number | null;
  hasShortTermLiabilities: boolean;
  shortTermLiabilitiesAmount?: number | null;
  expectedMonthlyCashflow: "deficit" | "break_even" | "small_surplus" | "large_surplus";
  emergencyFundCoverage: "none" | "under_1" | "1_3" | "3_6" | "6_plus";
  dependentsCount: number;
  additionalNotes?: string | null;
};

export type AiInsightProfilePayload = {
  currentStep?: number;
  status?: AiInsightProfileStatus;
  riskProfile?: RiskProfileData | null;
  investmentGoals?: InvestmentGoalsData | null;
  esgPreferences?: EsgPreferencesData | null;
  financialKnowledge?: FinancialKnowledgeData | null;
  financialPicture?: FinancialPictureData | null;
};

export const QUIZ_CORRECT_ANSWERS: Record<string, string> = {
  q1: "company_specific",
  q2: "decreases",
  q3: "earnings_on_earnings",
  q4: "lower_yields",
  q5: "3_6_months",
};

export function scoreFinancialKnowledge(
  answers: Record<string, string>
): { score: number; level: FinancialKnowledgeLevel } {
  let score = 0;
  for (const [key, correct] of Object.entries(QUIZ_CORRECT_ANSWERS)) {
    if (answers[key] === correct) score += 1;
  }
  let level: FinancialKnowledgeLevel = "beginner";
  if (score >= 5) level = "advanced";
  else if (score >= 3) level = "intermediate";
  return { score, level };
}

export type AiInsightItemCategory =
  | "budget"
  | "cashflow"
  | "goals"
  | "risk"
  | "esg"
  | "general";

export type AiInsightItemPriority = "high" | "medium" | "low";

export type AiInsightItem = {
  id: string;
  category: AiInsightItemCategory;
  priority: AiInsightItemPriority;
  title: string;
  body: string;
};

export type CompletenessBreakdown = {
  wizard: number;
  wallets: number;
  incomes: number;
  expenses: number;
  assets: number;
  budget: number;
  savingsGoal: number;
};

export type CompletenessResult = {
  score: number;
  breakdown: CompletenessBreakdown;
};

export type CompletenessSignals = {
  hasWalletsWithBalance: boolean;
  hasIncomes: boolean;
  hasExpenses: boolean;
  hasAssets: boolean;
  hasBudget: boolean;
  hasSavingsGoal: boolean;
};

export function computeCompletenessScoreFromSignals(
  profile: {
    status: AiInsightProfileStatus;
    currentStep: number;
  } | null,
  signals: CompletenessSignals
): CompletenessResult {
  let wizard = 0;
  if (profile?.status === "completed") {
    wizard = 35;
  } else if (profile) {
    wizard = Math.min(25, Math.max(5, profile.currentStep * 5));
  }

  const breakdown: CompletenessBreakdown = {
    wizard,
    wallets: signals.hasWalletsWithBalance ? 15 : 0,
    incomes: signals.hasIncomes ? 10 : 0,
    expenses: signals.hasExpenses ? 10 : 0,
    assets: signals.hasAssets ? 10 : 0,
    budget: signals.hasBudget ? 10 : 0,
    savingsGoal: signals.hasSavingsGoal ? 10 : 0,
  };

  const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  return { score: Math.min(100, score), breakdown };
}
