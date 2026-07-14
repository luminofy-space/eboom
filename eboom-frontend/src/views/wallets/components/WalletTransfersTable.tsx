"use client";

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
import { TableCell, TableRow } from "@/components/ui/table";
import API_ROUTES from "@/src/api/urls";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { usePaginatedTransactionQuery } from "@/src/hooks/usePaginatedTransactionQuery";
import { formatAmount, formatDate } from "@/src/i18n/formatters";
import { NewTransferModal } from "./NewTransferModal";
import type { WalletTransfer } from "../utils/utils";
import { useMutationApi } from "@/src/api/useMutation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PaginatedTransfersResponse } from "@/src/types/pagination";

interface WalletTransfersTableProps {
  walletId: number;
  walletName?: string;
  currencyCode?: string;
}

export function WalletTransfersTable({
  walletId,
  walletName,
  currencyCode,
}: WalletTransfersTableProps) {
  const { t } = useTranslation("wallets");
  const { t: tc } = useTranslation("common");
  const { canvas } = useCanvas();
  const { canEdit } = useCanvasPermissions();
  const queryClient = useQueryClient();
  const emDash = tc("empty.emDash");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<WalletTransfer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WalletTransfer | null>(null);

  const extraParams = useMemo(
    () => (currencyCode ? { currencyCode } : undefined),
    [currencyCode]
  );

  const {
    items: transfers,
    data: transfersData,
    total,
    page,
    pageSize,
    totalPages,
    setPage,
    isLoading,
    isFetching,
    isError,
  } = usePaginatedTransactionQuery<PaginatedTransfersResponse<WalletTransfer>, WalletTransfer>({
    baseUrl: canvas ? API_ROUTES.WALLET_TRANSFERS(canvas, walletId) : "",
    queryKey: ["wallet-transfers", canvas, walletId, currencyCode],
    enabled: !!canvas && !!walletId,
    itemsKey: "transfers",
    extraParams,
  });

  const totalIn = parseFloat(transfersData?.totalIn ?? "0");
  const totalOut = parseFloat(transfersData?.totalOut ?? "0");

  const { mutateAsync: deleteTransfer, isPending: isDeleting } = useMutationApi(
    (transferId: number) => API_ROUTES.TRANSFERS_DELETE(canvas!, transferId),
    {
      method: "delete",
      successKey: "success.transfer.deleted",
      invalidateQueries: false,
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["wallet-transfers", canvas, walletId] });
        await queryClient.invalidateQueries({ queryKey: ["wallet", canvas, walletId] });
      },
    }
  );

  const getDirectionLabel = (transfer: WalletTransfer) => {
    if (transfer.sourceWalletId === walletId) {
      return t("transfersTable.direction.out", { wallet: transfer.destinationWalletName });
    }
    return t("transfersTable.direction.in", { wallet: transfer.sourceWalletName });
  };

  const getAmountDisplay = (transfer: WalletTransfer) => {
    if (transfer.sourceWalletId === walletId) {
      return formatAmount(transfer.sourceAmount, transfer.sourceCurrencySymbol, emDash);
    }
    return formatAmount(transfer.destinationAmount, transfer.destinationCurrencySymbol, emDash);
  };

  const columns: DataTableColumn<WalletTransfer>[] = useMemo(
    () => [
      {
        id: "amount",
        header: t("transfersTable.headers.amount"),
        headerClassName: "w-[140px]",
        cellClassName: "font-medium tabular-nums",
        cell: (transfer) => getAmountDisplay(transfer),
      },
      {
        id: "direction",
        header: t("transfersTable.headers.direction"),
        cell: (transfer) => (
          <Stack direction="row" align="center" gap={2}>
            <ArrowLeftRight className="text-muted-foreground size-4" />
            <span>{getDirectionLabel(transfer)}</span>
          </Stack>
        ),
      },
      {
        id: "counterparty",
        header: t("transfersTable.headers.counterparty"),
        cell: (transfer) => (
          <TableEntityCell
            name={
              transfer.sourceWalletId === walletId
                ? transfer.destinationWalletName
                : transfer.sourceWalletName
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
        header: t("transfersTable.headers.date"),
        cellClassName: "text-muted-foreground",
        cell: (transfer) => formatDate(transfer.transferDate, { fallback: emDash }),
      },
      {
        id: "rate",
        header: t("transfersTable.headers.rate"),
        headerClassName: "hidden md:table-cell",
        cellClassName: "hidden text-muted-foreground md:table-cell",
        cell: (transfer) => transfer.exchangeRate ?? emDash,
      },
      {
        id: "fee",
        header: t("transfersTable.headers.fee"),
        headerClassName: "hidden lg:table-cell",
        cellClassName: "hidden text-muted-foreground lg:table-cell",
        cell: (transfer) =>
          formatAmount(transfer.transactionFee, transfer.sourceCurrencySymbol, emDash),
      },
      {
        id: "notes",
        header: t("transfersTable.headers.notes"),
        headerClassName: "hidden md:table-cell",
        cellClassName: tableNotesCellClassName,
        cell: (transfer) => <TableNotesCell notes={transfer.notes} emptyLabel={emDash} />,
      },
    ],
    [t, emDash, walletId]
  );

  return (
    <>
      <DataTableSection
        title={t("transfersTable.title")}
        subtitle={t("transfersTable.subtitle")}
        count={total > 0 ? t("transfersTable.count", { count: total }) : undefined}
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
              {t("transfersTable.createTransfer")}
            </Button>
          ) : undefined
        }
        isLoading={isLoading}
        isError={isError}
        errorMessage={t("transfersTable.loadError")}
        columns={columns}
        data={transfers}
        getRowKey={(transfer) => transfer.id}
        emptyMessage={t("transfersTable.empty")}
        showActions={canEdit}
        actions={{
          onEdit: (transfer) => {
            setEditingTransfer(transfer);
            setModalOpen(true);
          },
          onDelete: (transfer) => setDeleteTarget(transfer),
        }}
        footer={
          <TableRow>
            <TableCell className="font-semibold tabular-nums">
              {formatAmount(totalIn, undefined, emDash)}
            </TableCell>
            <TableCell colSpan={7} className="text-muted-foreground">
              {t("transfersTable.footer.netIn")} / {formatAmount(totalOut, undefined, emDash)}{" "}
              {t("transfersTable.footer.netOut")}
            </TableCell>
          </TableRow>
        }
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
        walletId={walletId}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingTransfer(null);
        }}
        fixedSourceWalletId={editingTransfer ? undefined : walletId}
        sourceWalletName={editingTransfer ? undefined : walletName}
        extraInvalidateKeys={[
          ["wallet-transfers", canvas, walletId],
          ["wallet", canvas, walletId],
        ]}
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
