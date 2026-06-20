"use client";

import { WalletTransactionChart } from "./components/WalletTransactionChart";
import { WalletEntriesTable } from "./components/WalletEntriesTable";
import { WalletPaymentsTable } from "./components/WalletPaymentTable";
import { WalletSummaryCards } from "./components/WalletSummaryCards";
import { useWalletDetail } from "./hooks/useWalletDetail";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { useTranslation } from "react-i18next";

interface Props {
  id: number;
}

export default function WalletDetailPage({ id }: Props) {
  const { t } = useTranslation("wallets");
  const { wallet, entries, payments, currencySymbol, isLoading, isError } = useWalletDetail(id);

  if (isError) {
    return (
      <Container>
        <Stack className="h-96" align="center" justify="center">
          <Typography variant="muted-sm">{t("detail.loadError")}</Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Stack gap={4}>
          {wallet && (
            <div>
              <Typography variant="display">{wallet.name}</Typography>
              {wallet.description && (
                <Typography variant="muted">{wallet.description}</Typography>
              )}
            </div>
          )}
        </Stack>
      </Container>

      <Container>
        <WalletTransactionChart walletId={id} />
      </Container>

      <WalletSummaryCards
        entries={entries}
        payments={payments}
        currencySymbol={currencySymbol}
        isLoading={isLoading}
      />

      <WalletEntriesTable walletId={id} walletName={wallet?.name} currencySymbol={currencySymbol} />

      <div className="my-8" />

      <WalletPaymentsTable walletId={id} walletName={wallet?.name} currencySymbol={currencySymbol} />
    </>
  );
}