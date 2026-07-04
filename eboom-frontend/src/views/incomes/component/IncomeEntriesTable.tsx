"use client";

import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import { TransactionStatusChip, type TransactionStatus } from "@/src/components/TransactionStatusChip";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutationApi } from "@/src/api/useMutation";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { NewIncomeEntryModal } from "./NewIncomeEntryModal";
import { useTranslation } from "react-i18next";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import type { TFunction } from "i18next";
import { formatAmount, formatDate } from "@/src/i18n/formatters";

interface WalletCategory {
  id: number;
  name: string;
}

interface DestinationWallet {
  id: number;
  name: string;
  category?: WalletCategory | null;
}

export interface IncomeEntry {
  id: number;
  incomeId: number;
  destinationWalletId: number;
  amount: string;
  expectedDate: string | null;
  receivedDate: string | null;
  notes: string | null;
  createdAt: string;
  destinationWallet: DestinationWallet | null;
}

interface IncomeEntriesTableProps {
  incomeId: number;
}

const hasWindow = typeof window !== "undefined";

function getEntryStatus(entry: IncomeEntry, t: TFunction<"incomes">): {
  label: string;
  status: TransactionStatus;
} {
  if (entry.receivedDate) {
    return { label: t("status.received"), status: "received" };
  }
  if (entry.expectedDate && dayjs(entry.expectedDate).isAfter(dayjs(), "day")) {
    return { label: t("status.expected"), status: "expected" };
  }
  return { label: t("status.pending"), status: "pending" };
}

function sortEntries(entries: IncomeEntry[]): IncomeEntry[] {
  return [...entries].sort((a, b) => {
    const dateA = a.receivedDate ?? a.expectedDate ?? a.createdAt;
    const dateB = b.receivedDate ?? b.expectedDate ?? b.createdAt;
    return dayjs(dateB).valueOf() - dayjs(dateA).valueOf();
  });
}

