"use client";

import useQueryApi from "@/src/api/useQuery";
import API_ROUTES from "@/src/api/urls";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useMemo } from "react";
import type { WalletEntry, WalletPayment, WalletTransfer } from "../utils/utils";
import {
  getCurrencySymbolForCode,
  getWalletCurrencyOptions,
  type WalletSubWallet,
} from "../utils/currencyFilter";
import type { Wallet } from "@/src/types/common";

interface UseWalletDetailOptions {
  enabled?: boolean;
}

export function useWalletDetail(
  walletId: number,
  options?: UseWalletDetailOptions
) {
  const { canvas } = useCanvas();
  const enabled = (options?.enabled ?? true) && !!canvas && !!walletId;

  const { data: walletRes, isLoading: isLoadingWallet, isError: isWalletError } =
    useQueryApi<{
      wallet: Wallet & {
        subWallets?: WalletSubWallet[];
      };
    }>(canvas ? API_ROUTES.WALLETS_GET(canvas, walletId) : "", {
      queryKey: ["wallet", canvas, walletId],
      enabled,
    });

  const {
    data: entriesRes,
    isLoading: isLoadingEntries,
    isError: isEntriesError,
  } = useQueryApi<{ incomeEntries: WalletEntry[] }>(
    canvas ? API_ROUTES.WALLET_ENTRIES(canvas, walletId) : "",
    {
      queryKey: ["wallet-entries", canvas, walletId],
      enabled,
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
      enabled,
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
      enabled,
    }
  );

  const entries = entriesRes?.incomeEntries ?? [];
  const payments = paymentsRes?.expensePayments ?? [];
  const subWallets = walletRes?.wallet?.subWallets;

  const currencyOptions = useMemo(
    () => getWalletCurrencyOptions(subWallets),
    [subWallets]
  );

  const getCurrencySymbol = useMemo(
    () => (code: string) =>
      getCurrencySymbolForCode(code, currencyOptions, entries, payments),
    [currencyOptions, entries, payments]
  );

  return {
    wallet: walletRes?.wallet,
    subWallets,
    currencyOptions,
    entries,
    payments,
    transfers: transfersRes?.transfers ?? [],
    getCurrencySymbol,
    isLoading: isLoadingWallet || isLoadingEntries || isLoadingPayments || isLoadingTransfers,
    isError: isWalletError || isEntriesError || isPaymentsError || isTransfersError,
  };
}
