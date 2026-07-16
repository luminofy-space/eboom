"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_LIST_PAGE_SIZE } from "@/src/constants/listPagination";
import { useAppSelector } from "@/src/redux/store";
import { selectListPageSize } from "@/src/redux/searchSlice";

export function useTablePagination<T>(data: T[]) {
  const pageSize = useAppSelector(selectListPageSize);
  const [page, setPage] = useState(1);

  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const paginatedData = useMemo(() => {
    if (total === 0) return [];
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize, total]);

  return {
    page,
    setPage,
    pageSize: total === 0 ? DEFAULT_LIST_PAGE_SIZE : pageSize,
    total,
    totalPages,
    paginatedData,
  };
}
