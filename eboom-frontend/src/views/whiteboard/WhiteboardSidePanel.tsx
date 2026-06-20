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
import { Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SelectedWhiteboardEdge } from "./types";
import { whiteboardApiDelete } from "./utils/api";

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
  onMovementDeleted?: () => void;
}

export function WhiteboardSidePanel({
  selectedEdge,
  canEdit,
  onClose,
  onAddEntry,
  onAddPayment,
  onMovementDeleted,
}: WhiteboardSidePanelProps) {
  const { t } = useTranslation("whiteboard");
  const { canvas } = useCanvas();
  const queryClient = useQueryClient();
  const [deleteMovementId, setDeleteMovementId] = useState<number | null>(null);

  const incomeQuery = useQueryApi<{ entries?: IncomeEntryRow[] }>(
    selectedEdge?.kind === "income"
      ? API_ROUTES.INCOME_ENTRIES_LIST(selectedEdge.flow.incomeId)
      : "",
    {
      queryKey: ["income-entries", selectedEdge?.kind === "income" ? selectedEdge.flow.incomeId : null],
      hasToken: true,
      enabled: selectedEdge?.kind === "income",
    }
  );

  const expenseQuery = useQueryApi<{ payments?: ExpensePaymentRow[] }>(
    selectedEdge?.kind === "expense"
      ? API_ROUTES.EXPENSE_PAYMENTS_LIST(selectedEdge.flow.expenseId)
      : "",
    {
      queryKey: ["expense-payments", selectedEdge?.kind === "expense" ? selectedEdge.flow.expenseId : null],
      hasToken: true,
      enabled: selectedEdge?.kind === "expense",
    }
  );

  const deleteMovementMutation = useMutation({
    mutationFn: async (movementId: number) => {
      if (!selectedEdge) return;
      const url =
        selectedEdge.kind === "income"
          ? API_ROUTES.INCOME_ENTRIES_DELETE(movementId)
          : API_ROUTES.EXPENSE_PAYMENTS_DELETE(movementId);
      await whiteboardApiDelete(url);
    },
    onSuccess: async () => {
      setDeleteMovementId(null);
      if (selectedEdge?.kind === "income") {
        await queryClient.invalidateQueries({
          queryKey: ["income-entries", selectedEdge.flow.incomeId],
        });
      } else if (selectedEdge?.kind === "expense") {
        await queryClient.invalidateQueries({
          queryKey: ["expense-payments", selectedEdge.flow.expenseId],
        });
      }
      if (canvas) {
        await queryClient.invalidateQueries({ queryKey: ["whiteboard", canvas] });
      }
      onMovementDeleted?.();
    },
  });

  if (!selectedEdge) return null;

  const isIncome = selectedEdge.kind === "income";
  const flow = selectedEdge.flow;
  const isLoading = isIncome ? incomeQuery.isLoading : expenseQuery.isLoading;

  const rows = isIncome
    ? (incomeQuery.data?.entries ?? []).filter(
        (entry) => selectedEdge.kind === "income" && entry.destinationWalletId === selectedEdge.flow.walletId
      )
    : (expenseQuery.data?.payments ?? []).filter(
        (payment) => selectedEdge.kind === "expense" && payment.sourceWalletId === selectedEdge.flow.walletId
      );

  return (
    <>
      <div className="absolute right-0 top-0 z-20 flex h-full w-[320px] flex-col border-l bg-background shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <Typography variant="heading" className="text-sm font-semibold">
            {isIncome ? t("sidePanel.incomeFlow") : t("sidePanel.expenseFlow")}
          </Typography>
          <Button size="icon-xs" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="border-b px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {isIncome
              ? t("sidePanel.incomeSummary", {
                  count: selectedEdge.flow.entryCount,
                  amount: formatMoney(selectedEdge.flow.totalAmount, selectedEdge.flow.currencySymbol),
                })
              : t("sidePanel.expenseSummary", {
                  count: selectedEdge.flow.paymentCount,
                  amount: formatMoney(selectedEdge.flow.totalAmount, selectedEdge.flow.currencySymbol),
                })}
          </p>
          {isIncome && onAddEntry && canEdit ? (
            <Button size="sm" className="mt-3 w-full" onClick={onAddEntry}>
              {t("sidePanel.addEntry")}
            </Button>
          ) : null}
          {!isIncome && onAddPayment && canEdit ? (
            <Button size="sm" className="mt-3 w-full" onClick={onAddPayment}>
              {t("sidePanel.addPayment")}
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
                        {formatMoney(row.amount, flow.currencySymbol)}
                      </p>
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
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="shrink-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteMovementId(row.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
