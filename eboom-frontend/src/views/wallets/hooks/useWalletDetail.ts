"use client";

import useQueryApi from "@/src/api/useQuery";
import API_ROUTES from "@/src/api/urls";
import { useMemo } from "react";
import type { WalletEntry, WalletPayment, WalletTransfer } from "../utils/utils";
import { Wallet } from "@backend/db/schema";

interface UseWalletDetailOptions {
  enabled?: boolean;
}

export function useWalletDetail(
  walletId: number,
  options?: UseWalletDetailOptions
) {
  const enabled = (options?.enabled ?? true) && !!walletId;

  const { data: walletRes, isLoading: isLoadingWallet, isError: isWalletError } =
    useQueryApi<{
      wallet: Wallet & {
        subWallets?: Array<{
          currencyId: number;
          amount: string;
          currency?: { id: number; code: string; symbol: string } | null;
        }>;
      };
    }>(API_ROUTES.WALLETS_GET(walletId), {
      queryKey: ["wallet", walletId],
      enabled,
    });

  const {
    data: entriesRes,
    isLoading: isLoadingEntries,
    isError: isEntriesError,
  } = useQueryApi<{ incomeEntries: WalletEntry[] }>(
    API_ROUTES.WALLET_ENTRIES(walletId),
    {
      queryKey: ["wallet-entries", walletId],
      enabled,
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
      enabled,
    }
  );

  const {
    data: transfersRes,
    isLoading: isLoadingTransfers,
    isError: isTransfersError,
  } = useQueryApi<{ transfers: WalletTransfer[] }>(
    API_ROUTES.WALLET_TRANSFERS(walletId),
    {
      queryKey: ["wallet-transfers", walletId],
      enabled,
    }
  );

  const currencySymbol = useMemo(() => {
    const subWallets = walletRes?.wallet?.subWallets ?? [];
    if (subWallets.length > 0) {
      return subWallets[0]?.currency?.symbol;
    }
    return undefined;
  }, [walletRes?.wallet?.subWallets]);

  return {
    wallet: walletRes?.wallet,
    entries: entriesRes?.incomeEntries ?? [],
    payments: paymentsRes?.expensePayments ?? [],
    transfers: transfersRes?.transfers ?? [],
    currencySymbol,
    isLoading: isLoadingWallet || isLoadingEntries || isLoadingPayments || isLoadingTransfers,
    isError: isWalletError || isEntriesError || isPaymentsError || isTransfersError,
  };
}
