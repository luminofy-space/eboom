import type { TransferFlow } from "@/src/types/whiteboard";

export const NODE_WIDTH = 220;

export const INTERNAL_TRANSFER_ARC_CLEARANCE = 34;
export const INTERNAL_TRANSFER_ARC_STACK_STEP = 28;
export const INTERNAL_TRANSFER_CORNER_RADIUS = 10;

export function isInternalTransfer(
  flow: Pick<TransferFlow, "sourceWalletId" | "destinationWalletId">
): boolean {
  return Number(flow.sourceWalletId) === Number(flow.destinationWalletId);
}

function getTopOffset(stackIndex = 0): number {
  return INTERNAL_TRANSFER_ARC_CLEARANCE + stackIndex * INTERNAL_TRANSFER_ARC_STACK_STEP;
}

function buildSquaredTransferPath(
  leftX: number,
  rightX: number,
  midY: number,
  topY: number
): [path: string, labelX: number, labelY: number] {
  const verticalLeg = Math.abs(midY - topY);
  const horizontalLeg = rightX - leftX;
  const radius = Math.min(
    INTERNAL_TRANSFER_CORNER_RADIUS,
    verticalLeg / 2,
    horizontalLeg / 2
  );

  const path =
    radius > 0
      ? [
          `M ${leftX},${midY}`,
          `L ${leftX},${topY + radius}`,
          `Q ${leftX},${topY} ${leftX + radius},${topY}`,
          `L ${rightX - radius},${topY}`,
          `Q ${rightX},${topY} ${rightX},${topY + radius}`,
          `L ${rightX},${midY}`,
        ].join(" ")
      : `M ${leftX},${midY} L ${leftX},${topY} L ${rightX},${topY} L ${rightX},${midY}`;

  const labelX = (leftX + rightX) / 2;
  const labelY = topY - 8;
  return [path, labelX, labelY];
}

export function getInternalTransferPathFromNode(
  x: number,
  y: number,
  width: number,
  height: number,
  stackIndex = 0
): [path: string, labelX: number, labelY: number] {
  const midY = y + height / 2;
  const topY = y - getTopOffset(stackIndex);
  return buildSquaredTransferPath(x, x + width, midY, topY);
}

export function groupInternalTransfersByWallet(
  transferFlows: TransferFlow[] | undefined
): Map<number, TransferFlow[]> {
  const grouped = new Map<number, TransferFlow[]>();

  for (const flow of transferFlows ?? []) {
    if (!isInternalTransfer(flow)) continue;
    const walletId = Number(flow.sourceWalletId);
    const existing = grouped.get(walletId) ?? [];
    existing.push(flow);
    grouped.set(walletId, existing);
  }

  for (const flows of grouped.values()) {
    flows.sort((a, b) => a.sourceCurrencyId - b.sourceCurrencyId);
  }

  return grouped;
}

export function getInternalTransferStackIndex(
  flows: TransferFlow[],
  flow: TransferFlow
): number {
  return flows.findIndex(
    (candidate) => candidate.sourceCurrencyId === flow.sourceCurrencyId
  );
}
