"use client";

import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import type { CompletenessBreakdown, CompletenessResult } from "../types";

const FACTOR_KEYS: (keyof CompletenessBreakdown)[] = [
  "wizard",
  "wallets",
  "incomes",
  "expenses",
  "assets",
  "budget",
  "savingsGoal",
];

interface CompletenessMeterProps {
  completeness: CompletenessResult;
}

export function CompletenessMeter({ completeness }: CompletenessMeterProps) {
  const { t } = useTranslation("ai-insights");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("completeness.title")}</CardTitle>
        <Typography variant="muted-sm">
          {t("completeness.score", { score: completeness.score })}
        </Typography>
      </CardHeader>
      <CardContent>
        <Stack gap={4}>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${completeness.score}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FACTOR_KEYS.map((key) => {
              const value = completeness.breakdown[key];
              if (value <= 0) return null;
              return (
                <Badge key={key} variant="secondary">
                  {t(`completeness.factors.${key}`)} +{value}
                </Badge>
              );
            })}
          </div>
        </Stack>
      </CardContent>
    </Card>
  );
}
