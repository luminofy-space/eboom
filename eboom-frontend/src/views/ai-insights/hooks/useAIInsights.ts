"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useMutationApi } from "@/src/api/useMutation";
import { useCanvas } from "@/src/hooks/useCanvas";
import type { AiInsightsResponse } from "../types";

export function useAIInsights() {
  const { canvas } = useCanvas();
  const queryClient = useQueryClient();
  const queryKey = ["ai-insights", canvas];

  const { data, isLoading, isError, refetch } = useQueryApi<AiInsightsResponse>(
    canvas ? API_ROUTES.CANVAS_AI_INSIGHTS(canvas) : "",
    {
      queryKey,
      enabled: !!canvas,
    }
  );

  const { mutateAsync, isPending: isGenerating } = useMutationApi<AiInsightsResponse>(
    canvas ? API_ROUTES.CANVAS_AI_INSIGHTS_GENERATE(canvas) : "",
    { method: "post" }
  );

  const generateInsights = useCallback(async () => {
    if (!canvas) throw new Error("No canvas selected");
    const result = await mutateAsync({});
    await queryClient.invalidateQueries({ queryKey });
    return result;
  }, [canvas, mutateAsync, queryClient, queryKey]);

  return {
    insight: data?.insight ?? null,
    profile: data?.profile ?? null,
    completeness: data?.completeness ?? { score: 0, breakdown: { wizard: 0, wallets: 0, incomes: 0, expenses: 0, assets: 0, budget: 0, savingsGoal: 0 } },
    isLoading,
    isError,
    refetch,
    generateInsights,
    isGenerating,
    canvasId: canvas,
  };
}
