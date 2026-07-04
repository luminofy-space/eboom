"use client";

import useQueryApi from "@/src/api/useQuery";
import API_ROUTES from "@/src/api/urls";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useMemo } from "react";
import type { WalletEntry, WalletPayment, WalletTransfer } from "../utils/utils";
import { Wallet } from "@backend/db/schema";

export function useWalletDetail(walletId: number) {
  const { canvas } = useCanvas();
  const { data: walletRes, isLoading: isLoadingWallet, isError: isWalletError } =
    useQueryApi<{
      wallet: Wallet & {
        subWallets?: Array<{
          currencyId: number;
          amount: string;
          currency?: { id: number; code: string; symbol: string } | null;
        }>;
      };
    }>(canvas ? API_ROUTES.WALLETS_GET(canvas, walletId) : "", {
      queryKey: ["wallet", canvas, walletId],
      enabled: !!canvas && !!walletId,
    });

  const {
    data: entriesRes,
    isLoading: isLoadingEntries,
    isError: isEntriesError,
  } = useQueryApi<{ incomeEntries: WalletEntry[] }>(
    canvas ? API_ROUTES.WALLET_ENTRIES(canvas, walletId) : "",
    {
      queryKey: ["wallet-entries", canvas, walletId],
      enabled: !!canvas && !!walletId,
    }
  );

  const {
    data: paymentsRes,
    isLoading: isLoadingPayments,
    isError: isPaymentsError,
  } = useQueryApi<{ expensePayments: WalletPayment[] }>(
    canvas ? API_ROUTES.WALLET_PAYMENTS(canvas, walletId) : "",
    {
      queryKey: ["wallet-payments", canvas, walletId],
      enabled: !!canvas && !!walletId,
    }
  );

  const {
    data: transfersRes,
    isLoading: isLoadingTransfers,
    isError: isTransfersError,
  } = useQueryApi<{ transfers: WalletTransfer[] }>(
    canvas ? API_ROUTES.WALLET_TRANSFERS(canvas, walletId) : "",
    {
      queryKey: ["wallet-transfers", canvas, walletId],
      enabled: !!canvas && !!walletId,
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
