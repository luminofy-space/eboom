"use client";

import { useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import API_ROUTES from "@/src/api/urls";
import { useCanvas } from "@/src/hooks/useCanvas";
import type { WhiteboardEntityType, WhiteboardNodePosition, WhiteboardViewport } from "@/src/types/whiteboard";
import { whiteboardApiDelete, whiteboardApiPut } from "../utils/api";

export function useWhiteboardLayout() {
  const { canvas } = useCanvas();
  const queryClient = useQueryClient();
  const viewportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const invalidateWhiteboard = useCallback(() => {
    if (!canvas) return;
    queryClient.invalidateQueries({ queryKey: ["whiteboard", canvas] });
  }, [canvas, queryClient]);

  const saveViewportMutation = useMutation({
    mutationFn: async (viewport: WhiteboardViewport) => {
      if (!canvas) return;
      await whiteboardApiPut(API_ROUTES.CANVAS_WHITEBOARD_VIEWPORT(canvas), viewport);
    },
  });

  const saveNodesMutation = useMutation({
    mutationFn: async (nodes: WhiteboardNodePosition[]) => {
      if (!canvas) return;
      await whiteboardApiPut(API_ROUTES.CANVAS_WHITEBOARD_NODES(canvas), { nodes });
    },
    onSuccess: () => {
      invalidateWhiteboard();
    },
  });

  const deleteNodePositionMutation = useMutation({
    mutationFn: async ({
      entityType,
      entityId,
    }: {
      entityType: WhiteboardEntityType;
      entityId: number;
    }) => {
      if (!canvas) return;
      await whiteboardApiDelete(
        API_ROUTES.CANVAS_WHITEBOARD_NODE(canvas, entityType, entityId)
      );
    },
    onSuccess: () => {
      invalidateWhiteboard();
    },
  });

  const saveViewportDebounced = useCallback(
    (viewport: WhiteboardViewport) => {
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
      viewportTimerRef.current = setTimeout(() => {
        saveViewportMutation.mutate(viewport);
      }, 500);
    },
    [saveViewportMutation]
  );

  const saveNodesDebounced = useCallback(
    (nodes: WhiteboardNodePosition[]) => {
      if (nodesTimerRef.current) clearTimeout(nodesTimerRef.current);
      nodesTimerRef.current = setTimeout(() => {
        saveNodesMutation.mutate(nodes);
      }, 400);
    },
    [saveNodesMutation]
  );

  const saveNodeImmediate = useCallback(
    (node: WhiteboardNodePosition) => {
      saveNodesMutation.mutate([node]);
    },
    [saveNodesMutation]
  );

  return {
    saveViewportDebounced,
    saveNodesDebounced,
    saveNodeImmediate,
    deleteNodePosition: deleteNodePositionMutation.mutate,
    invalidateWhiteboard,
  };
}
