"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useMutationApi } from "@/src/api/useMutation";
import { useCanvas } from "@/src/hooks/useCanvas";
import type { AiInsightsResponse } from "@/src/types/ai-insights";

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 5 * 60 * 1_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasFreshInsights(
  response: AiInsightsResponse,
  previousGeneratedAt: string | null
): boolean {
  const generatedAt = response.insight?.generatedAt ?? null;
  const insightCount = response.insight?.insights?.length ?? 0;

  if (insightCount === 0) return false;
  if (!previousGeneratedAt) return true;
  return generatedAt !== null && generatedAt !== previousGeneratedAt;
}

export function useAIInsights() {
  const { canvas } = useCanvas();
  const queryClient = useQueryClient();
  const queryKey = ["ai-insights", canvas];
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef(false);

  const { data, isLoading, isError, refetch } = useQueryApi<AiInsightsResponse>(
    canvas ? API_ROUTES.CANVAS_AI_INSIGHTS(canvas) : "",
    {
      queryKey,
      enabled: !!canvas,
    }
  );

  const { mutateAsync, isPending: isStartingGeneration } = useMutationApi<
    object,
    AiInsightsResponse
  >(canvas ? API_ROUTES.CANVAS_AI_INSIGHTS_GENERATE(canvas) : "", {
    method: "post",
    invalidateQueries: false,
    timeout: 30_000,
  });

  const pollUntilComplete = useCallback(
    async (previousGeneratedAt: string | null) => {
      if (pollingRef.current) return;
      pollingRef.current = true;
      setIsPolling(true);

      try {
        const startedAt = Date.now();

        while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
          const result = await refetch();
          const response = result.data;

          if (!response) {
            await sleep(POLL_INTERVAL_MS);
            continue;
          }

          if (response.generation?.status === "failed") {
            throw Object.assign(new Error(response.generation.error ?? "Generation failed"), {
              code: "GENERATION_FAILED",
            });
          }

          if (
            response.generation?.status !== "running" &&
            hasFreshInsights(response, previousGeneratedAt)
          ) {
            await queryClient.setQueryData(queryKey, response);
            return response;
          }

          await sleep(POLL_INTERVAL_MS);
        }

        throw Object.assign(new Error("Generation timed out"), { code: "GENERATION_TIMEOUT" });
      } finally {
        pollingRef.current = false;
        setIsPolling(false);
      }
    },
    [queryClient, queryKey, refetch]
  );

  const generateInsights = useCallback(async () => {
    if (!canvas) throw new Error("No canvas selected");

    const previousGeneratedAt = data?.insight?.generatedAt ?? null;
    await mutateAsync({});
    return pollUntilComplete(previousGeneratedAt);
  }, [canvas, data?.insight?.generatedAt, mutateAsync, pollUntilComplete]);

  useEffect(() => {
    if (!canvas || isLoading || isPolling || pollingRef.current) return;
    if (data?.generation?.status !== "running") return;

    void pollUntilComplete(data?.insight?.generatedAt ?? null).catch(() => {
      void queryClient.invalidateQueries({ queryKey });
    });
  }, [
    canvas,
    data?.generation?.status,
    data?.insight?.generatedAt,
    isLoading,
    isPolling,
    pollUntilComplete,
    queryClient,
    queryKey,
  ]);

  return {
    insight: data?.insight ?? null,
    profile: data?.profile ?? null,
    completeness: data?.completeness ?? {
      score: 0,
      breakdown: {
        wizard: 0,
        wallets: 0,
        incomes: 0,
        expenses: 0,
        assets: 0,
        budget: 0,
        savingsGoal: 0,
      },
    },
    isLoading,
    isError,
    refetch,
    generateInsights,
    isGenerating: isStartingGeneration || isPolling,
    canvasId: canvas,
  };
}
