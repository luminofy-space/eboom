"use client";

import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { WIZARD_STEPS } from "../types";

interface WizardStepperProps {
  currentStep: number;
  className?: string;
}

export function WizardStepper({ currentStep, className }: WizardStepperProps) {
  const { t } = useTranslation("ai-insights");

  return (
    <nav aria-label={t("wizard.title")} className={cn("w-full", className)}>
      <ol className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {WIZARD_STEPS.map((stepKey, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <li
              key={stepKey}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 sm:flex-col sm:items-center sm:text-center",
                index < WIZARD_STEPS.length - 1 && "sm:pb-0"
              )}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-primary/10 text-primary",
                  !isComplete && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isComplete ? <Check className="size-4" /> : stepNumber}
              </div>
              <span
                className={cn(
                  "text-xs leading-tight sm:mt-1",
                  isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {t(`steps.${stepKey}`)}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
