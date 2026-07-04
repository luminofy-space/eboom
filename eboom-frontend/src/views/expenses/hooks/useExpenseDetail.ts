"use client";

import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useMemo } from "react";
import type { ExpensePayment } from "../components/ExpensePaymentsTable";

export function useExpenseDetail(expenseId: number) {
  const { canvas } = useCanvas();
  const {
    data: expenseRes,
    isLoading: isLoadingExpense,
    isError: isExpenseError,
  } = useQueryApi<{
    expense: {
      id: number;
      name: string;
      currencyId: number;
      defaultWalletId: number | null;
      defaultWallet?: { id: number; name: string } | null;
      currency?: { id: number; symbol: string } | null;
    };
  }>(canvas ? API_ROUTES.EXPENSES_GET(canvas, expenseId) : "", {
    queryKey: ["expense", canvas, expenseId],
    enabled: !!canvas && !!expenseId,
  });

  const {
    data: paymentsRes,
    isLoading: isLoadingPayments,
    isError: isPaymentsError,
  } = useQueryApi<{ payments: ExpensePayment[] }>(
    canvas ? API_ROUTES.EXPENSE_PAYMENTS_LIST(canvas, expenseId) : "",
    {
      queryKey: ["expense-payments", canvas, expenseId],
      enabled: !!canvas && !!expenseId,
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
