"use client";

import useQueryApi from "@/src/api/useQuery";
import API_ROUTES from "@/src/api/urls";
import { useCanvas } from "@/src/hooks/useCanvas";
import type { AssetItem } from "@/src/redux/assetSlice";

export interface AssetVolume {
  id: number;
  assetId: number;
  quantity: string;
  unitPrice: string;
  recordedAt: string;
  notes?: string | null;
  createdAt?: string | null;
  createdBy?: number | null;
}

export interface AssetPricePoint {
  id: number;
  assetId: number;
  unitPrice: string;
  recordedAt: string;
  notes?: string | null;
  createdAt?: string | null;
  createdBy?: number | null;
}

export interface AssetValuationSeriesPoint {
  recordedAt: string;
  unitPrice: string;
  quantity: string;
  costBasis: string;
  holdingValue: string;
  unrealizedPnL: string;
}

interface UseAssetDetailOptions {
  enabled?: boolean;
}

export function useAssetDetail(assetId: number, options?: UseAssetDetailOptions) {
  const { canvas } = useCanvas();
  const enabled = (options?.enabled ?? true) && !!canvas && !!assetId;

  const {
    data: assetRes,
    isLoading: isLoadingAsset,
    isError: isAssetError,
  } = useQueryApi<{ asset: AssetItem }>(
    canvas ? API_ROUTES.ASSETS_GET(canvas, assetId) : "",
    {
      queryKey: ["asset", canvas, assetId],
      enabled,
    }
  );

  const {
    data: volumesRes,
    isLoading: isLoadingVolumes,
    isError: isVolumesError,
  } = useQueryApi<{ volumes: AssetVolume[] }>(
    canvas ? API_ROUTES.ASSET_VOLUMES_LIST(canvas, assetId) : "",
    {
      queryKey: ["asset-volumes", canvas, assetId],
      enabled,
    }
  );

  const {
    data: pricePointsRes,
    isLoading: isLoadingPricePoints,
    isError: isPricePointsError,
  } = useQueryApi<{ pricePoints: AssetPricePoint[] }>(
    canvas ? API_ROUTES.ASSET_PRICE_POINTS_LIST(canvas, assetId) : "",
    {
      queryKey: ["asset-price-points", canvas, assetId],
      enabled,
    }
  );

  const {
    data: seriesRes,
    isLoading: isLoadingSeries,
    isError: isSeriesError,
  } = useQueryApi<{ series: AssetValuationSeriesPoint[] }>(
    canvas ? API_ROUTES.ASSET_VALUATION_SERIES(canvas, assetId) : "",
    {
      queryKey: ["asset-valuation-series", canvas, assetId],
      enabled,
    }
  );

  return {
    asset: assetRes?.asset,
    volumes: volumesRes?.volumes ?? [],
    pricePoints: pricePointsRes?.pricePoints ?? [],
    series: seriesRes?.series ?? [],
    isLoading:
      isLoadingAsset || isLoadingVolumes || isLoadingPricePoints || isLoadingSeries,
    isError: isAssetError || isVolumesError || isPricePointsError || isSeriesError,
  };
}
