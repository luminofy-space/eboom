export type BudgetPeriodType = "weekly" | "monthly" | "yearly";

export interface BudgetLineProgress {
  lineId: number;
  expenseCategoryId: number;
  categoryName: string;
  limit: string;
  spent: string;
  remaining: string;
  percent: number;
  alertThresholdPercent: number;
  isOverThreshold: boolean;
  isOverLimit: boolean;
}

export interface BudgetProgress {
  budgetId: number;
  canvasId: number;
  currencyId: number;
  currencyCode: string;
  currencySymbol: string;
  periodType: BudgetPeriodType;
  periodStart: string;
  periodEnd: string;
  periodKey: string;
  totalLimit: string;
  totalSpent: string;
  totalRemaining: string;
  totalPercent: number;
  alertThresholdPercent: number;
  isOverThreshold: boolean;
  isOverLimit: boolean;
  lines: BudgetLineProgress[];
  unscheduledPaymentCount: number;
}

export interface BudgetPeriodDashboardSummary {
  totalPercent: number;
  isOverLimit: boolean;
  isOverThreshold: boolean;
  categoryOverLimit: number;
  categoryOverThreshold: number;
  categoryOnTrack: number;
}

export interface BudgetCurrencyDashboardCard {
  currencyId: number;
  currencyCode: string;
  currencySymbol: string;
  periods: Record<BudgetPeriodType, BudgetPeriodDashboardSummary | null>;
}

export interface BudgetDashboardSummary {
  currencies: BudgetCurrencyDashboardCard[];
}

export interface BudgetSuggestionCategory {
  categoryId: number;
  categoryName: string;
  suggestedAmount: string;
  rawAmount: string;
  paymentCount: number;
}

export interface BudgetSuggestions {
  currencyId: number;
  currencyCode: string;
  currencySymbol: string;
  periodType: BudgetPeriodType;
  referencePeriodStart: string;
  referencePeriodEnd: string;
  suggestedTotal: string;
  categories: BudgetSuggestionCategory[];
}

export type SavingsGoalStatus = "active" | "achieved" | "dropped";

export interface SavingsGoalProgress {
  goalId: number;
  canvasId: number;
  name: string;
  status: SavingsGoalStatus;
  currencyCode: string;
  currencySymbol: string;
  targetAmount: string;
  currentAmount: string;
  availableBalance: string;
  walletCount: number;
  photoUrl: string | null;
  remaining: string;
  percent: number;
  targetDate: string | null;
  daysRemaining: number | null;
  alertThresholdPercent: number;
  isOverThreshold: boolean;
}

export interface SavingsGoalListItem {
  goal: {
    id: number;
    canvasId: number;
    currencyId: number;
    name: string;
    targetAmount: string;
    targetDate: string | null;
    status: SavingsGoalStatus;
    photoUrl?: string | null;
  };
  progress?: SavingsGoalProgress;
}

export interface ForecastDayPoint {
  date: string;
  expectedIn: string;
  expectedOut: string;
  netExpected: string;
  projectedBalance: string;
}

export interface CashFlowForecast {
  currencyId: number;
  currencyCode: string;
  currencySymbol: string;
  startDate: string;
  endDate: string;
  currentBalance: string;
  totalExpectedIn: string;
  totalExpectedOut: string;
  points: ForecastDayPoint[];
}

export interface CanvasCurrencyUsage {
  currencyId: number;
  currencyCode: string;
  currencySymbol: string;
  usageCount: number;
}

export interface BudgetListItem {
  budget: {
    id: number;
    canvasId: number;
    currencyId: number;
    periodType: BudgetPeriodType;
    totalLimit: string;
    alertThresholdPercent: number;
    alertsEnabled: boolean;
    name?: string | null;
  };
  lines: Array<{
    id: number;
    expenseCategoryId: number;
    amountLimit: string;
    categoryName: string;
  }>;
  progress?: BudgetProgress;
}
