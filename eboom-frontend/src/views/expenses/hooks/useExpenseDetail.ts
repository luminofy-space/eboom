"use client";

import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useMemo } from "react";
import type { ExpensePayment } from "../components/ExpensePaymentsTable";

export interface ExpenseDetail {
  id: number;
  name: string;
  currencyId: number;
  expenseCategoryId?: number | null;
  defaultWalletId: number | null;
  description?: unknown;
  isRecurring?: boolean;
  recurrencePattern?: unknown;
  photoUrl?: string | null;
  defaultWallet?: { id: number; name: string } | null;
  currency?: { id: number; symbol: string; code?: string; name?: string } | null;
  category?: { id: number; name: string } | null;
}

interface UseExpenseDetailOptions {
  enabled?: boolean;
  skipPayments?: boolean;
}

export function useExpenseDetail(
  expenseId: number,
  options?: UseExpenseDetailOptions
) {
  const { canvas } = useCanvas();
  const enabled = (options?.enabled ?? true) && !!canvas && !!expenseId;
  const skipPayments = options?.skipPayments ?? false;

  const {
    data: expenseRes,
    isLoading: isLoadingExpense,
    isError: isExpenseError,
  } = useQueryApi<{ expense: ExpenseDetail }>(
    canvas ? API_ROUTES.EXPENSES_GET(canvas, expenseId) : "",
    {
      queryKey: ["expense", canvas, expenseId],
      enabled,
    }
  );

  const {
    data: paymentsRes,
    isLoading: isLoadingPayments,
    isError: isPaymentsError,
  } = useQueryApi<{ payments: ExpensePayment[] }>(
    canvas ? API_ROUTES.EXPENSE_PAYMENTS_LIST(canvas, expenseId) : "",
    {
      queryKey: ["expense-payments", canvas, expenseId],
      enabled: enabled && !skipPayments,
    }
  );

  const { data: currenciesRes } = useQueryApi<{
    currencies?: { id: number; code: string; symbol: string }[];
  }>(API_ROUTES.CURRENCIES_METADATA, {
    queryKey: ["currencies"],
  });

  const currencySymbol = useMemo(() => {
    const fromExpense = expenseRes?.expense?.currency?.symbol;
    if (fromExpense) return fromExpense;

    const currencyId = expenseRes?.expense?.currencyId;
    if (!currencyId) return undefined;
    return currenciesRes?.currencies?.find((c) => c.id === currencyId)?.symbol;
  }, [
    expenseRes?.expense?.currency?.symbol,
    expenseRes?.expense?.currencyId,
    currenciesRes?.currencies,
  ]);

  return {
    expense: expenseRes?.expense,
    payments: paymentsRes?.payments ?? [],
    currencySymbol,
    isLoading: isLoadingExpense || (!skipPayments && isLoadingPayments),
    isError: isExpenseError || (!skipPayments && isPaymentsError),
  };
}
