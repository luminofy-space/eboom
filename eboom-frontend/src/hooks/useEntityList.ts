"use client";

import { usePaginatedList } from "@/src/hooks/usePaginatedList";
import type { ListQueryFilters } from "@/src/hooks/useInfiniteList";
import { useAppSelector } from "@/src/redux/store";
import { selectListPageSize } from "@/src/redux/searchSlice";

interface UseEntityListOptions {
  queryKey: unknown[];
  enabled?: boolean;
  search?: string;
  filters?: ListQueryFilters;
}

export function useEntityList<T>(baseUrl: string, options: UseEntityListOptions) {
  const pageSize = useAppSelector(selectListPageSize);

  const paginated = usePaginatedList<T>(baseUrl, {
    ...options,
    limit: pageSize,
  });

  return {
    items: paginated.items,
    isLoading: paginated.isLoading,
    isFetching: paginated.isFetching,
    total: paginated.total,
    page: paginated.page,
    pageSize: paginated.limit,
    totalPages: paginated.totalPages,
    setPage: paginated.setPage,
    refetch: paginated.refetch,
  };
}
