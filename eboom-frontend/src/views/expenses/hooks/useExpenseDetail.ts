"use client";

import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useMemo } from "react";
import type { ExpensePayment } from "../components/ExpensePaymentsTable";

export function useExpenseDetail(expenseId: number) {
  const {
    data: expenseRes,
    isLoading: isLoadingExpense,
    isError: isExpenseError,
  } = useQueryApi<{
    expense: {
      id: number;
      name: string;
      currencyId: number;
      defaultWalletId: number;
      defaultWallet?: { id: number; name: string } | null;
      currency?: { id: number; symbol: string } | null;
    };
  }>(API_ROUTES.EXPENSES_GET(expenseId), {
    queryKey: ["expense", expenseId],
    enabled: !!expenseId,
  });

  const {
    data: paymentsRes,
    isLoading: isLoadingPayments,
    isError: isPaymentsError,
  } = useQueryApi<{ payments: ExpensePayment[] }>(
    API_ROUTES.EXPENSE_PAYMENTS_LIST(expenseId),
    {
      queryKey: ["expense-payments", expenseId],
      enabled: !!expenseId,
    }
  )

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
    isLoading: isLoadingExpense || isLoadingPayments,
    isError: isExpenseError || isPaymentsError,
  };
}
