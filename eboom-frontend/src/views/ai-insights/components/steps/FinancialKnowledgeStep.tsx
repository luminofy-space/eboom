"use client";

import { Controller, type Control, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Field, FieldLabel } from "@/components/ui/field";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { QUIZ_QUESTION_IDS, type WizardFormData } from "../../types";

interface FinancialKnowledgeStepProps {
  control: Control<WizardFormData>;
}

const QUESTION_OPTIONS: Record<
  (typeof QUIZ_QUESTION_IDS)[number],
  readonly string[]
> = {
  q1: ["unspecific", "company_specific"],
  q2: ["increases", "decreases", "unchanged"],
  q3: ["fixed_rate", "earnings_on_earnings", "simple_interest"],
  q4: ["rise", "lower_yields", "unchanged"],
  q5: ["1_month", "3_6_months", "12_months"],
};

export function FinancialKnowledgeStep({ control }: FinancialKnowledgeStepProps) {
  const { t } = useTranslation("ai-insights");
  const answers = useWatch({ control, name: "financialKnowledge.answers" }) ?? {};
  const answeredCount = Object.keys(answers).length;

  return (
    <Stack gap={6}>
      <div>
        <Typography variant="heading">{t("financialKnowledge.title")}</Typography>
        <Typography variant="muted" className="mt-1">
          {t("financialKnowledge.description")}
        </Typography>
        {answeredCount > 0 && (
          <Typography variant="muted-sm" className="mt-2">
            {t("financialKnowledge.scorePreview", { score: answeredCount })}
          </Typography>
        )}
      </div>

      {QUIZ_QUESTION_IDS.map((questionId, index) => (
        <Controller
          key={questionId}
          name={`financialKnowledge.answers.${questionId}`}
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>
                {index + 1}. {t(`financialKnowledge.questions.${questionId}.prompt`)}
              </FieldLabel>
              <div className="grid gap-2">
                {QUESTION_OPTIONS[questionId].map((optionKey) => {
                  const selected = field.value === optionKey;
                  return (
                    <button
                      key={optionKey}
                      type="button"
                      onClick={() => field.onChange(optionKey)}
                      className={cn(
                        "rounded-md border px-4 py-3 text-left text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/40"
                      )}
                    >
                      {t(
                        `financialKnowledge.questions.${questionId}.options.${optionKey}`
                      )}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}
        />
      ))}
    </Stack>
  );
}
