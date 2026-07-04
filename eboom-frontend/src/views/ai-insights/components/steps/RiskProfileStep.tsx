"use client";

import { Controller, type Control } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import type { WizardFormData } from "../../types";

interface RiskProfileStepProps {
  control: Control<WizardFormData>;
}

export function RiskProfileStep({ control }: RiskProfileStepProps) {
  const { t } = useTranslation("ai-insights");

  return (
    <Stack gap={6}>
      <div>
        <Typography variant="heading">{t("riskProfile.title")}</Typography>
        <Typography variant="muted" className="mt-1">
          {t("riskProfile.description")}
        </Typography>
      </div>

      <Controller
        name="riskProfile.riskTolerance"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("riskProfile.riskTolerance")}</FieldLabel>
            <Slider
              min={1}
              max={5}
              step={1}
              value={field.value}
              onValueChange={field.onChange}
            />
            <FieldDescription>
              {t(`riskProfile.riskToleranceLabels.${field.value}` as const)}
            </FieldDescription>
          </Field>
        )}
      />

      <Controller
        name="riskProfile.investmentTimeHorizon"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{t("riskProfile.investmentTimeHorizon")}</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["under_3", "3_7", "7_15", "15_plus"] as const).map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`riskProfile.timeHorizon.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name="riskProfile.acceptShortTermLoss"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("riskProfile.acceptShortTermLoss")}</FieldLabel>
            <Select
              value={String(field.value)}
              onValueChange={(v) => field.onChange(Number(v) as 1 | 2 | 3 | 4 | 5)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {([1, 2, 3, 4, 5] as const).map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {t(`riskProfile.likert.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      <Controller
        name="riskProfile.portfolioDropReaction"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{t("riskProfile.portfolioDropReaction")}</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["sell", "hold", "buy_more"] as const).map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`riskProfile.dropReaction.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </Stack>
  );
}
