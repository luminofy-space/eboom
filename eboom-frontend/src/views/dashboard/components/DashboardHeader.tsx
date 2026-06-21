"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import type { Canvas } from "@/src/types/common";
import { useTranslation } from "react-i18next";

interface DashboardHeaderProps {
  canvas: Canvas | null;
  currencies?: string[];
  selectedCurrency?: string;
  onCurrencyChange?: (currencyCode: string) => void;
}

export function DashboardHeader({
  canvas,
  currencies = [],
  selectedCurrency,
  onCurrencyChange,
}: DashboardHeaderProps) {
  const { t } = useTranslation("dashboard");

  return (
    <Container>
      <Stack
        direction="row"
        align="start"
        justify="between"
        gap={4}
        className="flex-wrap"
      >
        <Stack gap={2} className="min-w-0 flex-1">
          <Typography variant="display">
            {canvas?.name ?? t("title")}
          </Typography>
          {canvas?.description && (
            <Typography variant="muted">{canvas.description}</Typography>
          )}
        </Stack>

        {currencies.length > 0 && selectedCurrency && onCurrencyChange && (
          <Stack gap={1} className="w-full sm:w-auto sm:min-w-[180px]">
            <Typography variant="label">{t("header.currency")}</Typography>
            <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
              <SelectTrigger size="sm" aria-label={t("header.currency")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
