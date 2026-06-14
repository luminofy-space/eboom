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
import { NewExpensePaymentModal } from "@/src/views/expenses/components/NewExpensePaymentModal";
import { useWalletDetail } from "../hooks/useWalletDetail";
import type { WalletPayment } from "../utils/utils";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { formatAmount } from "@/src/i18n/formatters";

interface WalletPaymentsTableProps {
  walletId: number;
  walletName?: string;
  currencySymbol?: string;
}

function formatDate(date: string | null | undefined, emDash: string): string {
  if (!date) return emDash;
  return dayjs(date).format("MMM D, YYYY");
}

function getPaymentStatus(payment: WalletPayment, t: TFunction<"wallets">): {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
} {
  if (payment.paidDate) {
    return { label: t("status.paid"), variant: "default" };
  }
  if (payment.dueDate && dayjs(payment.dueDate).isBefore(dayjs(), "day")) {
    return { label: t("status.overdue"), variant: "destructive" };
  }
  if (payment.dueDate && dayjs(payment.dueDate).isAfter(dayjs(), "day")) {
    return { label: t("status.due"), variant: "secondary" };
  }
  return { label: t("status.pending"), variant: "outline" };
}

function sortPayments(payments: WalletPayment[]): WalletPayment[] {
  return [...payments].sort((a, b) => {
    const dateA = a.paidDate ?? a.dueDate ?? a.createdAt;
    const dateB = b.paidDate ?? b.dueDate ?? b.createdAt;
    return dayjs(dateB).valueOf() - dayjs(dateA).valueOf();
  });
}

export function WalletPaymentsTable({
  walletId,
  walletName,
  currencySymbol,
}: WalletPaymentsTableProps) {
  const { t } = useTranslation("wallets");
  const { t: tc } = useTranslation("common");
  const emDash = tc("empty.emDash");
  const [createOpen, setCreateOpen] = useState(false);
  const { payments: paymentsRes, isLoading, isError } = useWalletDetail(walletId);

  const payments = useMemo(
    () => sortPayments(paymentsRes ?? []),
    [paymentsRes]
  );

  const totalPaid = useMemo(
    () =>
      payments
        .filter((p) => p.paidDate)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0),
    [payments]
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
          {t("paymentsTable.loadError")}
        </Typography>
      </Container>
    );
  }

  return (
    <>
      <Container className="pb-6">
        <Stack gap={4}>
        <Stack direction="row" align="center" justify="between" gap={4}>
          <div>
            <Typography variant="heading">{t("paymentsTable.title")}</Typography>
            <Typography variant="muted-sm">
              {t("paymentsTable.subtitle")}
            </Typography>
          </div>
          <Stack direction="row" align="center" gap={3}>
            {payments.length > 0 && (
              <Typography variant="count" className="hidden sm:block">
                {t("paymentsTable.count", {
                  count: payments.length,
                  unit: payments.length === 1 ? tc("plurals.payment") : tc("plurals.payments"),
                })}
              </Typography>
            )}
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              {t("paymentsTable.createPayment")}
            </Button>
          </Stack>
        </Stack>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[140px]">{t("paymentsTable.headers.amount")}</TableHead>
              <TableHead>{t("paymentsTable.headers.expense")}</TableHead>
              <TableHead>{t("paymentsTable.headers.due")}</TableHead>
              <TableHead>{t("paymentsTable.headers.paid")}</TableHead>
              <TableHead>{t("paymentsTable.headers.status")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("paymentsTable.headers.notes")}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <p className="text-muted-foreground">
                    {t("paymentsTable.empty")}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => {
                const status = getPaymentStatus(payment, t);
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium tabular-nums">
                      {formatAmount(payment.amount, currencySymbol, emDash)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{payment.expenseName ?? t("paymentsTable.fallbackExpenseName", { expenseId: payment.expenseId })}</span>
                        {payment.categoryName && (
                          <Typography variant="caption">{payment.categoryName}</Typography>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(payment.dueDate, emDash)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(payment.paidDate, emDash)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                      {payment.notes ? (
                        <span title={payment.notes}>{payment.notes}</span>
                      ) : (
                        <span className="text-muted-foreground">{emDash}</span>
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
                  </TableRow>
                );
              })
            )}
          </TableBody>
          {payments.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold tabular-nums">
                  {formatAmount(totalPaid, currencySymbol, emDash)}
                </TableCell>
                <TableCell colSpan={6} className="text-muted-foreground">
                  {t("paymentsTable.footer.totalPaid")}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
        </Stack>
      </Container>

      <NewExpensePaymentModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        fixedSourceWalletId={walletId}
        walletName={walletName}
        extraInvalidateKeys={[["wallet-payments", walletId], ["wallet", walletId]]}
      />
    </>
  );
}