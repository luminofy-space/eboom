"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type ReactFlowInstance,
  type Viewport,
} from "@xyflow/react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import API_ROUTES from "@/src/api/urls";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import { Container } from "@/components/ui/container";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { useAppDispatch } from "@/src/redux/store";
import { openExpenseCreateModal, openExpenseEditModal, type ExpenseItem } from "@/src/redux/expenseSlice";
import { openIncomeCreateModal, openIncomeEditModal, type IncomeItem } from "@/src/redux/incomeSlice";
import { openWalletCreateModal, openWalletEditModal, type WalletItem } from "@/src/redux/walletSlice";
import { NewExpenseModal } from "@/src/views/expenses/components/NewExpenseModal";
import { NewExpensePaymentModal } from "@/src/views/expenses/components/NewExpensePaymentModal";
import { NewIncomeModal } from "@/src/views/incomes/component/NewIncomeModal";
import { NewIncomeEntryModal } from "@/src/views/incomes/component/NewIncomeEntryModal";
import { NewWalletModal } from "@/src/views/wallets/components/NewWalletModal";
import { NewTransferModal } from "@/src/views/wallets/components/NewTransferModal";
import { useTranslation } from "react-i18next";
import { WhiteboardCanvas } from "./WhiteboardCanvas";
import { WhiteboardContextMenu } from "./WhiteboardContextMenu";
import { WhiteboardSidePanel } from "./WhiteboardSidePanel";
import { WhiteboardToolbar } from "./WhiteboardToolbar";
import type { FlowEdgeData } from "./edges/FlowEdge";
import { useWhiteboard } from "./hooks/useWhiteboard";
import { useWhiteboardLayout } from "./hooks/useWhiteboardLayout";
import type {
  ExpenseFlow,
  IncomeFlow,
  TransferFlow,
  SelectedWhiteboardEdge,
  WhiteboardContextMenuState,
  WhiteboardCreatedEntity,
  WhiteboardSpawnPosition,
} from "@/src/types/whiteboard";
import { layoutWhiteboardGraph } from "./utils/autoLayout";
import { getConnectionIntent } from "./utils/connectionValidator";
import {
  buildWhiteboardGraph,
  parseEntityNodeId,
  toNodePosition,
} from "./utils/graphBuilder";
import { whiteboardApiDelete } from "./utils/api";

