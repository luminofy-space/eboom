"use client";

import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { useTranslation } from "react-i18next";
import { TransactionsEntriesTable } from "./components/TransactionsEntriesTable";
import { TransactionsPaymentsTable } from "./components/TransactionsPaymentsTable";
import { TransactionsTransfersTable } from "./components/TransactionsTransfersTable";

export default function TransactionsPage() {
  const { t } = useTranslation("transactions");

  return (
    <>
      <Container>
        <Stack gap={2}>
          <Typography variant="display">{t("page.title")}</Typography>
          <Typography variant="muted">{t("page.subtitle")}</Typography>
        </Stack>
      </Container>

      <TransactionsEntriesTable />

      <div className="my-8" />

      <TransactionsTransfersTable />

      <div className="my-8" />

      <TransactionsPaymentsTable />
    </>
  );
}
