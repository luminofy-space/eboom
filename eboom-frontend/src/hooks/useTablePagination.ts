"use client";

import { useMemo, useState } from "react";
import { DEFAULT_LIST_PAGE_SIZE } from "@/src/constants/listPagination";
import { useAppSelector } from "@/src/redux/store";
import { selectListPageSize } from "@/src/redux/searchSlice";

export function useTablePagination<T>(data: T[]) {
  const pageSize = useAppSelector(selectListPageSize);
  const [requestedPage, setRequestedPage] = useState(1);

  // pageSize is owned by Redux (changed from outside this hook, e.g. via
  // ListPagination), so we can't intercept it with a wrapped setter here.
  // Instead we use React's supported "adjust state during render" pattern:
  // detect the change synchronously in render and reset requestedPage to 1,
  // which re-renders immediately without an effect round-trip.
  const [prevPageSize, setPrevPageSize] = useState(pageSize);
  if (pageSize !== prevPageSize) {
    setPrevPageSize(pageSize);
    setRequestedPage(1);
  }

  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);

  const paginatedData = useMemo(() => {
    if (total === 0) return [];
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize, total]);

  return {
    page,
    setPage: setRequestedPage,
    pageSize: total === 0 ? DEFAULT_LIST_PAGE_SIZE : pageSize,
    total,
    totalPages,
    paginatedData,
  };
}
