"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useMutationApi } from "@/src/api/useMutation";
import { useCanvas } from "@/src/hooks/useCanvas";
import type { AiInsightProfile, AiInsightProfileSavePayload } from "../types";

export function useAIInsightProfile() {
  const { canvas } = useCanvas();
  const queryClient = useQueryClient();
  const queryKey = ["ai-insight-profile", canvas];

  const { data, isLoading, isError, refetch } = useQueryApi<{ profile: AiInsightProfile | null }>(
    canvas ? API_ROUTES.CANVAS_AI_INSIGHT_PROFILE(canvas) : "",
    {
      queryKey,
      enabled: !!canvas,
    }
  );

  const { mutateAsync, isPending: isSaving } = useMutationApi<{ profile: AiInsightProfile }>(
    canvas ? API_ROUTES.CANVAS_AI_INSIGHT_PROFILE(canvas) : "",
    { method: "put" }
  );

  const saveProfile = useCallback(
    async (payload: AiInsightProfileSavePayload) => {
      if (!canvas) throw new Error("No canvas selected");
      const result = await mutateAsync(payload);
      await queryClient.invalidateQueries({ queryKey });
      return result.profile;
    },
    [canvas, mutateAsync, queryClient, queryKey]
  );

  return {
    profile: data?.profile ?? null,
    isLoading,
    isError,
    refetch,
    saveProfile,
    isSaving,
    canvasId: canvas,
  };
}
