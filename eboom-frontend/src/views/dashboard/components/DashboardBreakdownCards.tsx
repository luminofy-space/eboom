"use client";

import Link from "next/link";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/grid";
import { Stack } from "@/components/ui/stack";
import { Typography, typographyVariants } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { formatMoney } from "@/src/i18n/formatters";
import type { CanvasSummary } from "../types";
import { computeDashboardStatsByCurrency } from "../utils/dashboardStats";
import { useTranslation } from "react-i18next";
import { ArrowRight, BanknoteArrowDown, BanknoteArrowUp, Wallet } from "lucide-react";

interface DashboardBreakdownCardsProps {
  summary?: CanvasSummary;
  currencyCode?: string;
  isLoading?: boolean;
}

import { ENTITY_CARD_GRADIENT } from "@/src/styles/entity-card-styles";

function BreakdownSkeleton() {
  return (
    <Card className="@container/card">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-40" />
      </CardHeader>
    </Card>
  );
}

export function DashboardBreakdownCards({
  summary,
  currencyCode,
  isLoading,
}: DashboardBreakdownCardsProps) {
  const { t } = useTranslation("dashboard");

  const stats = useMemo(() => {
    if (!summary) return null;
    const all = computeDashboardStatsByCurrency(summary);
    if (!currencyCode) return all[0] ?? null;
    return all.find((item) => item.currencyCode === currencyCode) ?? all[0] ?? null;
  }, [summary, currencyCode]);

  if (isLoading) {
    return (
      <Container>
        <Stack gap={4}>
          <Typography variant="title">{t("sections.title")}</Typography>
          <Grid variant="none" gap={4} className="grid-cols-1 @xl/main:grid-cols-3">
            <BreakdownSkeleton />
            <BreakdownSkeleton />
            <BreakdownSkeleton />
          </Grid>
        </Stack>
      </Container>
    );
  }

  if (!summary || !stats) {
    return null;
  }

  const { currencySymbol } = stats;

  const cards = [
    {
      key: "wallets",
      href: "/wallets",
      icon: Wallet,
      gradient: ENTITY_CARD_GRADIENT.wallet,
      label: t("sections.wallets.title"),
      value: formatMoney(stats.totalBalance, currencySymbol),
    },
    {
      key: "incomes",
      href: "/incomes",
      icon: BanknoteArrowUp,
      gradient: ENTITY_CARD_GRADIENT.income,
      label: t("sections.incomes.title"),
      value: formatMoney(stats.incomeStats.totalReceived, currencySymbol),
    },
    {
      key: "expenses",
      href: "/expenses",
      icon: BanknoteArrowDown,
      gradient: ENTITY_CARD_GRADIENT.expense,
      label: t("sections.expenses.title"),
      value: formatMoney(stats.expenseStats.totalPaid, currencySymbol),
    },
  ] as const;

  return (
    <Container>
      <Stack gap={4}>
        <Typography variant="title">{t("sections.title")}</Typography>
        <Grid variant="none" gap={4} className="grid-cols-1 @xl/main:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.key}
                className={cn("@container/card flex flex-col", card.gradient)}
              >
                <CardHeader>
                  <CardDescription className="flex items-center gap-3">
                    <Icon className="size-7 shrink-0" />
                    <span className="text-base font-medium">{card.label}</span>
                  </CardDescription>
                  <CardTitle className={typographyVariants({ variant: "stat" })}>
                    {card.value}
                  </CardTitle>
                </CardHeader>
                <CardFooter className="mt-auto flex justify-end pt-0">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={card.href}>
                      {t("sections.viewAll")} <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </Grid>
      </Stack>
    </Container>
  );
}
