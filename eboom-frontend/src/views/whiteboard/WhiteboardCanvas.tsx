"use client";

import { useCallback, useMemo } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnMove,
  type ReactFlowInstance,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./whiteboard-canvas.css";
import { FlowEdge } from "./edges/FlowEdge";
import { ExpenseNode } from "./nodes/ExpenseNode";
import { IncomeNode } from "./nodes/IncomeNode";
import { WalletNode } from "./nodes/WalletNode";
import { isValidWhiteboardConnection } from "./utils/connectionValidator";
import { whiteboardMinimapNodeColor } from "./utils/theme";

const nodeTypes = {
  wallet: WalletNode,
  income: IncomeNode,
  expense: ExpenseNode,
};

const edgeTypes = {
  flow: FlowEdge,
};

interface WhiteboardCanvasProps {
  nodes: Node[];
  edges: Edge[];
  canEdit: boolean;
  onNodesChange: (changes: NodeChange<Node>[]) => void;
  onEdgesChange: (changes: EdgeChange<Edge>[]) => void;
  onNodeDragStop: (_: unknown, node: Node) => void;
  onConnect: (connection: Connection) => void;
  onEdgeClick: (_: unknown, edge: Edge) => void;
  onNodeDoubleClick: (_: unknown, node: Node) => void;
  onPaneContextMenu: (event: MouseEvent | React.MouseEvent) => void;
  onNodeContextMenu: (event: MouseEvent | React.MouseEvent, node: Node) => void;
  onMoveEnd: OnMove;
  onInit: (instance: ReactFlowInstance) => void;
  defaultViewport?: Viewport;
}

export function WhiteboardCanvas({
  nodes,
  edges,
  canEdit,
  onNodesChange,
  onEdgesChange,
  onNodeDragStop,
  onConnect,
  onEdgeClick,
  onNodeDoubleClick,
  onPaneContextMenu,
  onNodeContextMenu,
  onMoveEnd,
  onInit,
  defaultViewport,
}: WhiteboardCanvasProps) {
  const nodesWithPermissions = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: { ...node.data, canEdit },
      })),
    [nodes, canEdit]
  );

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => isValidWhiteboardConnection(connection as Connection),
    []
  );

  return (
    <ReactFlow
      nodes={nodesWithPermissions}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeDragStop={onNodeDragStop}
      onConnect={canEdit ? onConnect : undefined}
      onEdgeClick={onEdgeClick}
      onNodeDoubleClick={onNodeDoubleClick}
      onPaneContextMenu={onPaneContextMenu}
      onNodeContextMenu={onNodeContextMenu}
      onMoveEnd={onMoveEnd}
      onInit={(instance) => onInit(instance as unknown as ReactFlowInstance)}
      defaultViewport={defaultViewport}
      fitView={!defaultViewport}
      onlyRenderVisibleElements
      nodesConnectable={canEdit}
      nodesDraggable={canEdit}
      elementsSelectable
      isValidConnection={isValidConnection}
      deleteKeyCode={canEdit ? ["Backspace", "Delete"] : null}
      proOptions={{ hideAttribution: true }}
      className="whiteboard-canvas bg-muted/20"
    >
      <Background gap={16} size={1} color="var(--border)" />
      <Controls showInteractive={canEdit} position="bottom-left" />
      <MiniMap
        pannable
        zoomable
        position="bottom-right"
        nodeStrokeWidth={2}
        nodeBorderRadius={6}
        nodeColor={(node) => whiteboardMinimapNodeColor(node.type)}
        maskColor="color-mix(in oklch, var(--background) 50%, transparent)"
        maskStrokeColor="var(--border)"
        maskStrokeWidth={1}
      />
    </ReactFlow>
  );
}
