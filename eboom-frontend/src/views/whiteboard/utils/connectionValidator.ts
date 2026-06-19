import type { Connection, Edge, Node } from "@xyflow/react";
import { parseEntityNodeId } from "./graphBuilder";

export function isValidWhiteboardConnection(connection: Connection): boolean {
  if (!connection.source || !connection.target) return false;

  const source = parseEntityNodeId(connection.source);
  const target = parseEntityNodeId(connection.target);
  if (!source || !target) return false;

  return (
    (source.type === "income" && target.type === "wallet") ||
    (source.type === "wallet" && target.type === "expense")
  );
}

export function getConnectionIntent(connection: Connection):
  | { kind: "income-entry"; incomeId: number; walletId: number }
  | { kind: "expense-payment"; expenseId: number; walletId: number }
  | null {
  if (!isValidWhiteboardConnection(connection)) return null;

  const source = parseEntityNodeId(connection.source!);
  const target = parseEntityNodeId(connection.target!);
  if (!source || !target) return null;

  if (source.type === "income" && target.type === "wallet") {
    return { kind: "income-entry", incomeId: source.id, walletId: target.id };
  }

  if (source.type === "wallet" && target.type === "expense") {
    return { kind: "expense-payment", expenseId: target.id, walletId: source.id };
  }

  return null;
}

export function findNodeByEntity(nodes: Node[], type: string, id: number): Node | undefined {
  return nodes.find((node) => node.id === `${type}-${id}`);
}

export function getEdgeEndpoints(edge: Edge): { source: string; target: string } {
  return { source: edge.source, target: edge.target };
}
