export type AiInsightProfileStatus = "draft" | "completed";

export type FinancialKnowledgeLevel = "beginner" | "intermediate" | "advanced";

export type RiskProfileData = {
  riskTolerance?: number;
  investmentTimeHorizon?: "under_3" | "3_7" | "7_15" | "15_plus";
  acceptShortTermLoss?: 1 | 2 | 3 | 4 | 5;
  portfolioDropReaction?: "sell" | "hold" | "buy_more";
};

export type InvestmentGoalsData = {
  primaryGoal?:
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
  targetTimeframe?: "under_1" | "1_3" | "3_10" | "10_plus";
  goalPriorityNote?: string | null;
};

export type EsgPreferencesData = {
  esgImportance?: "not_important" | "somewhat" | "very_important" | "deal_breaker";
  avoidSectors: string[];
  acceptLowerReturnsForEsg?: "yes" | "no" | "slightly_lower";
  preferSustainableInvestments?: "yes" | "no" | "unsure";
};

export type FinancialKnowledgeData = {
  answers: Record<string, string>;
  score?: number;
  level?: FinancialKnowledgeLevel;
};

export type FinancialPictureData = {
  hasMajorLongTermLiabilities?: boolean | null;
  majorLongTermLiabilitiesAmount?: number | null;
  hasShortTermLiabilities?: boolean | null;
  shortTermLiabilitiesAmount?: number | null;
  expectedMonthlyCashflow?: "deficit" | "break_even" | "small_surplus" | "large_surplus";
  emergencyFundCoverage?: "none" | "under_1" | "1_3" | "3_6" | "6_plus";
  dependentsCount?: number | null;
  additionalNotes?: string | null;
};

export type AiInsightProfile = {
  id: number;
  canvasId: number;
  status: AiInsightProfileStatus;
  currentStep: number;
  riskProfile: RiskProfileData | null;
  investmentGoals: InvestmentGoalsData | null;
  esgPreferences: EsgPreferencesData | null;
  financialKnowledge: FinancialKnowledgeData | null;
  financialPicture: FinancialPictureData | null;
  completedAt: string | null;
  updatedByUserId: number | null;
  createdAt: string | null;
  lastModifiedAt: string | null;
};

export type WizardFormData = {
  riskProfile: RiskProfileData;
  investmentGoals: InvestmentGoalsData;
  esgPreferences: EsgPreferencesData;
  financialKnowledge: FinancialKnowledgeData;
  financialPicture: FinancialPictureData;
};

export type AiInsightProfileSavePayload = {
  currentStep?: number;
  status?: AiInsightProfileStatus;
  riskProfile?: RiskProfileData;
  investmentGoals?: InvestmentGoalsData;
  esgPreferences?: EsgPreferencesData;
  financialKnowledge?: FinancialKnowledgeData;
  financialPicture?: FinancialPictureData;
};

export const WIZARD_STEPS = [
  "riskProfile",
  "investmentGoals",
  "esgPreferences",
  "financialKnowledge",
  "financialPicture",
] as const;

export type WizardStepKey = (typeof WIZARD_STEPS)[number];

export const GOAL_OPTIONS = [
  "emergency_fund",
  "debt_payoff",
  "home",
  "retirement",
  "wealth_growth",
  "education",
  "other",
] as const;

export const ESG_SECTOR_OPTIONS = [
  "fossil_fuels",
  "weapons",
  "tobacco",
  "gambling",
  "alcohol",
  "none",
] as const;

export const QUIZ_QUESTION_IDS = ["q1", "q2", "q3", "q4", "q5"] as const;

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

export type AiFinancialInsight = {
  id: number;
  canvasId: number;
  profileId: number | null;
  generatedByUserId: number;
  insights: AiInsightItem[];
  completenessScore: number;
  completenessBreakdown: CompletenessBreakdown | null;
  contextSummary: unknown;
  model: string;
  generatedAt: string | null;
  createdAt: string | null;
  lastModifiedAt: string | null;
};

export type InsightGenerationStatus = "running" | "failed";

export type InsightGenerationState = {
  status: InsightGenerationStatus;
  startedAt: string;
  error?: string;
};

export type AiInsightsResponse = {
  insight: AiFinancialInsight | null;
  profile: AiInsightProfile | null;
  completeness: CompletenessResult;
  generation?: InsightGenerationState | null;
  status?: "started" | "already_running";
};

export type AiChatMessageRole = "user" | "assistant";

export type AiChatMessage = {
  id: number;
  role: AiChatMessageRole;
  content: string;
  createdAt: string;
};

export type AiChatMessagesResponse = {
  messages: AiChatMessage[];
};

export type AiChatSendResponse = {
  userMessage: AiChatMessage;
  assistantMessage: AiChatMessage;
};
