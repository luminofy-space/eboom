"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useInternalNode,
  type EdgeProps,
} from "@xyflow/react";
import { formatMoney } from "@/src/i18n/formatters";
import type { ExpenseFlow, IncomeFlow, TransferFlow } from "@/src/types/whiteboard";
import { formatTransferAmounts } from "../utils/formatTransfer";
import {
  getInternalTransferPathFromNode,
  isInternalTransfer,
  NODE_WIDTH,
} from "../utils/edgePaths";
import { NODE_HEIGHT } from "../utils/graphBuilder";
import { whiteboardEdgeColor } from "../utils/theme";

export interface FlowEdgeData {
  kind: "income" | "expense" | "transfer";
  flow: IncomeFlow | ExpenseFlow | TransferFlow;
  internal?: boolean;
  internalStackIndex?: number;
  selected?: boolean;
}

function formatInternalTransferLabel(transfer: TransferFlow): string {
  const amounts = formatTransferAmounts(transfer);
  return transfer.transferCount > 1 ? `${transfer.transferCount} · ${amounts}` : amounts;
}

function FlowEdgeComponent({
  id,
  source,
  target,
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
  const sourceNode = useInternalNode(source);

  const flow = edgeData?.flow;
  const isInternalTransferEdge =
    source === target &&
    kind === "transfer" &&
    flow &&
    (edgeData?.internal || isInternalTransfer(flow as TransferFlow));

  const [edgePath, labelX, labelY] =
    isInternalTransferEdge && sourceNode
      ? getInternalTransferPathFromNode(
          sourceNode.internals.positionAbsolute.x,
          sourceNode.internals.positionAbsolute.y,
          sourceNode.measured.width ?? NODE_WIDTH,
          sourceNode.measured.height ?? sourceNode.height ?? NODE_HEIGHT,
          edgeData?.internalStackIndex ?? 0
        )
      : getBezierPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        });

  const label = isInternalTransferEdge
    ? formatInternalTransferLabel(flow as TransferFlow)
    : flow && kind === "income"
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
            className={
              isInternalTransferEdge
                ? "nodrag nopan max-w-[200px] truncate rounded-md border border-amber-500/25 bg-background px-2 py-0.5 text-[10px] font-medium tabular-nums shadow-sm"
                : "nodrag nopan rounded-md border bg-background px-2 py-0.5 text-[10px] font-medium shadow-sm"
            }
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const FlowEdge = memo(FlowEdgeComponent);
