"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { Spinner } from "@/components/ui/spinner";
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import { useCanvas } from "@/src/hooks/useCanvas";
import { formatMoney } from "@/src/i18n/formatters";
import type { WalletTransfer } from "@/src/views/wallets/utils/utils";
import { Pencil, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SelectedWhiteboardEdge } from "@/src/types/whiteboard";
import { whiteboardApiDelete } from "./utils/api";
import { formatTransferAmounts } from "./utils/formatTransfer";

interface IncomeEntryRow {
  id: number;
  amount: string;
  destinationWalletId: number;
  expectedDate?: string | null;
  receivedDate?: string | null;
  notes?: string | null;
}

interface ExpensePaymentRow {
  id: number;
  amount: string;
  sourceWalletId: number;
  dueDate?: string | null;
  paidDate?: string | null;
  notes?: string | null;
}

interface WhiteboardSidePanelProps {
  selectedEdge: SelectedWhiteboardEdge | null;
  canEdit: boolean;
  onClose: () => void;
  onAddEntry?: () => void;
  onAddPayment?: () => void;
  onAddTransfer?: () => void;
  onEditEntry?: (entryId: number) => void;
  onEditPayment?: (paymentId: number) => void;
  onEditTransfer?: (transferId: number) => void;
  onMovementDeleted?: () => void;
}