export default function WhiteboardPage() {
  const { t } = useTranslation("whiteboard");
  const { canvas } = useCanvas();
  const { canEdit } = useCanvasPermissions();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useWhiteboard();
  const {
    saveViewportDebounced,
    saveNodesDebounced,
    saveNodeImmediate,
    invalidateWhiteboard,
  } = useWhiteboardLayout();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedEdge, setSelectedEdge] = useState<SelectedWhiteboardEdge | null>(null);
  const [contextMenu, setContextMenu] = useState<WhiteboardContextMenuState | null>(null);
  const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null);
  const [entryModal, setEntryModal] = useState<{
    open: boolean;
    incomeId?: number;
    walletId?: number;
    entryId?: number;
  }>({
    open: false,
  });
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    expenseId?: number;
    walletId?: number;
    paymentId?: number;
  }>({
    open: false,
  });
  const [transferModal, setTransferModal] = useState<{
    open: boolean;
    sourceWalletId?: number;
    destinationWalletId?: number;
    transferId?: number;
  }>({
    open: false,
  });

  const flowRef = useRef<ReactFlowInstance | null>(null);
  const spawnPositionRef = useRef<WhiteboardSpawnPosition | null>(null);
  const viewportInitializedRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedEdge(null);
        setContextMenu(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!data) return;

    const graph = buildWhiteboardGraph(data);
    setNodes(graph.nodes);
    setEdges(graph.edges);

    if (!viewportInitializedRef.current && flowRef.current && data.viewport) {
      flowRef.current.setViewport({
        x: data.viewport.x,
        y: data.viewport.y,
        zoom: data.viewport.zoom,
      });
      viewportInitializedRef.current = true;
    }
  }, [data]);

  useEffect(() => {
    if (!data || !selectedEdge) return;

    const flowStillExists =
      selectedEdge.kind === "income"
        ? data.incomeFlows.some(
            (flow) =>
              flow.incomeId === selectedEdge.flow.incomeId &&
              flow.walletId === selectedEdge.flow.walletId
          )
        : selectedEdge.kind === "expense"
          ? data.expenseFlows.some(
              (flow) =>
                flow.expenseId === selectedEdge.flow.expenseId &&
                flow.walletId === selectedEdge.flow.walletId
            )
          : (data.transferFlows ?? []).some(
              (flow) =>
                flow.sourceWalletId === selectedEdge.flow.sourceWalletId &&
                flow.destinationWalletId === selectedEdge.flow.destinationWalletId &&
                flow.sourceCurrencyId === selectedEdge.flow.sourceCurrencyId
            );

    if (!flowStillExists) {
      setSelectedEdge(null);
    }
  }, [data, selectedEdge]);

  const viewport = data?.viewport;
  const defaultViewport = useMemo<Viewport | undefined>(() => {
    if (!viewport) return undefined;
    return {
      x: viewport.x,
      y: viewport.y,
      zoom: viewport.zoom,
    };
  }, [viewport]);

  const storeSpawnAtCenter = useCallback(() => {
    const instance = flowRef.current;
    const pane = document.querySelector(".react-flow")?.getBoundingClientRect();
    if (!instance || !pane) {
      spawnPositionRef.current = { x: 120, y: 120 };
      return;
    }
    spawnPositionRef.current = instance.screenToFlowPosition({
      x: pane.left + pane.width / 2,
      y: pane.top + pane.height / 2,
    });
  }, []);

  const storeSpawnAtScreen = useCallback((x: number, y: number) => {
    const instance = flowRef.current;
    if (!instance) {
      spawnPositionRef.current = { x, y };
      return;
    }
    spawnPositionRef.current = instance.screenToFlowPosition({ x, y });
  }, []);

  const handleEntityCreated = useCallback(
    (entity: WhiteboardCreatedEntity) => {
      const spawn = spawnPositionRef.current;
      if (spawn) {
        saveNodeImmediate({
          entityType: entity.type,
          entityId: entity.id,
          x: spawn.x,
          y: spawn.y,
        });
      }
      spawnPositionRef.current = null;
      invalidateWhiteboard();
      refetch();
    },
    [saveNodeImmediate, invalidateWhiteboard, refetch]
  );

  const handleAddWallet = useCallback(() => {
    storeSpawnAtCenter();
    dispatch(openWalletCreateModal());
  }, [dispatch, storeSpawnAtCenter]);

  const handleAddIncome = useCallback(() => {
    storeSpawnAtCenter();
    dispatch(openIncomeCreateModal());
  }, [dispatch, storeSpawnAtCenter]);

  const handleAddExpense = useCallback(() => {
    storeSpawnAtCenter();
    dispatch(openExpenseCreateModal());
  }, [dispatch, storeSpawnAtCenter]);

  const handleAddEntry = useCallback(() => {
    setEntryModal({ open: true });
  }, []);

  const handleAddPayment = useCallback(() => {
    setPaymentModal({ open: true });
  }, []);

  const handleAddTransfer = useCallback(() => {
    setTransferModal({ open: true });
  }, []);

  const handleEditNode = useCallback(
    (nodeId: string) => {
      const parsed = parseEntityNodeId(nodeId);
      if (!parsed || !data) return;

      if (parsed.type === "wallet") {
        const wallet = data.wallets.find((w: WalletItem) => w.id === parsed.id);
        if (wallet) dispatch(openWalletEditModal(wallet));
      } else if (parsed.type === "income") {
        const income = data.incomes.find((i: IncomeItem) => i.id === parsed.id);
        if (income) dispatch(openIncomeEditModal(income));
      } else {
        const expense = data.expenses.find((e: ExpenseItem) => e.id === parsed.id);
        if (expense) dispatch(openExpenseEditModal(expense));
      }
    },
    [data, dispatch]
  );

  const handleOpenDetail = useCallback(
    (nodeId: string) => {
      const parsed = parseEntityNodeId(nodeId);
      if (!parsed) return;
      if (parsed.type === "wallet") router.push(`/wallets/${parsed.id}`);
      else if (parsed.type === "income") router.push(`/incomes/${parsed.id}`);
      else router.push(`/expenses/${parsed.id}`);
    },
    [router]
  );

  const deleteEntityMutation = useMutation({
    mutationFn: async (nodeId: string) => {
      const parsed = parseEntityNodeId(nodeId);
      if (!parsed || !canvas) return;

      const url =
        parsed.type === "wallet"
          ? API_ROUTES.WALLETS_DELETE(canvas, parsed.id)
          : parsed.type === "income"
            ? API_ROUTES.INCOMES_DELETE(canvas, parsed.id)
            : API_ROUTES.EXPENSES_DELETE(canvas, parsed.id);

      await whiteboardApiDelete(url);
    },
    onSuccess: () => {
      setDeleteNodeId(null);
      invalidateWhiteboard();
      queryClient.invalidateQueries();
    },
  });

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
  }, []);

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      const position = toNodePosition(node);
      if (position && canEdit) saveNodesDebounced([position]);
    },
    [canEdit, saveNodesDebounced]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const intent = getConnectionIntent(connection);
      if (!intent) return;

      if (intent.kind === "income-entry") {
        setEntryModal({ open: true, incomeId: intent.incomeId, walletId: intent.walletId });
      } else if (intent.kind === "expense-payment") {
        setPaymentModal({ open: true, expenseId: intent.expenseId, walletId: intent.walletId });
      } else {
        setTransferModal({
          open: true,
          sourceWalletId: intent.sourceWalletId,
          destinationWalletId: intent.destinationWalletId,
        });
      }
    },
    []
  );

  const onEdgeClick = useCallback((_: unknown, edge: Edge) => {
    const edgeData = edge.data as FlowEdgeData | undefined;
    if (!edgeData?.kind || !edgeData.flow) return;
    if (edgeData.kind === "income") {
      setSelectedEdge({ kind: "income", flow: edgeData.flow as IncomeFlow });
    } else if (edgeData.kind === "expense") {
      setSelectedEdge({ kind: "expense", flow: edgeData.flow as ExpenseFlow });
    } else {
      setSelectedEdge({ kind: "transfer", flow: edgeData.flow as TransferFlow });
    }
  }, []);

  const onNodeDoubleClick = useCallback(
    (_: unknown, node: Node) => {
      handleEditNode(node.id);
    },
    [handleEditNode]
  );

  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      if (!canEdit) return;
      storeSpawnAtScreen(event.clientX, event.clientY);
      setContextMenu({ x: event.clientX, y: event.clientY, kind: "pane" });
    },
    [canEdit, storeSpawnAtScreen]
  );

  const onNodeContextMenu = useCallback((event: MouseEvent | React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, kind: "node", nodeId: node.id });
  }, []);

  const onMoveEnd = useCallback(
    (_: unknown, viewport: Viewport) => {
      if (canEdit) {
        saveViewportDebounced({ x: viewport.x, y: viewport.y, zoom: viewport.zoom });
      }
    },
    [canEdit, saveViewportDebounced]
  );

  const onAutoLayout = useCallback(() => {
    setNodes((currentNodes) => {
      const layouted = layoutWhiteboardGraph(currentNodes, edges);
      if (canEdit) {
        const positions = layouted
          .map(toNodePosition)
          .filter((p): p is NonNullable<typeof p> => p != null);
        saveNodesDebounced(positions);
      }
      return layouted;
    });
  }, [edges, canEdit, saveNodesDebounced]);

  const onFitView = useCallback(() => {
    flowRef.current?.fitView({ padding: 0.2, duration: 250 });
  }, []);

  const isEmpty =
    !isLoading &&
    data &&
    data.wallets.length === 0 &&
    data.incomes.length === 0 &&
    data.expenses.length === 0;

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full">
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <WhiteboardToolbar
            canEdit={canEdit}
            onAddWallet={handleAddWallet}
            onAddIncome={handleAddIncome}
            onAddExpense={handleAddExpense}
              onAddEntry={handleAddEntry}
              onAddPayment={handleAddPayment}
              onAddTransfer={handleAddTransfer}
            onAutoLayout={onAutoLayout}
            onFitView={onFitView}
          />

          {isEmpty ? (
            <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
              <div className="rounded-lg border bg-background/90 px-6 py-4 text-center shadow-sm">
                <Typography variant="heading" className="text-base font-semibold">
                  {t("empty.title")}
                </Typography>
                <Typography variant="muted" className="mt-2 max-w-md text-sm">
                  {t("empty.description")}
                </Typography>
              </div>
            </div>
          ) : null}

          <WhiteboardCanvas
            nodes={nodes}
            edges={edges}
            canEdit={canEdit}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={onNodeDragStop}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onPaneContextMenu={onPaneContextMenu}
            onNodeContextMenu={onNodeContextMenu}
            onMoveEnd={onMoveEnd}
            onInit={(instance) => {
              flowRef.current = instance;
            }}
            defaultViewport={defaultViewport}
          />

          <WhiteboardSidePanel
            selectedEdge={selectedEdge}
            canEdit={canEdit}
            onClose={() => setSelectedEdge(null)}
            onMovementDeleted={() => refetch()}
            onAddEntry={
              selectedEdge?.kind === "income"
                ? () =>
                    setEntryModal({
                      open: true,
                      incomeId: selectedEdge.flow.incomeId,
                      walletId: selectedEdge.flow.walletId,
                      entryId: undefined,
                    })
                : undefined
            }
            onAddPayment={
              selectedEdge?.kind === "expense"
                ? () =>
                    setPaymentModal({
                      open: true,
                      expenseId: selectedEdge.flow.expenseId,
                      walletId: selectedEdge.flow.walletId,
                      paymentId: undefined,
                    })
                : undefined
            }
            onEditEntry={
              selectedEdge?.kind === "income"
                ? (entryId) =>
                    setEntryModal({
                      open: true,
                      incomeId: selectedEdge.flow.incomeId,
                      walletId: selectedEdge.flow.walletId,
                      entryId,
                    })
                : undefined
            }
            onEditPayment={
              selectedEdge?.kind === "expense"
                ? (paymentId) =>
                    setPaymentModal({
                      open: true,
                      expenseId: selectedEdge.flow.expenseId,
                      walletId: selectedEdge.flow.walletId,
                      paymentId,
                    })
                : undefined
            }
            onAddTransfer={
              selectedEdge?.kind === "transfer"
                ? () =>
                    setTransferModal({
                      open: true,
                      sourceWalletId: selectedEdge.flow.sourceWalletId,
                      destinationWalletId: selectedEdge.flow.destinationWalletId,
                    })
                : undefined
            }
            onEditTransfer={
              selectedEdge?.kind === "transfer"
                ? (transferId) =>
                    setTransferModal({
                      open: true,
                      sourceWalletId: selectedEdge.flow.sourceWalletId,
                      destinationWalletId: selectedEdge.flow.destinationWalletId,
                      transferId,
                    })
                : undefined
            }
          />

          <WhiteboardContextMenu
            menu={contextMenu}
            canEdit={canEdit}
            onClose={() => setContextMenu(null)}
            onAddWallet={handleAddWallet}
            onAddIncome={handleAddIncome}
            onAddExpense={handleAddExpense}
              onAddEntry={handleAddEntry}
              onAddPayment={handleAddPayment}
              onAddTransfer={handleAddTransfer}
            onEditNode={handleEditNode}
            onDeleteNode={setDeleteNodeId}
            onOpenDetail={handleOpenDetail}
          />
        </>
      )}

      <NewWalletModal
        onCreateSuccess={(entity) => handleEntityCreated({ ...entity, type: "wallet" })}
      />
      <NewIncomeModal
        onCreateSuccess={(entity) => handleEntityCreated({ ...entity, type: "income" })}
      />
      <NewExpenseModal
        onCreateSuccess={(entity) => handleEntityCreated({ ...entity, type: "expense" })}
      />

      <NewIncomeEntryModal
        open={entryModal.open}
        onOpenChange={(open) =>
          setEntryModal((prev) => ({
            ...prev,
            open,
            ...(open ? {} : { entryId: undefined }),
          }))
        }
        incomeId={entryModal.incomeId}
        entryId={entryModal.entryId}
        fixedDestinationWalletId={entryModal.walletId}
        extraInvalidateKeys={[["whiteboard", canvas]]}
      />
      <NewExpensePaymentModal
        open={paymentModal.open}
        onOpenChange={(open) =>
          setPaymentModal((prev) => ({
            ...prev,
            open,
            ...(open ? {} : { paymentId: undefined }),
          }))
        }
        expenseId={paymentModal.expenseId}
        paymentId={paymentModal.paymentId}
        fixedSourceWalletId={paymentModal.walletId}
        extraInvalidateKeys={[["whiteboard", canvas]]}
      />
      <NewTransferModal
        open={transferModal.open}
        onOpenChange={(open) =>
          setTransferModal((prev) => ({
            ...prev,
            open,
            ...(open ? {} : { transferId: undefined }),
          }))
        }
        transferId={transferModal.transferId}
        fixedSourceWalletId={transferModal.sourceWalletId}
        fixedDestinationWalletId={transferModal.destinationWalletId}
        extraInvalidateKeys={[["whiteboard", canvas]]}
      />

      <ConfirmDeleteDialog
        open={deleteNodeId != null}
        onOpenChange={(open) => !open && setDeleteNodeId(null)}
        onConfirm={() => deleteNodeId && deleteEntityMutation.mutate(deleteNodeId)}
        isDeleting={deleteEntityMutation.isPending}
      />
    </div>
  );
}
