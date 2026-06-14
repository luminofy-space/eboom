"use client";

import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useMemo } from "react";
import type { WalletEntry, WalletPayment } from "../utils/utils";
import { Wallet } from "@backend/db/schema";

export function useWalletDetail(walletId: number) {
  const { data: walletRes, isLoading: isLoadingWallet, isError: isWalletError } =
    useQueryApi<{
      wallet: Wallet;
    }>(API_ROUTES.WALLETS_GET(walletId), {
      queryKey: ["wallet", walletId],
      enabled: !!walletId,
    });

  const {
    data: entriesRes,
    isLoading: isLoadingEntries,
    isError: isEntriesError,
  } = useQueryApi<{ incomeEntries: WalletEntry[] }>(
    API_ROUTES.WALLET_ENTRIES(walletId),
    {
      queryKey: ["wallet-entries", walletId],
      enabled: !!walletId,
    }
  );

  const {
    data: paymentsRes,
    isLoading: isLoadingPayments,
    isError: isPaymentsError,
  } = useQueryApi<{ expensePayments: WalletPayment[] }>(
    API_ROUTES.WALLET_PAYMENTS(walletId),
    {
      queryKey: ["wallet-payments", walletId],
      enabled: !!walletId,
    }
  );

  const { data: currenciesRes } = useQueryApi<{
    currencies?: { id: number; code: string; symbol: string }[];
  }>(API_ROUTES.CURRENCIES_METADATA, {
    queryKey: ["currencies"],
  });

  const currencySymbol = useMemo(() => {
    // Use the first sub-wallet's currency if available
    if (!currenciesRes?.currencies) return undefined;
    return currenciesRes.currencies[0]?.symbol;
  }, [currenciesRes?.currencies]);

  return {
    wallet: walletRes?.wallet,
    entries: entriesRes?.incomeEntries ?? [],
    payments: paymentsRes?.expensePayments ?? [],
    currencySymbol,
    isLoading: isLoadingWallet || isLoadingEntries || isLoadingPayments,
    isError: isWalletError || isEntriesError || isPaymentsError,
  };
}