export function WhiteboardSidePanel({
  selectedEdge,
  canEdit,
  onClose,
  onAddEntry,
  onAddPayment,
  onAddTransfer,
  onEditEntry,
  onEditPayment,
  onEditTransfer,
  onMovementDeleted,
}: WhiteboardSidePanelProps) {
  const { t } = useTranslation("whiteboard");
  const { canvas } = useCanvas();
  const queryClient = useQueryClient();
  const [deleteMovementId, setDeleteMovementId] = useState<number | null>(null);

  const incomeQuery = useQueryApi<{ entries?: IncomeEntryRow[] }>(
    selectedEdge?.kind === "income" && canvas
      ? API_ROUTES.INCOME_ENTRIES_LIST(canvas, selectedEdge.flow.incomeId)
      : "",
    {
      queryKey: ["income-entries", canvas, selectedEdge?.kind === "income" ? selectedEdge.flow.incomeId : null],
      hasToken: true,
      enabled: selectedEdge?.kind === "income" && !!canvas,
    }
  );

  const expenseQuery = useQueryApi<{ payments?: ExpensePaymentRow[] }>(
    selectedEdge?.kind === "expense" && canvas
      ? API_ROUTES.EXPENSE_PAYMENTS_LIST(canvas, selectedEdge.flow.expenseId)
      : "",
    {
      queryKey: ["expense-payments", canvas, selectedEdge?.kind === "expense" ? selectedEdge.flow.expenseId : null],
      hasToken: true,
      enabled: selectedEdge?.kind === "expense" && !!canvas,
    }
  );

  const transferQuery = useQueryApi<{ transfers?: WalletTransfer[] }>(
    selectedEdge?.kind === "transfer" && canvas
      ? API_ROUTES.CANVAS_TRANSFERS_LIST(canvas)
      : "",
    {
      queryKey: ["canvas-transfers", canvas],
      hasToken: true,
      enabled: selectedEdge?.kind === "transfer" && !!canvas,
    }
  );

  const deleteMovementMutation = useMutation({
    mutationFn: async (movementId: number) => {
      if (!selectedEdge || !canvas) return;
      const url =
        selectedEdge.kind === "income"
          ? API_ROUTES.INCOME_ENTRIES_DELETE(canvas, movementId)
          : selectedEdge.kind === "expense"
            ? API_ROUTES.EXPENSE_PAYMENTS_DELETE(canvas, movementId)
            : API_ROUTES.TRANSFERS_DELETE(canvas, movementId);
      await whiteboardApiDelete(url);
    },
    onSuccess: async () => {
      setDeleteMovementId(null);
      if (selectedEdge?.kind === "income") {
        await queryClient.invalidateQueries({
          queryKey: ["income-entries", canvas, selectedEdge.flow.incomeId],
        });
      } else if (selectedEdge?.kind === "expense") {
        await queryClient.invalidateQueries({
          queryKey: ["expense-payments", canvas, selectedEdge.flow.expenseId],
        });
      } else if (selectedEdge?.kind === "transfer" && canvas) {
        await queryClient.invalidateQueries({ queryKey: ["canvas-transfers", canvas] });
      }
      if (canvas) {
        await queryClient.invalidateQueries({ queryKey: ["whiteboard", canvas] });
      }
      onMovementDeleted?.();
    },
  });

  if (!selectedEdge) return null;

  const isIncome = selectedEdge.kind === "income";
  const isExpense = selectedEdge.kind === "expense";
  const isTransfer = selectedEdge.kind === "transfer";
  const flow = selectedEdge.flow;

  const isLoading = isIncome
    ? incomeQuery.isLoading
    : isExpense
      ? expenseQuery.isLoading
      : transferQuery.isLoading;

  const rows = isIncome
    ? (incomeQuery.data?.entries ?? []).filter(
        (entry) => selectedEdge.kind === "income" && entry.destinationWalletId === selectedEdge.flow.walletId
      )
    : isExpense
      ? (expenseQuery.data?.payments ?? []).filter(
          (payment) => selectedEdge.kind === "expense" && payment.sourceWalletId === selectedEdge.flow.walletId
        )
      : (transferQuery.data?.transfers ?? []).filter(
          (transfer) =>
            selectedEdge.kind === "transfer" &&
            transfer.sourceWalletId === selectedEdge.flow.sourceWalletId &&
            transfer.destinationWalletId === selectedEdge.flow.destinationWalletId &&
            transfer.sourceCurrencyId === selectedEdge.flow.sourceCurrencyId
        );

  const panelTitle = isIncome
    ? t("sidePanel.incomeFlow")
    : isExpense
      ? t("sidePanel.expenseFlow")
      : t("sidePanel.transferFlow");

  const summaryText = isIncome
    ? t("sidePanel.incomeSummary", {
        count: selectedEdge.flow.entryCount,
        amount: formatMoney(selectedEdge.flow.totalAmount, selectedEdge.flow.currencySymbol),
      })
    : isExpense
      ? t("sidePanel.expenseSummary", {
          count: selectedEdge.flow.paymentCount,
          amount: formatMoney(selectedEdge.flow.totalAmount, selectedEdge.flow.currencySymbol),
        })
      : t("sidePanel.transferSummary", {
          count: selectedEdge.flow.transferCount,
          amount: formatTransferAmounts(selectedEdge.flow),
        });

  return (
    <>
      <div className="absolute right-0 top-0 z-20 flex h-full w-[320px] flex-col border-l bg-background shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <Typography variant="heading" className="text-sm font-semibold">
            {panelTitle}
          </Typography>
          <Button size="icon-xs" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="border-b px-4 py-3">
          <p className="text-xs text-muted-foreground">{summaryText}</p>
          {isIncome && onAddEntry && canEdit ? (
            <Button size="sm" className="mt-3 w-full" onClick={onAddEntry}>
              {t("sidePanel.addEntry")}
            </Button>
          ) : null}
          {isExpense && onAddPayment && canEdit ? (
            <Button size="sm" className="mt-3 w-full" onClick={onAddPayment}>
              {t("sidePanel.addPayment")}
            </Button>
          ) : null}
          {isTransfer && onAddTransfer && canEdit ? (
            <Button size="sm" className="mt-3 w-full" onClick={onAddTransfer}>
              {t("sidePanel.addTransfer")}
            </Button>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("sidePanel.empty")}</p>
          ) : (
            <Stack gap={2}>
              {rows.map((row) => (
                <div key={row.id} className="rounded-md border p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {isTransfer
                          ? formatTransferAmounts(row as WalletTransfer)
                          : formatMoney(
                              (row as IncomeEntryRow | ExpensePaymentRow).amount,
                              isIncome
                                ? (flow as { currencySymbol: string }).currencySymbol
                                : (flow as { currencySymbol: string }).currencySymbol
                            )}
                      </p>
                      {"transferDate" in row && row.transferDate ? (
                        <p className="text-xs text-muted-foreground">{row.transferDate.slice(0, 10)}</p>
                      ) : null}
                      {"receivedDate" in row && row.receivedDate ? (
                        <p className="text-xs text-muted-foreground">{row.receivedDate}</p>
                      ) : null}
                      {"paidDate" in row && row.paidDate ? (
                        <p className="text-xs text-muted-foreground">{row.paidDate}</p>
                      ) : null}
                      {row.notes ? (
                        <p className="mt-1 text-xs text-muted-foreground">{row.notes}</p>
                      ) : null}
                    </div>
                    {canEdit ? (
                      <div className="flex shrink-0 gap-1">
                        {isIncome && onEditEntry ? (
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => onEditEntry(row.id)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                        {isExpense && onEditPayment ? (
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => onEditPayment(row.id)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                        {isTransfer && onEditTransfer ? (
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => onEditTransfer(row.id)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteMovementId(row.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </Stack>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog
        open={deleteMovementId != null}
        onOpenChange={(open) => !open && setDeleteMovementId(null)}
        onConfirm={() => deleteMovementId != null && deleteMovementMutation.mutate(deleteMovementId)}
        isDeleting={deleteMovementMutation.isPending}
      />
    </>
  );
}
