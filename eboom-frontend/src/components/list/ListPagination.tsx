"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { LIST_PAGE_SIZE_OPTIONS, type ListPageSize } from "@/src/constants/listPagination";
import { useAppDispatch } from "@/src/redux/store";
import { setListPageSize } from "@/src/redux/searchSlice";
import { useTranslation } from "react-i18next";

interface ListPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
}

export function ListPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  isFetching = false,
}: ListPaginationProps) {
  const { t } = useTranslation("common");
  const dispatch = useAppDispatch();

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * pageSize, total);

  return (
    <Stack
      direction="row"
      align="center"
      justify="between"
      className="border-t pt-4"
      gap={3}
    >
      <Typography variant="muted-sm">
        {total === 0
          ? t("list.pagination.showingEmpty")
          : t("list.pagination.showing", {
              start: rangeStart,
              end: rangeEnd,
              total,
            })}
      </Typography>

      <Stack direction="row" align="center" gap={2}>
        <Stack direction="row" align="center" gap={2}>
          <Typography variant="muted-sm">{t("list.pagination.pageSize")}</Typography>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => dispatch(setListPageSize(Number(value) as ListPageSize))}
          >
            <SelectTrigger size="sm" className="w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIST_PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Stack>

        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isFetching}
          aria-label={t("list.pagination.previous")}
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </Button>

        <Typography variant="muted-sm">
          {t("list.pagination.pageIndicator", { current: page, total: totalPages })}
        </Typography>

        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isFetching || total === 0}
          aria-label={t("list.pagination.next")}
        >
          <ChevronRight className="size-4 rtl:rotate-180" />
        </Button>
      </Stack>
    </Stack>
  );
}
