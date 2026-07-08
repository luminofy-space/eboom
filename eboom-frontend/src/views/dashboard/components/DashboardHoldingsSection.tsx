"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/grid";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { GridCard } from "@/src/components/GridCard";
import { formatMoney } from "@/src/i18n/formatters";
import type { CanvasSummary } from "@/src/types/dashboard";
import { useTranslation } from "react-i18next";

interface DashboardHoldingsSectionProps {
  summary: CanvasSummary | undefined;
  isLoading: boolean;
}

export function DashboardHoldingsSection({
  summary,
  isLoading,
}: DashboardHoldingsSectionProps) {
  const { t } = useTranslation("dashboard");

  if (isLoading) {
    return (
      <Container>
        <Stack gap={4}>
          <Typography variant="title">{t("assets.title")}</Typography>
          <Grid variant="cards" gap={4}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-xl bg-muted animate-pulse" />
            ))}
          </Grid>
        </Stack>
      </Container>
    );
  }

  const assetCount = summary?.counts.assets ?? 0;
  const assetSummaries = summary?.assetSummaries ?? [];
  const assetsByCurrency = summary?.assetsByCurrency ?? [];

  if (assetCount === 0) {
    return (
      <Container>
        <Stack gap={3}>
          <Typography variant="title">{t("assets.title")}</Typography>
          <Typography variant="muted-sm">{t("assets.empty")}</Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container>
      <Stack gap={4}>
        <Stack direction="row" align="center" justify="between" gap={4}>
          <Typography variant="title">{t("assets.title")}</Typography>
          <Button variant="outline" size="sm" asChild>
            <Link href="/assets">{t("assets.viewAll")}</Link>
          </Button>
        </Stack>

        {assetsByCurrency.length > 0 && (
          <Stack direction="row" gap={2} className="flex-wrap">
            {assetsByCurrency.map((row) => (
              <Badge key={row.currencyCode} variant="secondary" className="px-3 py-1">
                {row.currencyCode}: {formatMoney(row.totalHoldingValue, row.currencySymbol)}{" "}
                ({t("assets.assetCount", { count: row.count })})
              </Badge>
            ))}
          </Stack>
        )}

        {assetSummaries.length > 0 && (
          <Grid variant="cards" gap={4}>
            {assetSummaries.map((asset) => (
              <GridCard
                key={asset.id}
                href={`/asset/${asset.id}`}
                imageUrl={asset.photoUrl}
                title={asset.name}
                subtitle={formatMoney(asset.currentHoldingValue, asset.currencySymbol)}
                updatedAt={asset.lastModifiedAt}
              />
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
