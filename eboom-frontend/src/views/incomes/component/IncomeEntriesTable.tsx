"use client";

import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import { Badge } from "@/components/ui/badge";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { MoreVertical, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { NewIncomeEntryModal } from "./NewIncomeEntryModal";

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

function getEntryStatus(entry: IncomeEntry): {
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

function sortEntries(entries: IncomeEntry[]): IncomeEntry[] {
  return [...entries].sort((a, b) => {
    const dateA = a.receivedDate ?? a.expectedDate ?? a.createdAt;
    const dateB = b.receivedDate ?? b.expectedDate ?? b.createdAt;
    return dayjs(dateB).valueOf() - dayjs(dateA).valueOf();
  });
}

export function IncomeEntriesTable({ incomeId }: IncomeEntriesTableProps) {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: incomeRes, isLoading: isLoadingIncome } = useQueryApi<{
    income: {
      id: number;
      name: string;
      currencyId: number;
      defaultWalletId: number | null;
      defaultWallet?: { id: number; name: string } | null;
    };
  }>(API_ROUTES.INCOMES_GET(incomeId), {
    queryKey: ["income", incomeId],
    enabled: !!incomeId,
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
    API_ROUTES.INCOME_ENTRIES_LIST(incomeId),
    {
      queryKey: ["income-entries", incomeId],
      enabled: !!incomeId,
    }
  );

  const { mutate: deleteEntry, isPending: isDeleting } = useMutation({
    mutationFn: async (id: number) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}${API_ROUTES.INCOME_ENTRIES_DELETE(id)}`;
      const token = hasWindow ? window.localStorage.getItem("accessToken") : null;
      await axios.delete(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["income-entries", incomeId] });
    },
  });

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
            <Typography variant="heading">Entries</Typography>
            {incomeRes?.income?.name && (
              <Typography variant="muted-sm">
                Payment history for {incomeRes.income.name}
              </Typography>
            )}
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
                <TableHead>Wallet</TableHead>
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
                      No entries yet. Record a payment to track income received.
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
                          <span>{entry.destinationWallet?.name ?? "—"}</span>
                          {entry.destinationWallet?.category?.name && (
                            <Typography variant="caption">
                              {entry.destinationWallet.category.name}
                            </Typography>
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
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteId(entry.id)}
                            >
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
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultWalletId={
          incomeRes?.income?.defaultWalletId ??
          incomeRes?.income?.defaultWallet?.id
        }
        incomeName={incomeRes?.income?.name}
      />
    </>
  );
}
