"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/src/redux/store";
import { selectListFilters } from "@/src/redux/searchSlice";
import type { ListQueryFilters } from "@/src/hooks/useInfiniteList";

export function useListQueryFilters(): ListQueryFilters {
  const filters = useAppSelector(selectListFilters);

  return useMemo(
    () => ({
      ...(filters.categoryId !== null && { categoryId: filters.categoryId }),
      ...(filters.currencyId !== null && { currencyId: filters.currencyId }),
      ...(filters.isRecurring !== null && { isRecurring: filters.isRecurring }),
    }),
    [filters]
  );
}
