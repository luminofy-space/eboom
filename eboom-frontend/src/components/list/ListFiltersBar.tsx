"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stack } from "@/components/ui/stack";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import {
  clearListFilters,
  selectListFilters,
  setListFilter,
} from "@/src/redux/searchSlice";
import { useListFilterOptions, type ListEntityType } from "@/src/hooks/useListFilterOptions";
import { useTranslation } from "react-i18next";

interface ListFiltersBarProps {
  entityType: ListEntityType;
}

export function ListFiltersBar({ entityType }: ListFiltersBarProps) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectListFilters);
  const { t } = useTranslation("common");
  const { categories, currencies, showCurrency, showRecurring } =
    useListFilterOptions(entityType);

  const hasActiveFilters =
    filters.categoryId !== null ||
    filters.currencyId !== null ||
    filters.isRecurring !== null;

  return (
    <Stack direction="row" gap={2} className="mb-4 flex-wrap items-center">
      <Select
        value={filters.categoryId !== null ? String(filters.categoryId) : "all"}
        onValueChange={(value) =>
          dispatch(
            setListFilter({
              key: "categoryId",
              value: value === "all" ? null : parseInt(value, 10),
            })
          )
        }
      >
        <SelectTrigger size="sm" className="min-w-[140px]">
          <SelectValue placeholder={t("list.filters.category")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("list.filters.allCategories")}</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={String(category.id)}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showCurrency && (
        <Select
          value={filters.currencyId !== null ? String(filters.currencyId) : "all"}
          onValueChange={(value) =>
            dispatch(
              setListFilter({
                key: "currencyId",
                value: value === "all" ? null : parseInt(value, 10),
              })
            )
          }
        >
          <SelectTrigger size="sm" className="min-w-[140px]">
            <SelectValue placeholder={t("list.filters.currency")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("list.filters.allCurrencies")}</SelectItem>
            {currencies.map((currency) => (
              <SelectItem key={currency.id} value={String(currency.id)}>
                {currency.code} — {currency.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showRecurring && (
        <Select
          value={
            filters.isRecurring === null
              ? "all"
              : filters.isRecurring
                ? "true"
                : "false"
          }
          onValueChange={(value) =>
            dispatch(
              setListFilter({
                key: "isRecurring",
                value: value === "all" ? null : value === "true",
              })
            )
          }
        >
          <SelectTrigger size="sm" className="min-w-[140px]">
            <SelectValue placeholder={t("list.filters.recurring")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("list.filters.allRecurring")}</SelectItem>
            <SelectItem value="true">{t("list.filters.recurringYes")}</SelectItem>
            <SelectItem value="false">{t("list.filters.recurringNo")}</SelectItem>
          </SelectContent>
        </Select>
      )}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => dispatch(clearListFilters())}
        >
          {t("list.filters.clear")}
        </Button>
      )}
    </Stack>
  );
}
