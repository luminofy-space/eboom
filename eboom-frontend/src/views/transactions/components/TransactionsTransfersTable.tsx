"use client";

import Link from "next/link";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import {
  DataTableSection,
  TableEntityCell,
  TableNotesCell,
  tableNotesCellClassName,
  type DataTableColumn,
} from "@/src/components/data-table";
import { ListPagination } from "@/src/components/list/ListPagination";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/ui/stack";
import API_ROUTES from "@/src/api/urls";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { usePaginatedTransactionQuery } from "@/src/hooks/usePaginatedTransactionQuery";
import { formatAmount, formatDate } from "@/src/i18n/formatters";
import { NewTransferModal } from "@/src/views/wallets/components/NewTransferModal";
import type { WalletTransfer } from "@/src/views/wallets/utils/utils";
import { useMutationApi } from "@/src/api/useMutation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PaginatedTransfersResponse } from "@/src/types/pagination";

export function TransactionsTransfersTable() {
  const { t } = useTranslation("transactions");
  const { t: tw } = useTranslation("wallets");
  const { t: tc } = useTranslation("common");
  const { canvas } = useCanvas();
  const { canEdit } = useCanvasPermissions();
  const queryClient = useQueryClient();
  const emDash = tc("empty.emDash");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<WalletTransfer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WalletTransfer | null>(null);

  const {
    items: transfers,
    total,
    page,
    pageSize,
    totalPages,
    setPage,
    isLoading,
    isFetching,
    isError,
  } = usePaginatedTransactionQuery<PaginatedTransfersResponse<WalletTransfer>, WalletTransfer>({
    baseUrl: canvas ? API_ROUTES.CANVAS_TRANSACTIONS(canvas) : "",
    queryKey: ["canvas-transactions", canvas, "transfers"],
    enabled: !!canvas,
    itemsKey: "transfers",
    extraParams: { type: "transfers" },
  });

  const invalidateKeys = useMemo(
    () =>
      canvas
        ? [
            ["canvas-transactions", canvas, "transfers"],
            ["canvas-summary", canvas],
          ]
        : [],
    [canvas]
  );

  const { mutateAsync: deleteTransfer, isPending: isDeleting } = useMutationApi(
    (transferId: number) => API_ROUTES.TRANSFERS_DELETE(canvas!, transferId),
    {
      method: "delete",
      successKey: "success.transfer.deleted",
      invalidateQueries: false,
      onSuccess: async () => {
        if (!canvas) return;
        await queryClient.invalidateQueries({ queryKey: ["canvas-transactions", canvas] });
        await queryClient.invalidateQueries({ queryKey: ["canvas-summary", canvas] });
      },
    }
  );

  const columns: DataTableColumn<WalletTransfer>[] = useMemo(
    () => [
      {
        id: "amount",
        header: tw("transfersTable.headers.amount"),
        headerClassName: "w-[140px]",
        cellClassName: "font-medium tabular-nums",
        cell: (transfer) =>
          formatAmount(transfer.sourceAmount, transfer.sourceCurrencySymbol, emDash),
      },
      {
        id: "direction",
        header: tw("transfersTable.headers.direction"),
        cell: (transfer) => (
          <Stack direction="row" align="center" gap={2}>
            <ArrowLeftRight className="text-muted-foreground size-4" />
            <span>
              {t("transfers.direction", {
                source: transfer.sourceWalletName,
                destination: transfer.destinationWalletName,
              })}
            </span>
          </Stack>
        ),
      },
      {
        id: "counterparty",
        header: tw("transfersTable.headers.counterparty"),
        cell: (transfer) => (
          <TableEntityCell
            name={
              <Link
                href={`/wallet/${transfer.destinationWalletId}`}
                className="text-primary hover:underline"
              >
                {transfer.destinationWalletName}
              </Link>
            }
            caption={
              transfer.sourceCurrencyId !== transfer.destinationCurrencyId
                ? `${transfer.sourceCurrencyCode} → ${transfer.destinationCurrencyCode}`
                : undefined
            }
          />
        ),
      },
      {
        id: "date",
        header: tw("transfersTable.headers.date"),
        cellClassName: "text-muted-foreground",
        cell: (transfer) => formatDate(transfer.transferDate, { fallback: emDash }),
      },
      {
        id: "rate",
        header: tw("transfersTable.headers.rate"),
        headerClassName: "hidden md:table-cell",
        cellClassName: "hidden text-muted-foreground md:table-cell",
        cell: (transfer) => transfer.exchangeRate ?? emDash,
      },
      {
        id: "fee",
        header: tw("transfersTable.headers.fee"),
        headerClassName: "hidden lg:table-cell",
        cellClassName: "hidden text-muted-foreground lg:table-cell",
        cell: (transfer) =>
          formatAmount(transfer.transactionFee, transfer.sourceCurrencySymbol, emDash),
      },
      {
        id: "notes",
        header: tw("transfersTable.headers.notes"),
        headerClassName: "hidden md:table-cell",
        cellClassName: tableNotesCellClassName,
        cell: (transfer) => <TableNotesCell notes={transfer.notes} emptyLabel={emDash} />,
      },
    ],
    [t, tw, emDash]
  );

  return (
    <>
      <DataTableSection
        title={t("transfers.title")}
        subtitle={t("transfers.subtitle")}
        count={total > 0 ? t("transfers.count", { count: total }) : undefined}
        headerAction={
          canEdit ? (
            <Button
              size="sm"
              onClick={() => {
                setEditingTransfer(null);
                setModalOpen(true);
              }}
            >
              <Plus className="size-4" />
              {t("transfers.createTransfer")}
            </Button>
          ) : undefined
        }
        isLoading={isLoading}
        isError={isError}
        errorMessage={t("transfers.loadError")}
        columns={columns}
        data={transfers}
        getRowKey={(transfer) => transfer.id}
        emptyMessage={t("transfers.empty")}
        showActions={canEdit}
        actions={{
          onEdit: (transfer) => {
            setEditingTransfer(transfer);
            setModalOpen(true);
          },
          onDelete: (transfer) => setDeleteTarget(transfer),
        }}
        pagination={
          <ListPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            isFetching={isFetching}
          />
        }
      />

      <NewTransferModal
        transferId={editingTransfer?.id}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingTransfer(null);
        }}
        extraInvalidateKeys={invalidateKeys}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        isDeleting={isDeleting}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteTransfer(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </>
  );
}
