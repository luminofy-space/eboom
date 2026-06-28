"use client";

import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import type { CanvasTransactions } from "../types";

export function useCanvasTransactions(canvasId: number | null) {
  const { data, isLoading, isError } = useQueryApi<CanvasTransactions>(
    canvasId ? API_ROUTES.CANVAS_TRANSACTIONS(canvasId) : "",
    {
      queryKey: ["canvas-transactions", canvasId],
      enabled: !!canvasId,
      hasToken: true,
    }
  );

  return {
    incomeEntries: data?.incomeEntries ?? [],
    expensePayments: data?.expensePayments ?? [],
    transfers: data?.transfers ?? [],
    total: data?.total ?? { entries: 0, payments: 0, transfers: 0 },
    isLoading,
    isError,
  };
}