export function IncomeEntriesTable({ incomeId }: IncomeEntriesTableProps) {
  const { t } = useTranslation("incomes");
  const { t: tc } = useTranslation("common");
  const { canvas } = useCanvas();
  const { canEdit } = useCanvasPermissions();
  const emDash = tc("empty.emDash");
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<IncomeEntry | null>(null);

  const { data: incomeRes, isLoading: isLoadingIncome } = useQueryApi<{
    income: {
      id: number;
      name: string;
      currencyId: number;
      defaultWalletId: number | null;
      defaultWallet?: { id: number; name: string } | null;
    };
  }>(canvas ? API_ROUTES.INCOMES_GET(canvas, incomeId) : "", {
    queryKey: ["income", canvas, incomeId],
    enabled: !!canvas && !!incomeId,
  });

  const { data: currenciesRes } = useQueryApi<{
    currencies?: { id: number; code: string; symbol: string }[];
  }>(API_ROUTES.CURRENCIES_METADATA, {
    queryKey: ["currencies"],
  });

  const {
    data: entriesRes,
    isLoading: isLoadingEntries,
    isError,
  } = useQueryApi<{ entries: IncomeEntry[] }>(
    canvas ? API_ROUTES.INCOME_ENTRIES_LIST(canvas, incomeId) : "",
    {
      queryKey: ["income-entries", canvas, incomeId],
      enabled: !!canvas && !!incomeId,
    }
  );

  const { mutate: deleteEntry, isPending: isDeleting } = useMutationApi(
    (id: number) => API_ROUTES.INCOME_ENTRIES_DELETE(canvas!, id),
    {
      method: "delete",
      invalidateQueries: false,
      onSuccess: () => {
        setDeleteId(null);
        queryClient.invalidateQueries({ queryKey: ["income-entries", canvas, incomeId] });
        queryClient.invalidateQueries({ queryKey: ["notifications", "overdue"] });
      },
    }
  );

  const currencySymbol = useMemo(() => {
    const currencyId = incomeRes?.income?.currencyId;
    if (!currencyId) return undefined;
    return currenciesRes?.currencies?.find((c) => c.id === currencyId)?.symbol;
  }, [incomeRes?.income?.currencyId, currenciesRes?.currencies]);

  const entries = useMemo(
    () => sortEntries(entriesRes?.entries ?? []),
    [entriesRes?.entries]
  );

  const totalReceived = useMemo(
    () =>
      entries
        .filter((e) => e.receivedDate)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0),
    [entries]
  );

  const isLoading = isLoadingIncome || isLoadingEntries;

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
        <Typography variant="muted-sm">
          {t("entriesTable.loadError")}
        </Typography>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Stack gap={4}>
        <Stack direction="row" align="center" justify="between" gap={4}>
          <div>
            <Typography variant="heading">{t("entriesTable.title")}</Typography>
            {incomeRes?.income?.name && (
              <Typography variant="muted-sm">
                {t("entriesTable.subtitle", { incomeName: incomeRes.income.name })}
              </Typography>
            )}
          </div>
          <Stack direction="row" align="center" gap={3}>
            {entries.length > 0 && (
              <Typography variant="count" className="hidden sm:block">
                {t("entriesTable.count", {
                  count: entries.length,
                  unit: entries.length === 1 ? tc("plurals.entry") : tc("plurals.entries"),
                })}
              </Typography>
            )}
            {canEdit && (
            <Button
              size="sm"
              onClick={() => {
                setEditingEntry(null);
                setModalOpen(true);
              }}
            >
              <Plus className="size-4" />
              {t("entriesTable.createEntry")}
            </Button>
            )}
          </Stack>
        </Stack>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[140px]">{t("entriesTable.headers.amount")}</TableHead>
                <TableHead>{t("entriesTable.headers.wallet")}</TableHead>
                <TableHead>{t("entriesTable.headers.expected")}</TableHead>
                <TableHead>{t("entriesTable.headers.received")}</TableHead>
                <TableHead>{t("entriesTable.headers.status")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("entriesTable.headers.notes")}</TableHead>
                {canEdit && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 7 : 6} className="h-24 text-center">
                    <p className="text-muted-foreground">
                      {t("entriesTable.empty")}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const status = getEntryStatus(entry, t);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium tabular-nums">
                        {formatAmount(entry.amount, currencySymbol, emDash)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{entry.destinationWallet?.name ?? emDash}</span>
                          {entry.destinationWallet?.category?.name && (
                            <Typography variant="caption">
                              {entry.destinationWallet.category.name}
                            </Typography>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(entry.expectedDate, { fallback: emDash })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(entry.receivedDate, { fallback: emDash })}
                      </TableCell>
                      <TableCell>
                        <TransactionStatusChip
                          status={status.status}
                          label={status.label}
                        />
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                        {entry.notes ? (
                          <span title={entry.notes}>{entry.notes}</span>
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
                                setEditingEntry(entry);
                                setModalOpen(true);
                              }}
                            >
                              <Pencil className="size-4" />
                              {tc("actions.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteId(entry.id)}
                            >
                              <Trash2 className="size-4" />
                              {tc("actions.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            {entries.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold tabular-nums">
                    {formatAmount(totalReceived, currencySymbol, emDash)}
                  </TableCell>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    {t("entriesTable.footer.totalReceived")}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
        </Stack>
      </Container>

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onConfirm={() => {
          if (deleteId !== null) deleteEntry(deleteId);
        }}
        isDeleting={isDeleting}
      />

      <NewIncomeEntryModal
        incomeId={incomeId}
        entryId={editingEntry?.id}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingEntry(null);
        }}
        defaultWalletId={
          incomeRes?.income?.defaultWalletId ??
          incomeRes?.income?.defaultWallet?.id
        }
        incomeName={incomeRes?.income?.name}
      />
    </>
  );
}
