"use client";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { formatMoney } from "@/src/i18n/formatters";
import { useTranslation } from "react-i18next";
import { AssetSummaryCards } from "./components/AssetSummaryCards";
import { AssetValuationChart } from "./components/AssetValuationChart";
import { AssetVolumesTable } from "./components/AssetVolumesTable";
import { AssetPricePointsTable } from "./components/AssetPricePointsTable";
import { useAssetDetail } from "./hooks/useAssetDetail";

interface Props {
  id: number;
}

export default function AssetDetailPage({ id }: Props) {
  const { t } = useTranslation("assets");
  const { asset, volumes, pricePoints, series, isLoading, isError } = useAssetDetail(id);

  if (isError) {
    return (
      <Container>
        <Stack className="h-96" align="center" justify="center">
          <Typography variant="muted-sm">{t("detail.loadError")}</Typography>
        </Stack>
      </Container>
    );
  }

  const symbol = asset?.currency?.symbol;

  return (
    <>
      <Container>
        <Stack gap={4}>
          {asset && (
            <div>
              <Typography variant="display">{asset.name}</Typography>
              {asset.description != null && String(asset.description).length > 0 && (
                <Typography variant="muted">{String(asset.description)}</Typography>
              )}
            </div>
          )}

          {asset?.currency && (
            <Stack direction="row" gap={2} className="flex-wrap">
              <Badge variant="secondary" className="px-3 py-1.5 text-sm tabular-nums">
                {formatMoney(asset.currentHoldingValue ?? "0", symbol)} ({asset.currency.code})
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5 text-sm">
                {t("detail.quantityHeld")}: {asset.currentQuantity ?? "0"}
              </Badge>
            </Stack>
          )}
        </Stack>
      </Container>

      <Container>
        <AssetValuationChart
          series={series}
          currencySymbol={symbol}
          isLoading={isLoading}
        />
      </Container>

      <AssetSummaryCards asset={asset} isLoading={isLoading} />

      <AssetVolumesTable
        assetId={id}
        volumes={volumes}
        currencySymbol={symbol}
        isLoading={isLoading}
        isError={isError}
      />

      <div className="my-8" />

      <AssetPricePointsTable
        assetId={id}
        pricePoints={pricePoints}
        currencySymbol={symbol}
        isLoading={isLoading}
        isError={isError}
      />
    </>
  );
}
