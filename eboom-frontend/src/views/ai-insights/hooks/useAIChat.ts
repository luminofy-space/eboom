"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useMutationApi } from "@/src/api/useMutation";
import { useCanvas } from "@/src/hooks/useCanvas";
import type { AiChatMessagesResponse, AiChatSendResponse } from "../types";

export function useAIChat() {
  const { canvas } = useCanvas();
  const queryClient = useQueryClient();
  const queryKey = ["ai-chat", canvas];

  const { data, isLoading, isError, refetch } = useQueryApi<AiChatMessagesResponse>(
    canvas ? API_ROUTES.CANVAS_AI_CHAT(canvas) : "",
    {
      queryKey,
      enabled: !!canvas,
    }
  );

  const { mutateAsync: sendMessageMutation, isPending: isSending } =
    useMutationApi<AiChatSendResponse>(
      canvas ? API_ROUTES.CANVAS_AI_CHAT_MESSAGES(canvas) : "",
      { method: "post" }
    );

  const { mutateAsync: clearHistoryMutation, isPending: isClearing } =
    useMutationApi<AiChatMessagesResponse>(
      canvas ? API_ROUTES.CANVAS_AI_CHAT(canvas) : "",
      { method: "delete" }
    );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!canvas) throw new Error("No canvas selected");
      const result = await sendMessageMutation({ content });
      await queryClient.invalidateQueries({ queryKey });
      return result;
    },
    [canvas, sendMessageMutation, queryClient, queryKey]
  );

  const clearHistory = useCallback(async () => {
    if (!canvas) throw new Error("No canvas selected");
    await clearHistoryMutation({});
    await queryClient.invalidateQueries({ queryKey });
  }, [canvas, clearHistoryMutation, queryClient, queryKey]);

  return {
    messages: data?.messages ?? [],
    isLoading,
    isError,
    refetch,
    sendMessage,
    isSending,
    clearHistory,
    isClearing,
    canvasId: canvas,
  };
}
