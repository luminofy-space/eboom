"use client";

import { usePaginatedList } from "@/src/hooks/usePaginatedList";
import { useInfiniteList, type ListQueryFilters } from "@/src/hooks/useInfiniteList";
import { DEFAULT_LIST_PAGE_SIZE } from "@/src/constants/listPagination";
import { useAppSelector } from "@/src/redux/store";
import { selectListPageSize, selectViewMode } from "@/src/redux/searchSlice";

interface UseEntityListOptions {
  queryKey: unknown[];
  enabled?: boolean;
  search?: string;
  filters?: ListQueryFilters;
}

export function useEntityList<T>(baseUrl: string, options: UseEntityListOptions) {
  const viewMode = useAppSelector(selectViewMode);
  const pageSize = useAppSelector(selectListPageSize);
  const isTable = viewMode === "table";
  const listEnabled = options.enabled ?? true;

  const paginated = usePaginatedList<T>(baseUrl, {
    ...options,
    limit: pageSize,
    enabled: listEnabled && isTable,
  });

  const infinite = useInfiniteList<T>(baseUrl, {
    ...options,
    limit: DEFAULT_LIST_PAGE_SIZE,
    enabled: listEnabled && !isTable,
  });

  return {
    items: isTable ? paginated.items : infinite.items,
    isLoading: isTable ? paginated.isLoading : infinite.isLoading,
    isFetching: isTable ? paginated.isFetching : infinite.isFetching,
    total: isTable ? paginated.total : 0,
    page: isTable ? paginated.page : 1,
    pageSize: isTable ? paginated.limit : DEFAULT_LIST_PAGE_SIZE,
    totalPages: isTable ? paginated.totalPages : 1,
    setPage: paginated.setPage,
    refetch: isTable ? paginated.refetch : infinite.refetch,
    sentinelRef: isTable ? undefined : infinite.sentinelRef,
    isFetchingNextPage: isTable ? false : infinite.isFetchingNextPage,
    hasNextPage: isTable ? false : infinite.hasNextPage,
  };
}
