"use client";

import { Controller, type Control, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Field, FieldLabel } from "@/components/ui/field";
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
import type { WizardFormData } from "@/src/types/ai-insights";

interface FinancialPictureStepProps {
  control: Control<WizardFormData>;
}

export function FinancialPictureStep({ control }: FinancialPictureStepProps) {
  const { t } = useTranslation("ai-insights");
  const hasLongTerm = useWatch({ control, name: "financialPicture.hasMajorLongTermLiabilities" });
  const hasShortTerm = useWatch({ control, name: "financialPicture.hasShortTermLiabilities" });

  return (
    <Stack gap={6}>
      <div>
        <Typography variant="heading">{t("financialPicture.title")}</Typography>
        <Typography variant="muted" className="mt-1">
          {t("financialPicture.description")}
        </Typography>
      </div>

      <Controller
        name="financialPicture.hasMajorLongTermLiabilities"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("financialPicture.hasMajorLongTermLiabilities")}</FieldLabel>
            <Select
              value={field.value ? "yes" : "no"}
              onValueChange={(v) => field.onChange(v === "yes")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">{t("financialPicture.yes")}</SelectItem>
                <SelectItem value="no">{t("financialPicture.no")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      {hasLongTerm && (
        <Controller
          name="financialPicture.majorLongTermLiabilitiesAmount"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>{t("financialPicture.majorLongTermLiabilitiesAmount")}</FieldLabel>
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
      )}

      <Controller
        name="financialPicture.hasShortTermLiabilities"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("financialPicture.hasShortTermLiabilities")}</FieldLabel>
            <Select
              value={field.value ? "yes" : "no"}
              onValueChange={(v) => field.onChange(v === "yes")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">{t("financialPicture.yes")}</SelectItem>
                <SelectItem value="no">{t("financialPicture.no")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      {hasShortTerm && (
        <Controller
          name="financialPicture.shortTermLiabilitiesAmount"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>{t("financialPicture.shortTermLiabilitiesAmount")}</FieldLabel>
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
      )}

      <Controller
        name="financialPicture.expectedMonthlyCashflow"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("financialPicture.expectedMonthlyCashflow")}</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["deficit", "break_even", "small_surplus", "large_surplus"] as const).map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {t(`financialPicture.cashflow.${value}`)}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      <Controller
        name="financialPicture.emergencyFundCoverage"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("financialPicture.emergencyFundCoverage")}</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["none", "under_1", "1_3", "3_6", "6_plus"] as const).map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`financialPicture.coverage.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      <Controller
        name="financialPicture.dependentsCount"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("financialPicture.dependentsCount")}</FieldLabel>
            <NumberInput
              min={0}
              max={10}
              value={field.value}
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val === "" ? 0 : Number(val));
              }}
            />
          </Field>
        )}
      />

      <Controller
        name="financialPicture.additionalNotes"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("financialPicture.additionalNotes")}</FieldLabel>
            <Textarea
              rows={3}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
            />
          </Field>
        )}
      />
    </Stack>
  );
}
