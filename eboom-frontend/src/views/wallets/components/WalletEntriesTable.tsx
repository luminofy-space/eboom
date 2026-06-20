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

interface WalletEntriesTableProps {
  walletId: number;
  walletName?: string;
  currencySymbol?: string;
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return dayjs(date).format("MMM D, YYYY");
}

function formatAmount(amount: string | number, symbol?: string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return "—";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(num);
  return symbol ? `${symbol}${formatted}` : formatted;
}

function getEntryStatus(entry: WalletEntry): {
  label: string;
  variant: "default" | "secondary" | "outline";
} {
  if (entry.receivedDate) {
    return { label: "Received", variant: "default" };
  }
  if (entry.expectedDate && dayjs(entry.expectedDate).isAfter(dayjs(), "day")) {
    return { label: "Expected", variant: "secondary" };
  }
  return { label: "Pending", variant: "outline" };
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
          Failed to load income entries. Please try again.
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
            <Typography variant="heading">Income Entries</Typography>
            <Typography variant="muted-sm">
              Incoming transactions to this wallet
            </Typography>
          </div>
          <Stack direction="row" align="center" gap={3}>
            {entries.length > 0 && (
              <Typography variant="count" className="hidden sm:block">
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </Typography>
            )}
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Create Entry
            </Button>
          </Stack>
        </Stack>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[140px]">Amount</TableHead>
              <TableHead>Income</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Notes</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <p className="text-muted-foreground">
                    No income entries yet. Create an entry to record incoming funds.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                const status = getEntryStatus(entry);
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium tabular-nums">
                      {formatAmount(entry.amount, currencySymbol)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{entry.incomeName ?? `Income #${entry.incomeId}`}</span>
                        {entry.categoryName && (
                          <Typography variant="caption">{entry.categoryName}</Typography>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(entry.expectedDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(entry.receivedDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                      {entry.notes ? (
                        <span title={entry.notes}>{entry.notes}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground size-8"
                          >
                            <MoreVertical className="size-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem variant="destructive" disabled>
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          {entries.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold tabular-nums">
                  {formatAmount(totalReceived, currencySymbol)}
                </TableCell>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Total received
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