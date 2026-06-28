"use client";

import Link from "next/link";
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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { formatAmount, formatDate } from "@/src/i18n/formatters";
import { NewIncomeEntryModal } from "@/src/views/incomes/component/NewIncomeEntryModal";
import dayjs from "dayjs";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { CanvasTransactionsIncomeEntry } from "../types";

interface TransactionsEntriesTableProps {
  entries: CanvasTransactionsIncomeEntry[];
}

function getEntryStatus(entry: CanvasTransactionsIncomeEntry, t: TFunction<"wallets">): {
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

function sortEntries(entries: CanvasTransactionsIncomeEntry[]): CanvasTransactionsIncomeEntry[] {
  return [...entries].sort((a, b) => {
    const dateA = a.receivedDate ?? a.expectedDate ?? a.createdAt;
    const dateB = b.receivedDate ?? b.expectedDate ?? b.createdAt;
    return dayjs(dateB).valueOf() - dayjs(dateA).valueOf();
  });
}

export function TransactionsEntriesTable({ entries: entriesProp }: TransactionsEntriesTableProps) {
  const { t } = useTranslation("transactions");
  const { t: tw } = useTranslation("wallets");
  const { t: tc } = useTranslation("common");
  const { canvas } = useCanvas();
  const { canEdit } = useCanvasPermissions();
  const router = useRouter();
  const emDash = tc("empty.emDash");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CanvasTransactionsIncomeEntry | null>(null);

  const entries = useMemo(() => sortEntries(entriesProp), [entriesProp]);

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

  return (
    <>
      <Container>
        <Stack gap={4}>
          <Stack direction="row" align="center" justify="between" gap={4}>
            <div>
              <Typography variant="heading">{t("entries.title")}</Typography>
              <Typography variant="muted-sm">{t("entries.subtitle")}</Typography>
            </div>
            <Stack direction="row" align="center" gap={3}>
              {entries.length > 0 && (
                <Typography variant="count" className="hidden sm:block">
                  {t("entries.count", {
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
                  {t("entries.createEntry")}
                </Button>
              )}
            </Stack>
          </Stack>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[140px]">{tw("entriesTable.headers.amount")}</TableHead>
                  <TableHead>{tw("entriesTable.headers.income")}</TableHead>
                  <TableHead>{t("columns.wallet")}</TableHead>
                  <TableHead>{tw("entriesTable.headers.expected")}</TableHead>
                  <TableHead>{tw("entriesTable.headers.received")}</TableHead>
                  <TableHead>{tw("entriesTable.headers.status")}</TableHead>
                  <TableHead className="hidden md:table-cell">{tw("entriesTable.headers.notes")}</TableHead>
                  {canEdit && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 8 : 7} className="h-24 text-center">
                      <p className="text-muted-foreground">{t("entries.empty")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => {
                    const status = getEntryStatus(entry, tw);
                    return (
                      <TableRow
                        key={entry.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/income/${entry.incomeId}`)}
                      >
                        <TableCell className="font-medium tabular-nums">
                          {formatAmount(entry.amount, entry.currencySymbol, emDash)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>
                              {entry.incomeName ??
                                t("entries.fallbackIncomeName", { incomeId: entry.incomeId })}
                            </span>
                            {entry.categoryName && (
                              <Typography variant="caption">{entry.categoryName}</Typography>
                            )}
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/wallet/${entry.destinationWalletId}`}
                            className="text-primary hover:underline"
                          >
                            {entry.destinationWalletName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(entry.expectedDate, { fallback: emDash })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(entry.receivedDate, { fallback: emDash })}
                        </TableCell>
                        <TableCell>
                          <TransactionStatusChip status={status.status} label={status.label} />
                        </TableCell>
                        <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                          {entry.notes ? (
                            <span title={entry.notes}>{entry.notes}</span>
                          ) : (
                            <span className="text-muted-foreground">{emDash}</span>
                          )}
                        </TableCell>
                        {canEdit && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
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
                                <DropdownMenuItem variant="destructive" disabled>
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
            </Table>
          </div>
        </Stack>
      </Container>

      <NewIncomeEntryModal
        incomeId={editingEntry?.incomeId}
        entryId={editingEntry?.id}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingEntry(null);
        }}
        extraInvalidateKeys={invalidateKeys}
      />
    </>
  );
}
