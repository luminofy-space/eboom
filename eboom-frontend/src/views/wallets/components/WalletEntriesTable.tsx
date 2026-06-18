"use client";

import { Badge } from "@/components/ui/badge";
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
import dayjs from "dayjs";
import { MoreVertical, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { NewIncomeEntryModal } from "@/src/views/incomes/component/NewIncomeEntryModal";
import { useWalletDetail } from "../hooks/useWalletDetail";
import type { WalletEntry } from "../utils/utils";
import { useTranslation } from "react-i18next";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import type { TFunction } from "i18next";
import { formatAmount } from "@/src/i18n/formatters";

interface WalletEntriesTableProps {
  walletId: number;
  walletName?: string;
  currencySymbol?: string;
}

function formatDate(date: string | null | undefined, emDash: string): string {
  if (!date) return emDash;
  return dayjs(date).format("MMM D, YYYY");
}

function getEntryStatus(entry: WalletEntry, t: TFunction<"wallets">): {
  label: string;
  variant: "default" | "secondary" | "outline";
} {
  if (entry.receivedDate) {
    return { label: t("status.received"), variant: "default" };
  }
  if (entry.expectedDate && dayjs(entry.expectedDate).isAfter(dayjs(), "day")) {
    return { label: t("status.expected"), variant: "secondary" };
  }
  return { label: t("status.pending"), variant: "outline" };
}

function sortEntries(entries: WalletEntry[]): WalletEntry[] {
  return [...entries].sort((a, b) => {
    const dateA = a.receivedDate ?? a.expectedDate ?? a.createdAt;
    const dateB = b.receivedDate ?? b.expectedDate ?? b.createdAt;
    return dayjs(dateB).valueOf() - dayjs(dateA).valueOf();
  });
}

export function WalletEntriesTable({
  walletId,
  walletName,
  currencySymbol,
}: WalletEntriesTableProps) {
  const { t } = useTranslation("wallets");
  const { t: tc } = useTranslation("common");
  const { canEdit } = useCanvasPermissions();
  const emDash = tc("empty.emDash");
  const [createOpen, setCreateOpen] = useState(false);
  const { entries: entriesRes, isLoading, isError } = useWalletDetail(walletId);

  const entries = useMemo(
    () => sortEntries(entriesRes ?? []),
    [entriesRes]
  );

  const totalReceived = useMemo(
    () =>
      entries
        .filter((e) => e.receivedDate)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0),
    [entries]
  );

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
            <Typography variant="muted-sm">
              {t("entriesTable.subtitle")}
            </Typography>
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
            <Button size="sm" onClick={() => setCreateOpen(true)}>
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
              <TableHead>{t("entriesTable.headers.income")}</TableHead>
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
                        <span>{entry.incomeName ?? t("entriesTable.fallbackIncomeName", { incomeId: entry.incomeId })}</span>
                        {entry.categoryName && (
                          <Typography variant="caption">{entry.categoryName}</Typography>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(entry.expectedDate, emDash)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(entry.receivedDate, emDash)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
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

      <NewIncomeEntryModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        fixedDestinationWalletId={walletId}
        walletName={walletName}
        extraInvalidateKeys={[["wallet-entries", walletId], ["wallet", walletId]]}
      />
    </>
  );
}