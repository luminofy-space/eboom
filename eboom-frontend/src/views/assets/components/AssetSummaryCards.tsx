"use client";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/grid";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography, typographyVariants } from "@/components/ui/typography";
import { formatMoney } from "@/src/i18n/formatters";
import { cn } from "@/lib/utils";
import type { AssetItem } from "@/src/redux/assetSlice";
import { useTranslation } from "react-i18next";

interface AssetSummaryCardsProps {
  asset?: AssetItem;
  isLoading?: boolean;
}

export function AssetSummaryCards({ asset, isLoading }: AssetSummaryCardsProps) {
  const { t } = useTranslation("assets");
  const symbol = asset?.currency?.symbol;
  const pnl = Number(asset?.unrealizedPnL ?? 0);
  const pnlPositive = pnl >= 0;

  if (isLoading) {
    return (
      <Container>
        <Grid variant="stats" gap={4}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="@container/card">
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </CardHeader>
            </Card>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container>
      <Grid variant="stats" gap={4}>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>{t("summaryCards.quantity.label")}</CardDescription>
            <CardTitle className={typographyVariants({ variant: "stat" })}>
              {asset?.currentQuantity ?? "0"}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <Typography variant="muted">{t("summaryCards.quantity.footer")}</Typography>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>{t("summaryCards.costBasis.label")}</CardDescription>
            <CardTitle className={typographyVariants({ variant: "stat" })}>
              {formatMoney(asset?.costBasis ?? "0", symbol)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <Typography variant="muted">{t("summaryCards.costBasis.footer")}</Typography>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>{t("summaryCards.holdingValue.label")}</CardDescription>
            <CardTitle className={typographyVariants({ variant: "stat" })}>
              {formatMoney(asset?.currentHoldingValue ?? "0", symbol)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <Typography variant="muted">{t("summaryCards.holdingValue.footer")}</Typography>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>{t("summaryCards.unrealizedPnL.label")}</CardDescription>
            <CardTitle
              className={cn(
                typographyVariants({ variant: "stat" }),
                pnlPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
              )}
            >
              {formatMoney(asset?.unrealizedPnL ?? "0", symbol)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <Typography variant="muted">{t("summaryCards.unrealizedPnL.footer")}</Typography>
          </CardFooter>
        </Card>
      </Grid>
    </Container>
  );
}
