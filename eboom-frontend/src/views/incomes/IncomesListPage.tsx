"use client";

import API_ROUTES from "@/src/api/urls";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { useEntityList } from "@/src/hooks/useEntityList";
import { useListQueryFilters } from "@/src/hooks/useListQueryFilters";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import {
  selectHasActiveFilters,
  selectSearchQuery,
  selectViewMode,
} from "@/src/redux/searchSlice";
import {
  openIncomeCreateModal,
  openIncomeEditModal,
  type IncomeItem,
} from "@/src/redux/incomeSlice";
import { useDebouncedValue } from "@mantine/hooks";
import { useMutationApi } from "@/src/api/useMutation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NewIncomeModal } from "./component/NewIncomeModal";
import AddIncomeButton from "./component/AddIncomeButton";
import { GridCard } from "@/src/components/GridCard";
import { GridCardSkeleton } from "@/src/components/GridCardSkeleton";
import { FloatingAddButton } from "@/src/components/FloatingAddButton";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import {
  EntityListTable,
  ListFiltersBar,
  ListPagination,
  ListTableSkeleton,
} from "@/src/components/list";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/grid";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { useTranslation } from "react-i18next";


export default function IncomesListPage() {
  const { t: tc } = useTranslation("common");
  const { canvas } = useCanvas();
  const { canEdit } = useCanvasPermissions();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchQuery = useAppSelector(selectSearchQuery);
  const hasActiveFilters = useAppSelector(selectHasActiveFilters);
  const viewMode = useAppSelector(selectViewMode);
  const listFilters = useListQueryFilters();
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const {
    items,
    isLoading,
    isFetching,
    total,
    page,
    pageSize,
    totalPages,
    setPage,
  } = useEntityList<IncomeItem>(
    canvas ? API_ROUTES.CANVASES_INCOMES_LIST(canvas) : "",
    {
      queryKey: ["incomes", canvas],
      enabled: !!canvas,
      search: debouncedSearch,
      filters: listFilters,
    }
  );

  const { mutate: deleteIncome, isPending: isDeleting } = useMutationApi(
    (id: number) => API_ROUTES.INCOMES_DELETE(canvas!, id),
    { method: "delete", successKey: "success.income.deleted", onSuccess: () => setDeleteId(null) }
  );

  const pagination = (
    <ListPagination
      page={page}
      totalPages={totalPages}
      total={total}
      pageSize={pageSize}
      onPageChange={setPage}
      isFetching={isFetching}
    />
  );

  const showLoading = isLoading || (isFetching && items.length === 0);
  const showFiltersBar = items.length > 0 || hasActiveFilters;

  if (showLoading) {
    return (
      <Container>
        {viewMode === "table" ? (
          <ListTableSkeleton columns={6} />
        ) : (
          <Grid variant="cards" gap={4}>
            {Array.from({ length: 8 }).map((_, i) => (
              <GridCardSkeleton key={i} />
            ))}
          </Grid>
        )}
      </Container>
    );
  }

  if (items.length === 0 && !hasActiveFilters) {
    return (
      <>
        {canEdit && <AddIncomeButton onClick={() => dispatch(openIncomeCreateModal())} />}
        <NewIncomeModal />
      </>
    );
  }

  if (items.length === 0 && hasActiveFilters) {
    return (
      <>
        <Container>
          <ListFiltersBar entityType="incomes" />
          <Stack className="flex-1 py-12" align="center" justify="center">
            <Typography variant="muted">{tc("empty.noFilteredResults")}</Typography>
          </Stack>
        </Container>
        <NewIncomeModal />
      </>
    );
  }

  return (
    <>
      <Container>
        {showFiltersBar && <ListFiltersBar entityType="incomes" />}

        {viewMode === "table" ? (
          <EntityListTable
            entityType="incomes"
            items={items}
            canEdit={canEdit}
            onRowClick={(income) => router.push(`/income/${income.id}`)}
            onEdit={canEdit ? (income) => dispatch(openIncomeEditModal(income)) : undefined}
            onDelete={canEdit ? (income) => setDeleteId(income.id) : undefined}
          />
        ) : (
          <Grid variant="cards" gap={4}>
            {items.map((income) => (
              <GridCard
                key={income.id}
                href={`/income/${income.id}`}
                imageUrl={income.photoUrl}
                title={income.name}
                updatedAt={income.lastModifiedAt}
                onEdit={canEdit ? () => dispatch(openIncomeEditModal(income)) : undefined}
                onDelete={canEdit ? () => setDeleteId(income.id) : undefined}
              />
            ))}
          </Grid>
        )}

        {pagination}
      </Container>

      {canEdit && <FloatingAddButton onClick={() => dispatch(openIncomeCreateModal())} />}
      <NewIncomeModal />

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={() => { if (deleteId !== null) deleteIncome(deleteId); }}
        isDeleting={isDeleting}
      />
    </>
  );
}
