import type { Edge, Node } from "@xyflow/react";
import type {
  ExpenseFlow,
  IncomeFlow,
  WhiteboardData,
  WhiteboardEntityType,
  WhiteboardNodePosition,
} from "../types";
import { whiteboardEdgeMarker } from "./theme";

export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 96;

export function entityNodeId(type: WhiteboardEntityType, id: number): string {
  return `${type}-${id}`;
}

export function parseEntityNodeId(nodeId: string): { type: WhiteboardEntityType; id: number } | null {
  const match = nodeId.match(/^(wallet|income|expense)-(\d+)$/);
  if (!match) return null;
  return {
    type: match[1] as WhiteboardEntityType,
    id: parseInt(match[2], 10),
  };
}

export function incomeFlowEdgeId(flow: Pick<IncomeFlow, "incomeId" | "walletId">): string {
  return `income:${flow.incomeId}:wallet:${flow.walletId}`;
}

export function expenseFlowEdgeId(flow: Pick<ExpenseFlow, "expenseId" | "walletId">): string {
  return `expense:${flow.expenseId}:wallet:${flow.walletId}`;
}

function positionMap(positions: WhiteboardNodePosition[]) {
  return new Map(
    positions.map((p) => [`${p.entityType}-${p.entityId}`, { x: p.x, y: p.y }])
  );
}

export function buildWhiteboardGraph(data: WhiteboardData): { nodes: Node[]; edges: Edge[] } {
  const positions = positionMap(data.nodePositions);
  const nodes: Node[] = [];

  for (const wallet of data.wallets) {
    const id = entityNodeId("wallet", wallet.id);
    nodes.push({
      id,
      type: "wallet",
      position: positions.get(id) ?? { x: 0, y: 0 },
      data: {
        entityId: wallet.id,
        name: wallet.name,
        categoryName: wallet.category?.name ?? "",
        subWallets: wallet.subWallets ?? [],
      },
    });
  }

  for (const income of data.incomes) {
    const id = entityNodeId("income", income.id);
    nodes.push({
      id,
      type: "income",
      position: positions.get(id) ?? { x: 0, y: 0 },
      data: {
        entityId: income.id,
        name: income.name,
        categoryName: income.category?.name ?? "",
        amount: income.amount,
        currencySymbol: income.currency?.symbol ?? "",
      },
    });
  }

  for (const expense of data.expenses) {
    const id = entityNodeId("expense", expense.id);
    nodes.push({
      id,
      type: "expense",
      position: positions.get(id) ?? { x: 0, y: 0 },
      data: {
        entityId: expense.id,
        name: expense.name,
        categoryName: expense.category?.name ?? "",
        currencySymbol: expense.currency?.symbol ?? "",
      },
    });
  }

  const edges: Edge[] = [
    ...data.incomeFlows.map((flow) => ({
      id: incomeFlowEdgeId(flow),
      source: entityNodeId("income", flow.incomeId),
      target: entityNodeId("wallet", flow.walletId),
      type: "flow",
      markerEnd: whiteboardEdgeMarker("income"),
      data: {
        kind: "income" as const,
        flow,
      },
    })),
    ...data.expenseFlows.map((flow) => ({
      id: expenseFlowEdgeId(flow),
      source: entityNodeId("wallet", flow.walletId),
      target: entityNodeId("expense", flow.expenseId),
      type: "flow",
      markerEnd: whiteboardEdgeMarker("expense"),
      data: {
        kind: "expense" as const,
        flow,
      },
    })),
  ];

  return { nodes, edges };
}

export function nodesMissingPositions(nodes: Node[]): boolean {
  return nodes.some((node) => node.position.x === 0 && node.position.y === 0);
}

export function toNodePosition(node: Node): WhiteboardNodePosition | null {
  const parsed = parseEntityNodeId(node.id);
  if (!parsed) return null;
  return {
    entityType: parsed.type,
    entityId: parsed.id,
    x: node.position.x,
    y: node.position.y,
  };
}
