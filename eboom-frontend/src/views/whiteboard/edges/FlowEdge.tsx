"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { formatMoney } from "@/src/i18n/formatters";
import type { ExpenseFlow, IncomeFlow, TransferFlow } from "../types";
import { whiteboardEdgeColor } from "../utils/theme";

export interface FlowEdgeData {
  kind: "income" | "expense" | "transfer";
  flow: IncomeFlow | ExpenseFlow | TransferFlow;
  selected?: boolean;
}

function FlowEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps) {
  const edgeData = data as FlowEdgeData | undefined;
  const kind = edgeData?.kind;
  const isSelected = selected || edgeData?.selected;
  const strokeColor = kind ? whiteboardEdgeColor(kind, isSelected) : "var(--foreground)";

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const flow = edgeData?.flow;
  const label =
    flow && kind === "income"
      ? `${(flow as IncomeFlow).entryCount} · ${formatMoney((flow as IncomeFlow).totalAmount, (flow as IncomeFlow).currencySymbol)}`
      : flow && kind === "expense"
        ? `${(flow as ExpenseFlow).paymentCount} · ${formatMoney((flow as ExpenseFlow).totalAmount, (flow as ExpenseFlow).currencySymbol)}`
        : flow && kind === "transfer"
          ? `${(flow as TransferFlow).transferCount} · ${formatMoney((flow as TransferFlow).totalSourceAmount, (flow as TransferFlow).sourceCurrencySymbol)}`
          : "";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={20}
        style={{
          strokeWidth: isSelected ? 2.5 : 2,
          stroke: strokeColor,
        }}
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan rounded-md border bg-background px-2 py-0.5 text-[10px] font-medium shadow-sm"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const FlowEdge = memo(FlowEdgeComponent);
