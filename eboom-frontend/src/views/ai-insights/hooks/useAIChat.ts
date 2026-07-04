"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useMutationApi } from "@/src/api/useMutation";
import { useCanvas } from "@/src/hooks/useCanvas";
import type { AiChatMessage, AiChatMessagesResponse, AiChatSendResponse } from "../types";

function createOptimisticUserMessage(content: string): AiChatMessage {
  return {
    id: -Date.now(),
    role: "user",
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
}

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

      const trimmed = content.trim();
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<AiChatMessagesResponse>(queryKey);
      const optimisticMessage = createOptimisticUserMessage(trimmed);

      queryClient.setQueryData<AiChatMessagesResponse>(queryKey, {
        messages: [...(previous?.messages ?? []), optimisticMessage],
      });

      try {
        const result = await sendMessageMutation({ content: trimmed });
        queryClient.setQueryData<AiChatMessagesResponse>(queryKey, {
          messages: [
            ...(previous?.messages ?? []),
            result.userMessage,
            result.assistantMessage,
          ],
        });
        return result;
      } catch (error) {
        queryClient.setQueryData(queryKey, previous);
        throw error;
      }
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
