"use client";

import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import API_ROUTES from "@/src/api/urls";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { formatAmount } from "@/src/i18n/formatters";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { ArrowLeftRight, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useWalletDetail } from "../hooks/useWalletDetail";
import type { WalletTransfer } from "../utils/utils";
import { NewTransferModal } from "./NewTransferModal";

interface WalletTransfersTableProps {
  walletId: number;
  walletName?: string;
}

function formatDate(date: string | null | undefined, emDash: string): string {
  if (!date) return emDash;
  return dayjs(date).format("MMM D, YYYY");
}

function sortTransfers(transfers: WalletTransfer[]): WalletTransfer[] {
  return [...transfers].sort(
    (a, b) => dayjs(b.transferDate).valueOf() - dayjs(a.transferDate).valueOf()
  );
}

export function WalletTransfersTable({ walletId, walletName }: WalletTransfersTableProps) {
  const { t } = useTranslation("wallets");
  const { t: tc } = useTranslation("common");
  const { canEdit } = useCanvasPermissions();
  const emDash = tc("empty.emDash");
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<WalletTransfer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WalletTransfer | null>(null);

  const { transfers: transfersRes, isLoading, isError } = useWalletDetail(walletId);

  const transfers = useMemo(() => sortTransfers(transfersRes ?? []), [transfersRes]);

  const totalOut = useMemo(
    () =>
      transfers
        .filter((tr) => tr.sourceWalletId === walletId)
        .reduce((sum, tr) => sum + parseFloat(tr.sourceAmount), 0),
    [transfers, walletId]
  );

  const totalIn = useMemo(
    () =>
      transfers
        .filter((tr) => tr.destinationWalletId === walletId)
        .reduce((sum, tr) => sum + parseFloat(tr.destinationAmount), 0),
    [transfers, walletId]
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
      await queryClient.invalidateQueries({ queryKey: ["wallet-transfers", walletId] });
      await queryClient.invalidateQueries({ queryKey: ["wallet", walletId] });
      await queryClient.invalidateQueries({ queryKey: ["wallet-entries", walletId] });
      await queryClient.invalidateQueries({ queryKey: ["wallet-payments", walletId] });
    },
  });

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

  if (isLoading) {
    return (
      <Container>
        <Stack gap={4}>
          <Skeleton className="h-7 w-48" />
          <div className="overflow-hidden rounded-lg border">
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </Stack>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container>
        <Typography variant="muted-sm">{t("transfersTable.loadError")}</Typography>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Stack gap={4}>
          <Stack direction="row" align="center" justify="between" gap={4}>
            <div>
              <Typography variant="heading">{t("transfersTable.title")}</Typography>
              <Typography variant="muted-sm">{t("transfersTable.subtitle")}</Typography>
            </div>
            <Stack direction="row" align="center" gap={3}>
              {transfers.length > 0 && (
                <Typography variant="count" className="hidden sm:block">
                  {t("transfersTable.count", { count: transfers.length })}
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
                  {t("transfersTable.createTransfer")}
                </Button>
              )}
            </Stack>
          </Stack>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[140px]">{t("transfersTable.headers.amount")}</TableHead>
                  <TableHead>{t("transfersTable.headers.direction")}</TableHead>
                  <TableHead>{t("transfersTable.headers.counterparty")}</TableHead>
                  <TableHead>{t("transfersTable.headers.date")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("transfersTable.headers.rate")}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {t("transfersTable.headers.fee")}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("transfersTable.headers.notes")}
                  </TableHead>
                  {canEdit && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 8 : 7} className="h-24 text-center">
                      <p className="text-muted-foreground">{t("transfersTable.empty")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  transfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium tabular-nums">
                        {getAmountDisplay(transfer)}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" align="center" gap={2}>
                          <ArrowLeftRight className="text-muted-foreground size-4" />
                          <span>{getDirectionLabel(transfer)}</span>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>
                            {transfer.sourceWalletId === walletId
                              ? transfer.destinationWalletName
                              : transfer.sourceWalletName}
                          </span>
                          {transfer.sourceCurrencyId !== transfer.destinationCurrencyId && (
                            <Typography variant="caption">
                              {transfer.sourceCurrencyCode} → {transfer.destinationCurrencyCode}
                            </Typography>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(transfer.transferDate, emDash)}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {transfer.exchangeRate ?? emDash}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {formatAmount(transfer.transactionFee, transfer.sourceCurrencySymbol, emDash)}
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
              {transfers.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-semibold tabular-nums">
                      {formatAmount(totalIn, undefined, emDash)}
                    </TableCell>
                    <TableCell colSpan={7} className="text-muted-foreground">
                      {t("transfersTable.footer.netIn")} / {formatAmount(totalOut, undefined, emDash)}{" "}
                      {t("transfersTable.footer.netOut")}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
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
        fixedSourceWalletId={editingTransfer ? undefined : walletId}
        sourceWalletName={editingTransfer ? undefined : walletName}
        extraInvalidateKeys={[
          ["wallet-transfers", walletId],
          ["wallet", walletId],
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
