import { MarkerType } from "@xyflow/react";

export const WHITEBOARD_NODE_COLORS = {
  income: "#10b981",
  wallet: "#3b82f6",
  expense: "#ef4444",
} as const;

export function whiteboardEdgeColor(kind: "income" | "expense", selected = false): string {
  if (selected) return "var(--primary)";
  return kind === "income" ? WHITEBOARD_NODE_COLORS.income : WHITEBOARD_NODE_COLORS.expense;
}

export function whiteboardEdgeMarker(kind: "income" | "expense", selected = false) {
  return {
    type: MarkerType.ArrowClosed,
    width: 18,
    height: 18,
    color: whiteboardEdgeColor(kind, selected),
  };
}

export function whiteboardMinimapNodeColor(nodeType: string | undefined): string {
  if (nodeType === "income") return WHITEBOARD_NODE_COLORS.income;
  if (nodeType === "wallet") return WHITEBOARD_NODE_COLORS.wallet;
  if (nodeType === "expense") return WHITEBOARD_NODE_COLORS.expense;
  return "var(--muted-foreground)";
}
