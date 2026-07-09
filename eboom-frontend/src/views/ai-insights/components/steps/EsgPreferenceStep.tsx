"use client";

import { Controller, type Control } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { ESG_SECTOR_OPTIONS, type WizardFormData } from "@/src/types/ai-insights";

interface EsgPreferenceStepProps {
  control: Control<WizardFormData>;
}

export function EsgPreferenceStep({ control }: EsgPreferenceStepProps) {
  const { t } = useTranslation("ai-insights");

  return (
    <Stack gap={6}>
      <div>
        <Typography variant="heading">{t("esgPreferences.title")}</Typography>
        <Typography variant="muted" className="mt-1">
          {t("esgPreferences.description")}
        </Typography>
      </div>

      <Controller
        name="esgPreferences.esgImportance"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("esgPreferences.esgImportance")}</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["not_important", "somewhat", "very_important", "deal_breaker"] as const).map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {t(`esgPreferences.importance.${value}`)}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      <Controller
        name="esgPreferences.avoidSectors"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("esgPreferences.avoidSectors")}</FieldLabel>
            <div className="grid gap-2 sm:grid-cols-2">
              {ESG_SECTOR_OPTIONS.map((sector) => {
                const checked = field.value.includes(sector);
                return (
                  <label
                    key={sector}
                    className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(isChecked) => {
                        if (sector === "none") {
                          field.onChange(isChecked ? ["none"] : []);
                          return;
                        }
                        const withoutNone = field.value.filter((s) => s !== "none");
                        if (isChecked) {
                          field.onChange([...withoutNone, sector]);
                        } else {
                          field.onChange(withoutNone.filter((s) => s !== sector));
                        }
                      }}
                    />
                    {t(`esgPreferences.sectors.${sector}`)}
                  </label>
                );
              })}
            </div>
          </Field>
        )}
      />

      <Controller
        name="esgPreferences.acceptLowerReturnsForEsg"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("esgPreferences.acceptLowerReturnsForEsg")}</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["yes", "no", "slightly_lower"] as const).map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`esgPreferences.returnsChoice.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      <Controller
        name="esgPreferences.preferSustainableInvestments"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("esgPreferences.preferSustainableInvestments")}</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["yes", "no", "unsure"] as const).map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`esgPreferences.preferChoice.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      />
    </Stack>
  );
}
