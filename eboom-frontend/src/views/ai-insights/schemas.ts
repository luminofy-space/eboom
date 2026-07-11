import type { WizardFormData } from "@/src/types/ai-insights";

export const defaultWizardFormData: WizardFormData = {
  riskProfile: {},
  investmentGoals: {
    secondaryGoals: [],
  },
  esgPreferences: {
    avoidSectors: [],
  },
  financialKnowledge: {
    answers: {},
  },
  financialPicture: {},
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
    riskProfile: {
      ...defaultWizardFormData.riskProfile,
      ...(profile?.riskProfile ?? {}),
    },
    investmentGoals: {
      ...defaultWizardFormData.investmentGoals,
      ...(profile?.investmentGoals ?? {}),
    },
    esgPreferences: {
      ...defaultWizardFormData.esgPreferences,
      ...(profile?.esgPreferences ?? {}),
    },
    financialKnowledge: {
      ...defaultWizardFormData.financialKnowledge,
      ...(profile?.financialKnowledge ?? {}),
    },
    financialPicture: {
      ...defaultWizardFormData.financialPicture,
      ...(profile?.financialPicture ?? {}),
    },
  };
}

export function validateStep(step: number, data: WizardFormData): string | null {
  switch (step) {
    case 1: {
      const { riskProfile } = data;
      if (riskProfile.riskTolerance == null) return "validation.riskToleranceRequired";
      if (!riskProfile.investmentTimeHorizon) return "validation.timeHorizonRequired";
      if (riskProfile.acceptShortTermLoss == null) return "validation.acceptShortTermLossRequired";
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
      if (!data.esgPreferences.preferSustainableInvestments) {
        return "validation.preferSustainableRequired";
      }
      return null;
    }
    case 4: {
      const answered = Object.keys(data.financialKnowledge.answers).length;
      if (answered < 5) return "validation.quizIncomplete";
      return null;
    }
    case 5: {
      if (data.financialPicture.hasMajorLongTermLiabilities == null) {
        return "validation.longTermLiabilitiesRequired";
      }
      if (data.financialPicture.hasShortTermLiabilities == null) {
        return "validation.shortTermLiabilitiesRequired";
      }
      if (!data.financialPicture.expectedMonthlyCashflow) {
        return "validation.cashflowRequired";
      }
      if (!data.financialPicture.emergencyFundCoverage) {
        return "validation.emergencyFundRequired";
      }
      if (data.financialPicture.dependentsCount == null) {
        return "validation.dependentsRequired";
      }
      if (data.financialPicture.dependentsCount < 0) return "validation.dependentsInvalid";
      return null;
    }
    default:
      return null;
  }
}
