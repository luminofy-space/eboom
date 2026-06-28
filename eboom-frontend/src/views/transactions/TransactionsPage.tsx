"use client";

import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useTranslation } from "react-i18next";
import { TransactionsEntriesTable } from "./components/TransactionsEntriesTable";
import { TransactionsPaymentsTable } from "./components/TransactionsPaymentsTable";
import { TransactionsTransfersTable } from "./components/TransactionsTransfersTable";
import { useCanvasTransactions } from "./hooks/useCanvasTransactions";

export default function TransactionsPage() {
  const { t } = useTranslation("transactions");
  const { canvas } = useCanvas();
  const { incomeEntries, expensePayments, transfers, isLoading, isError } =
    useCanvasTransactions(canvas);

  if (isError) {
    return (
      <Container>
        <Stack className="h-96" align="center" justify="center">
          <Typography variant="muted-sm">{t("page.loadError")}</Typography>
        </Stack>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        <Stack gap={6}>
          <Stack gap={2}>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </Stack>
          {Array.from({ length: 3 }).map((_, i) => (
            <Stack key={i} gap={4}>
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-64 w-full" />
            </Stack>
          ))}
        </Stack>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Stack gap={2}>
          <Typography variant="display">{t("page.title")}</Typography>
          <Typography variant="muted">{t("page.subtitle")}</Typography>
        </Stack>
      </Container>

      <TransactionsEntriesTable entries={incomeEntries} />

      <div className="my-8" />

      <TransactionsTransfersTable transfers={transfers} />

      <div className="my-8" />

      <TransactionsPaymentsTable payments={expensePayments} />
    </>
  );
}
