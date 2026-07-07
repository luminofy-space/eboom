import type { WizardFormData } from "@/src/types/ai-insights";

export const defaultWizardFormData: WizardFormData = {
  riskProfile: {
    riskTolerance: 3,
    investmentTimeHorizon: "3_7",
    acceptShortTermLoss: 3,
    portfolioDropReaction: "hold",
  },
  investmentGoals: {
    primaryGoal: "wealth_growth",
    secondaryGoals: [],
    targetAmount: null,
    targetCurrencyId: null,
    targetTimeframe: "3_10",
    goalPriorityNote: "",
  },
  esgPreferences: {
    esgImportance: "somewhat",
    avoidSectors: [],
    acceptLowerReturnsForEsg: "slightly_lower",
    preferSustainableInvestments: "unsure",
  },
  financialKnowledge: {
    answers: {},
  },
  financialPicture: {
    hasMajorLongTermLiabilities: false,
    majorLongTermLiabilitiesAmount: null,
    hasShortTermLiabilities: false,
    shortTermLiabilitiesAmount: null,
    expectedMonthlyCashflow: "break_even",
    emergencyFundCoverage: "1_3",
    dependentsCount: 0,
    additionalNotes: "",
  },
};

export function profileToFormData(
  profile: Partial<{
    riskProfile: WizardFormData["riskProfile"] | null;
    investmentGoals: WizardFormData["investmentGoals"] | null;
    esgPreferences: WizardFormData["esgPreferences"] | null;
    financialKnowledge: WizardFormData["financialKnowledge"] | null;
    financialPicture: WizardFormData["financialPicture"] | null;
  }> | null | undefined
): WizardFormData {
  return {
    riskProfile: profile?.riskProfile ?? defaultWizardFormData.riskProfile,
    investmentGoals: profile?.investmentGoals ?? defaultWizardFormData.investmentGoals,
    esgPreferences: profile?.esgPreferences ?? defaultWizardFormData.esgPreferences,
    financialKnowledge: profile?.financialKnowledge ?? defaultWizardFormData.financialKnowledge,
    financialPicture: profile?.financialPicture ?? defaultWizardFormData.financialPicture,
  };
}

export function validateStep(step: number, data: WizardFormData): string | null {
  switch (step) {
    case 1: {
      const { riskProfile } = data;
      if (!riskProfile.investmentTimeHorizon) return "validation.timeHorizonRequired";
      if (!riskProfile.portfolioDropReaction) return "validation.dropReactionRequired";
      return null;
    }
    case 2: {
      if (!data.investmentGoals.primaryGoal) return "validation.primaryGoalRequired";
      if (!data.investmentGoals.targetTimeframe) return "validation.timeframeRequired";
      return null;
    }
    case 3: {
      if (!data.esgPreferences.esgImportance) return "validation.esgImportanceRequired";
      if (!data.esgPreferences.acceptLowerReturnsForEsg) {
        return "validation.esgReturnsRequired";
      }
      return null;
    }
    case 4: {
      const answered = Object.keys(data.financialKnowledge.answers).length;
      if (answered < 5) return "validation.quizIncomplete";
      return null;
    }
    case 5: {
      if (!data.financialPicture.expectedMonthlyCashflow) {
        return "validation.cashflowRequired";
      }
      if (!data.financialPicture.emergencyFundCoverage) {
        return "validation.emergencyFundRequired";
      }
      if (data.financialPicture.dependentsCount < 0) return "validation.dependentsInvalid";
      return null;
    }
    default:
      return null;
  }
}
