"use client";

import { WalletTransactionChart } from "./components/WalletTransactionChart";
import { WalletEntriesTable } from "./components/WalletEntriesTable";
import { WalletPaymentsTable } from "./components/WalletPaymentTable";
import { WalletSummaryCards } from "./components/WalletSummaryCards";
import { useWalletDetail } from "./hooks/useWalletDetail";

interface Props {
  id: number;
}

export default function WalletDetailPage({ id }: Props) {
  const { wallet, entries, payments, currencySymbol, isLoading, isError } = useWalletDetail(id);

  if (isError) {
    return (
      <div className="flex h-96 items-center justify-center px-4 lg:px-6">
        <p className="text-muted-foreground">Failed to load wallet details. Please try again.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 px-4 lg:px-6">
        {wallet && (
          <div>
            <h1 className="text-3xl font-bold">{wallet.name}</h1>
            {wallet.description && (
              <p className="text-muted-foreground">{wallet.description}</p>
            )}
          </div>
        )}
      </div>

      <div className="px-4 lg:px-6">
        <WalletTransactionChart walletId={id} />
      </div>

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