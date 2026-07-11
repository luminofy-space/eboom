"use client";

import { Controller, type Control } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import type { WizardFormData } from "@/src/types/ai-insights";

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
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{t("riskProfile.riskTolerance")}</FieldLabel>
            <Select
              value={field.value != null ? String(field.value) : ""}
              onValueChange={(v) => field.onChange(Number(v) as 1 | 2 | 3 | 4 | 5)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("form.selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {([1, 2, 3, 4, 5] as const).map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {t(`riskProfile.riskToleranceLabels.${value}` as const)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name="riskProfile.investmentTimeHorizon"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{t("riskProfile.investmentTimeHorizon")}</FieldLabel>
            <Select
              value={field.value ?? ""}
              onValueChange={field.onChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("form.selectPlaceholder")} />
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
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{t("riskProfile.acceptShortTermLoss")}</FieldLabel>
            <Select
              value={field.value != null ? String(field.value) : ""}
              onValueChange={(v) => field.onChange(Number(v) as 1 | 2 | 3 | 4 | 5)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("form.selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {([1, 2, 3, 4, 5] as const).map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {t(`riskProfile.likert.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name="riskProfile.portfolioDropReaction"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{t("riskProfile.portfolioDropReaction")}</FieldLabel>
            <Select
              value={field.value ?? ""}
              onValueChange={field.onChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("form.selectPlaceholder")} />
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
