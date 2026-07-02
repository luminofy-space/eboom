"use client";

import { Controller, type Control } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stack } from "@/components/ui/stack";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { SystemCurrencySelect } from "@/src/views/budget-planning/components/SystemCurrencySelect";
import { GOAL_OPTIONS, type WizardFormData } from "../../types";

interface InvestmentGoalsStepProps {
  control: Control<WizardFormData>;
}

export function InvestmentGoalsStep({ control }: InvestmentGoalsStepProps) {
  const { t } = useTranslation("ai-insights");

  return (
    <Stack gap={6}>
      <div>
        <Typography variant="heading">{t("investmentGoals.title")}</Typography>
        <Typography variant="muted" className="mt-1">
          {t("investmentGoals.description")}
        </Typography>
      </div>

      <Controller
        name="investmentGoals.primaryGoal"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("investmentGoals.primaryGoal")}</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_OPTIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`investmentGoals.goals.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      <Controller
        name="investmentGoals.secondaryGoals"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("investmentGoals.secondaryGoals")}</FieldLabel>
            <div className="grid gap-2 sm:grid-cols-2">
              {GOAL_OPTIONS.map((goal) => {
                const checked = field.value.includes(goal);
                return (
                  <label
                    key={goal}
                    className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(isChecked) => {
                        if (isChecked) {
                          field.onChange([...field.value, goal]);
                        } else {
                          field.onChange(field.value.filter((g) => g !== goal));
                        }
                      }}
                    />
                    {t(`investmentGoals.goals.${goal}`)}
                  </label>
                );
              })}
            </div>
          </Field>
        )}
      />

      <Controller
        name="investmentGoals.targetAmount"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("investmentGoals.targetAmount")}</FieldLabel>
            <NumberInput
              min={0}
              step="any"
              value={field.value ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val === "" ? null : Number(val));
              }}
            />
          </Field>
        )}
      />

      <Controller
        name="investmentGoals.targetCurrencyId"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("investmentGoals.targetCurrency")}</FieldLabel>
            <SystemCurrencySelect
              value={field.value ? String(field.value) : ""}
              onValueChange={(v) => field.onChange(v ? Number(v) : null)}
            />
          </Field>
        )}
      />

      <Controller
        name="investmentGoals.targetTimeframe"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("investmentGoals.targetTimeframe")}</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["under_1", "1_3", "3_10", "10_plus"] as const).map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`investmentGoals.timeframe.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      <Controller
        name="investmentGoals.goalPriorityNote"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("investmentGoals.goalPriorityNote")}</FieldLabel>
            <Textarea
              rows={3}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
            />
            <FieldDescription>{t("investmentGoals.description")}</FieldDescription>
          </Field>
        )}
      />
    </Stack>
  );
}
