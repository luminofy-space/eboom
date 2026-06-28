"use client";

import Link from "next/link";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import API_ROUTES from "@/src/api/urls";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { formatAmount, formatDate } from "@/src/i18n/formatters";
import { NewTransferModal } from "@/src/views/wallets/components/NewTransferModal";
import type { WalletTransfer } from "@/src/views/wallets/utils/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { ArrowLeftRight, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface TransactionsTransfersTableProps {
  transfers: WalletTransfer[];
}

function sortTransfers(transfers: WalletTransfer[]): WalletTransfer[] {
  return [...transfers].sort(
    (a, b) => dayjs(b.transferDate).valueOf() - dayjs(a.transferDate).valueOf()
  );
}

export function TransactionsTransfersTable({ transfers: transfersProp }: TransactionsTransfersTableProps) {
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

  const transfers = useMemo(() => sortTransfers(transfersProp), [transfersProp]);

  const invalidateKeys = useMemo(
    () =>
      canvas
        ? [
            ["canvas-transactions", canvas],
            ["canvas-summary", canvas],
          ]
        : [],
    [canvas]
  );

  const { mutateAsync: deleteTransfer, isPending: isDeleting } = useMutation({
    mutationFn: async (transferId: number) => {
      const token =
        typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}${API_ROUTES.TRANSFERS_DELETE(transferId)}`;
      await axios.delete(url, { headers });
    },
    onSuccess: async () => {
      if (!canvas) return;
      await queryClient.invalidateQueries({ queryKey: ["canvas-transactions", canvas] });
      await queryClient.invalidateQueries({ queryKey: ["canvas-summary", canvas] });
    },
  });

  return (
    <>
      <Container>
        <Stack gap={4}>
          <Stack direction="row" align="center" justify="between" gap={4}>
            <div>
              <Typography variant="heading">{t("transfers.title")}</Typography>
              <Typography variant="muted-sm">{t("transfers.subtitle")}</Typography>
            </div>
            <Stack direction="row" align="center" gap={3}>
              {transfers.length > 0 && (
                <Typography variant="count" className="hidden sm:block">
                  {t("transfers.count", { count: transfers.length })}
                </Typography>
              )}
              {canEdit && (
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
              )}
            </Stack>
          </Stack>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[140px]">{tw("transfersTable.headers.amount")}</TableHead>
                  <TableHead>{tw("transfersTable.headers.direction")}</TableHead>
                  <TableHead>{tw("transfersTable.headers.counterparty")}</TableHead>
                  <TableHead>{tw("transfersTable.headers.date")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {tw("transfersTable.headers.rate")}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {tw("transfersTable.headers.fee")}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {tw("transfersTable.headers.notes")}
                  </TableHead>
                  {canEdit && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 8 : 7} className="h-24 text-center">
                      <p className="text-muted-foreground">{t("transfers.empty")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  transfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium tabular-nums">
                        {formatAmount(transfer.sourceAmount, transfer.sourceCurrencySymbol, emDash)}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" align="center" gap={2}>
                          <ArrowLeftRight className="text-muted-foreground size-4" />
                          <span>
                            {t("transfers.direction", {
                              source: transfer.sourceWalletName,
                              destination: transfer.destinationWalletName,
                            })}
                          </span>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>
                            <Link
                              href={`/wallet/${transfer.destinationWalletId}`}
                              className="text-primary hover:underline"
                            >
                              {transfer.destinationWalletName}
                            </Link>
                          </span>
                          {transfer.sourceCurrencyId !== transfer.destinationCurrencyId && (
                            <Typography variant="caption">
                              {transfer.sourceCurrencyCode} → {transfer.destinationCurrencyCode}
                            </Typography>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(transfer.transferDate, { fallback: emDash })}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {transfer.exchangeRate ?? emDash}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {formatAmount(
                          transfer.transactionFee,
                          transfer.sourceCurrencySymbol,
                          emDash
                        )}
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                        {transfer.notes ? (
                          <span title={transfer.notes}>{transfer.notes}</span>
                        ) : (
                          <span className="text-muted-foreground">{emDash}</span>
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground size-8"
                              >
                                <MoreVertical className="size-4" />
                                <span className="sr-only">{tc("actions.openMenu")}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingTransfer(transfer);
                                  setModalOpen(true);
                                }}
                              >
                                <Pencil className="size-4" />
                                {tc("actions.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleteTarget(transfer)}
                              >
                                <Trash2 className="size-4" />
                                {tc("actions.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Stack>
      </Container>

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
