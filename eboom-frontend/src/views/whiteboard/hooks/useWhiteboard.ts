import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useCanvas } from "@/src/hooks/useCanvas";
import type { WhiteboardData } from "@/src/types/whiteboard";

export function useWhiteboard() {
  const { canvas } = useCanvas();

  return useQueryApi<WhiteboardData>(
    canvas ? API_ROUTES.CANVAS_WHITEBOARD(canvas) : "",
    {
      queryKey: ["whiteboard", canvas],
      hasToken: true,
      enabled: !!canvas,
      staleTime: 30_000,
    }
  );
}
