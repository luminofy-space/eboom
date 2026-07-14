"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { Spinner } from "@/components/ui/spinner";
import type { AiInsightProfile, WizardFormData } from "@/src/types/ai-insights";
import { profileToFormData, validateStep } from "../schemas";
import { WizardStepper } from "./WizardStepper";
import { RiskProfileStep } from "./steps/RiskProfileStep";
import { InvestmentGoalsStep } from "./steps/InvestmentGoalsStep";
import { EsgPreferenceStep } from "./steps/EsgPreferenceStep";
import { FinancialKnowledgeStep } from "./steps/FinancialKnowledgeStep";
import { FinancialPictureStep } from "./steps/FinancialPictureStep";

interface WizardShellProps {
  profile: AiInsightProfile | null;
  initialStep?: number;
  onSave: (
    step: number,
    data: WizardFormData,
    options: { complete?: boolean; advance?: boolean }
  ) => Promise<void>;
  onExit: () => void;
  isSaving: boolean;
  canEdit: boolean;
}

const TOTAL_STEPS = 5;

function buildStepSyncKey(profile: AiInsightProfile | null, initialStep?: number): string {
  return [
    profile?.id ?? "none",
    profile?.lastModifiedAt ?? "none",
    initialStep ?? "none",
    profile?.currentStep ?? "none",
  ].join("|");
}

function resolveExternalStep(profile: AiInsightProfile | null, initialStep?: number): number {
  return initialStep ?? profile?.currentStep ?? 1;
}

function stepPayload(step: number, data: WizardFormData) {
  switch (step) {
    case 1:
      return { riskProfile: data.riskProfile };
    case 2:
      return { investmentGoals: data.investmentGoals };
    case 3:
      return { esgPreferences: data.esgPreferences };
    case 4:
      return { financialKnowledge: data.financialKnowledge };
    case 5:
      return { financialPicture: data.financialPicture };
    default:
      return {};
  }
}

export function WizardShell({
  profile,
  initialStep,
  onSave,
  onExit,
  isSaving,
  canEdit,
}: WizardShellProps) {
  const { t } = useTranslation("ai-insights");
  const [validationErrorKey, setValidationErrorKey] = useState<string | null>(null);

  const stepSyncKey = buildStepSyncKey(profile, initialStep);
  const externalStep = resolveExternalStep(profile, initialStep);

  const [stepState, setStepState] = useState({
    syncKey: stepSyncKey,
    step: externalStep,
  });

  if (stepState.syncKey !== stepSyncKey) {
    setStepState({ syncKey: stepSyncKey, step: externalStep });
  }

  const currentStep = stepState.step;
  const setCurrentStep = (next: number | ((prev: number) => number)) => {
    setStepState((prev) => ({
      syncKey: prev.syncKey,
      step: typeof next === "function" ? next(prev.step) : next,
    }));
  };

  const form = useForm<WizardFormData>({
    defaultValues: profileToFormData(profile),
    mode: "onSubmit",
  });

  useEffect(() => {
    form.reset(profileToFormData(profile));
  }, [profile, form]);

  const handleSave = async (options: { complete?: boolean; advance?: boolean }) => {
    const data = form.getValues();
    const errorKey = validateStep(currentStep, data);
    if (errorKey) {
      setValidationErrorKey(errorKey);
      return;
    }
    setValidationErrorKey(null);
    await onSave(currentStep, data, options);
    if (options.complete) {
      onExit();
      return;
    }
    if (options.advance) {
      setCurrentStep((s) => Math.min(TOTAL_STEPS, s + 1));
    }
  };

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      await handleSave({ advance: true });
    }
  };

  const handleFinish = async () => {
    await handleSave({ complete: true });
  };

  const handleSaveAndExit = async () => {
    setValidationErrorKey(null);
    await onSave(currentStep, form.getValues(), {});
    onExit();
  };

  const renderStep = () => {
    const { control } = form;
    switch (currentStep) {
      case 1:
        return <RiskProfileStep control={control} />;
      case 2:
        return <InvestmentGoalsStep control={control} />;
      case 3:
        return <EsgPreferenceStep control={control} />;
      case 4:
        return <FinancialKnowledgeStep control={control} />;
      case 5:
        return <FinancialPictureStep control={control} />;
      default:
        return null;
    }
  };

  return (
    <Stack gap={6}>
      <div>
        <Typography variant="title">{t("wizard.title")}</Typography>
        <Typography variant="muted" className="mt-1">
          {t("wizard.subtitle")}
        </Typography>
        <Typography variant="muted-sm" className="mt-2">
          {t("wizard.stepOf", { current: currentStep, total: TOTAL_STEPS })}
        </Typography>
      </div>

      <WizardStepper currentStep={currentStep} />

      <Card>
        <CardHeader>
          <CardTitle>{t(`steps.${["riskProfile", "investmentGoals", "esgPreferences", "financialKnowledge", "financialPicture"][currentStep - 1]}`)}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStep()}
          {validationErrorKey && (
            <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {t(validationErrorKey)}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" onClick={handleSaveAndExit} disabled={isSaving}>
          {isSaving ? t("wizard.saving") : t("wizard.saveAndExit")}
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1 || isSaving}
          >
            {t("wizard.back")}
          </Button>
          {currentStep < TOTAL_STEPS ? (
            <Button type="button" onClick={handleNext} disabled={isSaving || !canEdit}>
              {isSaving ? <Spinner className="size-4" /> : t("wizard.next")}
            </Button>
          ) : (
            <Button type="button" onClick={handleFinish} disabled={isSaving || !canEdit}>
              {isSaving ? <Spinner className="size-4" /> : t("wizard.finish")}
            </Button>
          )}
        </div>
      </div>
    </Stack>
  );
}

// Export helper for parent to build save payload
export { stepPayload, TOTAL_STEPS };
