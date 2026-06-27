"use client";

import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import type { CanvasSummary } from "../types";

export function useDashboardSummary(canvasId: number | null) {
  return useQueryApi<CanvasSummary>(
    canvasId ? API_ROUTES.CANVAS_SUMMARY(canvasId) : "",
    {
      queryKey: ["canvas-summary", canvasId],
      enabled: !!canvasId,
      hasToken: true,
    }
  );
}
