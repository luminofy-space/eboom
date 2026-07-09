"use client";

import { LayoutGrid, Table } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import {
  selectViewMode,
  setViewMode,
  type ListViewMode,
} from "@/src/redux/searchSlice";
import { useTranslation } from "react-i18next";

export function ListViewToggle() {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector(selectViewMode);
  const { t } = useTranslation("common");

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={viewMode}
      onValueChange={(value) => {
        if (value) dispatch(setViewMode(value as ListViewMode));
      }}
    >
      <ToggleGroupItem value="grid" aria-label={t("list.view.grid")}>
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="table" aria-label={t("list.view.table")}>
        <Table className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
