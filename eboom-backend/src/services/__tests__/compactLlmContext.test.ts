import { describe, expect, it } from "vitest";
import type { AiInsightFinancialContext } from "../aiInsightContextService";
import {
  buildCompactLlmContext,
  LLM_CONTEXT_MAX_BYTES,
  serializeCompactLlmContext,
} from "../compactLlmContext";

const emptyCompleteness = {
  score: 50,
  breakdown: {
    wizard: 35,
    wallets: 0,
    incomes: 0,
    expenses: 0,
    assets: 0,
    budget: 0,
    savingsGoal: 0,
  },
};

function makeContext(overrides?: Partial<AiInsightFinancialContext>): AiInsightFinancialContext {
  return {
    counts: { wallets: 2, incomes: 1, expenses: 3, assets: 0 },
    walletBalances: [
      { walletName: "Checking", currencyCode: "USD", balance: "1234.5678" },
      { walletName: "Savings", currencyCode: "USD", balance: "5000" },
    ],
    assetsByCurrency: [],
    categorySpendLast90Days: [
      { categoryName: "Groceries", totalSpent: 450.25, paymentCount: 12 },
    ],
    recentActivity: [
      {
        type: "expense",
        entityName: "Rent",
        amount: "1200",
        currencyCode: "USD",
        status: "completed",
      },
    ],
    budgetSummary: { currencies: [] },
    topBudgets: [],
    cashFlowForecast: null,
    savingsGoals: [],
    profile: {
      status: "completed",
      currentStep: 5,
      riskProfile: { riskTolerance: 3, investmentTimeHorizon: "7_15" },
      investmentGoals: { primaryGoal: "retirement", secondaryGoals: ["home"] },
      esgPreferences: { esgImportance: "somewhat", avoidSectors: ["tobacco"] },
      financialKnowledge: {
        answers: { q1: "a", q2: "b", q3: "c", q4: "d", q5: "e" },
        score: 4,
        level: "intermediate",
      },
      financialPicture: {
        expectedMonthlyCashflow: "small_surplus",
        emergencyFundCoverage: "3_6",
        dependentsCount: 1,
      },
    },
    ...overrides,
  };
}

describe("compactLlmContext", () => {
  it("strips quiz answers and uses short keys", () => {
    const compact = buildCompactLlmContext(makeContext(), emptyCompleteness);
    expect(compact.p?.knowledge).toEqual({ level: "intermediate", score: 4 });
    expect(compact.w[0]).toEqual({ n: "Checking", c: "USD", b: 1234.57 });
    expect(JSON.stringify(compact)).not.toContain("financialKnowledge");
  });

  it("keeps serialized payload under the byte budget", () => {
    const large = makeContext({
      walletBalances: Array.from({ length: 15 }, (_, i) => ({
        walletName: `Wallet ${i}`,
        currencyCode: "USD",
        balance: `${1000 + i * 100}.99`,
      })),
      categorySpendLast90Days: Array.from({ length: 10 }, (_, i) => ({
        categoryName: `Category ${i}`,
        totalSpent: 100 + i,
        paymentCount: i + 1,
      })),
    });

    const serialized = serializeCompactLlmContext(large, emptyCompleteness, {
      includeBreakdown: true,
    });
    expect(serialized.length).toBeLessThanOrEqual(LLM_CONTEXT_MAX_BYTES);
  });
});
