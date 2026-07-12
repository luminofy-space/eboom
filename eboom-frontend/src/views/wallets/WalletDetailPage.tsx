"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { formatMoney } from "@/src/i18n/formatters";
import { WalletTransactionChart } from "./components/WalletTransactionChart";
import { WalletEntriesTable } from "./components/WalletEntriesTable";
import { WalletPaymentsTable } from "./components/WalletPaymentTable";
import { WalletTransfersTable } from "./components/WalletTransfersTable";
import { WalletSummaryCards } from "./components/WalletSummaryCards";
import { useWalletDetail } from "./hooks/useWalletDetail";
import {
  filterEntriesByCurrency,
  filterPaymentsByCurrency,
  filterTransfersByCurrency,
  getDefaultWalletCurrencyCode,
} from "./utils/currencyFilter";
import { useTranslation } from "react-i18next";

interface Props {
  id: number;
}

export default function WalletDetailPage({ id }: Props) {
  const { t } = useTranslation("wallets");
  const {
    wallet,
    currencyOptions,
    entries,
    payments,
    transfers,
    getCurrencySymbol,
    isLoading,
    isError,
  } = useWalletDetail(id);

  const [selectedCurrency, setSelectedCurrency] = useState("");

  useEffect(() => {
    if (!currencyOptions.length) {
      setSelectedCurrency("");
      return;
    }
    if (!selectedCurrency || !currencyOptions.some((o) => o.code === selectedCurrency)) {
      setSelectedCurrency(getDefaultWalletCurrencyCode(currencyOptions));
    }
  }, [currencyOptions, selectedCurrency]);

  const currencySymbol = selectedCurrency
    ? getCurrencySymbol(selectedCurrency)
    : undefined;

  const filteredEntries = useMemo(
    () => filterEntriesByCurrency(entries, selectedCurrency || undefined),
    [entries, selectedCurrency]
  );
  const filteredPayments = useMemo(
    () => filterPaymentsByCurrency(payments, selectedCurrency || undefined),
    [payments, selectedCurrency]
  );
  const filteredTransfers = useMemo(
    () => filterTransfersByCurrency(transfers, id, selectedCurrency || undefined),
    [transfers, id, selectedCurrency]
  );

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
              {wallet.description != null && String(wallet.description).length > 0 && (
                <Typography variant="muted">{String(wallet.description)}</Typography>
              )}
            </div>
          )}

          {currencyOptions.length > 0 ? (
            <Stack gap={3}>
              <Typography variant="label">{t("detail.balancesTitle")}</Typography>
              <Stack direction="row" gap={2} className="flex-wrap">
                {currencyOptions.map((option) => (
                  <Badge
                    key={option.code}
                    variant="secondary"
                    className="px-3 py-1.5 text-sm tabular-nums"
                  >
                    {formatMoney(option.balance, option.symbol)} ({option.code})
                  </Badge>
                ))}
              </Stack>
            </Stack>
          ) : !isLoading ? (
            <Typography variant="muted-sm">{t("detail.noBalancesYet")}</Typography>
          ) : null}

          {currencyOptions.length > 0 ? (
            <Stack direction="row" align="center" gap={3} className="flex-wrap">
              <Typography variant="label">{t("detail.currencyFilter")}</Typography>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="w-[140px]" aria-label={t("detail.currencyFilter")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Stack>
          ) : null}
        </Stack>
      </Container>

      <Container>
        <WalletTransactionChart walletId={id} />
      </Container>

      <WalletSummaryCards
        walletId={id}
        entries={filteredEntries}
        payments={filteredPayments}
        transfers={filteredTransfers}
        currencySymbol={currencySymbol}
        isLoading={isLoading}
      />

      <WalletEntriesTable
        walletId={id}
        walletName={wallet?.name}
        currencySymbol={currencySymbol}
        currencyCode={selectedCurrency || undefined}
      />

      <div className="my-8" />

      <WalletTransfersTable
        walletId={id}
        walletName={wallet?.name}
        currencyCode={selectedCurrency || undefined}
      />

      <div className="my-8" />

      <WalletPaymentsTable
        walletId={id}
        walletName={wallet?.name}
        currencySymbol={currencySymbol}
        currencyCode={selectedCurrency || undefined}
      />
    </>
  );
}
