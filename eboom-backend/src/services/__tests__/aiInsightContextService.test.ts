import { describe, expect, it } from "vitest";
import {
  computeCompletenessScoreFromSignals,
  type CompletenessSignals,
} from "../types/aiInsight";

const emptySignals: CompletenessSignals = {
  hasWalletsWithBalance: false,
  hasIncomes: false,
  hasExpenses: false,
  hasAssets: false,
  hasBudget: false,
  hasSavingsGoal: false,
};

const fullSignals: CompletenessSignals = {
  hasWalletsWithBalance: true,
  hasIncomes: true,
  hasExpenses: true,
  hasAssets: true,
  hasBudget: true,
  hasSavingsGoal: true,
};

describe("computeCompletenessScoreFromSignals", () => {
  it("returns zero when profile and signals are empty", () => {
    const result = computeCompletenessScoreFromSignals(null, emptySignals);
    expect(result.score).toBe(0);
    expect(result.breakdown.wizard).toBe(0);
  });

  it("awards 35 points for completed wizard", () => {
    const result = computeCompletenessScoreFromSignals(
      { status: "completed", currentStep: 5 },
      emptySignals
    );
    expect(result.breakdown.wizard).toBe(35);
    expect(result.score).toBe(35);
  });

  it("awards partial wizard points by current step", () => {
    const result = computeCompletenessScoreFromSignals(
      { status: "draft", currentStep: 3 },
      emptySignals
    );
    expect(result.breakdown.wizard).toBe(15);
  });

  it("caps total score at 100 with full data", () => {
    const result = computeCompletenessScoreFromSignals(
      { status: "completed", currentStep: 5 },
      fullSignals
    );
    expect(result.score).toBe(100);
    expect(result.breakdown.wallets).toBe(15);
    expect(result.breakdown.incomes).toBe(10);
    expect(result.breakdown.expenses).toBe(10);
    expect(result.breakdown.assets).toBe(10);
    expect(result.breakdown.budget).toBe(10);
    expect(result.breakdown.savingsGoal).toBe(10);
  });

  it("sums module factors independently", () => {
    const result = computeCompletenessScoreFromSignals(null, {
      ...emptySignals,
      hasIncomes: true,
      hasBudget: true,
    });
    expect(result.score).toBe(20);
    expect(result.breakdown.incomes).toBe(10);
    expect(result.breakdown.budget).toBe(10);
  });
});
