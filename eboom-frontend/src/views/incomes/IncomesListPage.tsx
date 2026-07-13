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
  ListInfiniteScrollSentinel,
  ListTableSkeleton,
} from "@/src/components/list";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/grid";
import { IllustratedState } from "@/src/components/IllustratedState";
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
    sentinelRef,
    isFetchingNextPage,
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
        <AddIncomeButton
          canEdit={canEdit}
          onClick={() => dispatch(openIncomeCreateModal())}
        />
        <NewIncomeModal />
      </>
    );
  }

  if (items.length === 0 && hasActiveFilters) {
    return (
      <>
        <Container>
          <ListFiltersBar entityType="incomes" />
          <IllustratedState
            illustration="empty"
            size="sm"
            fill={false}
            title={tc("empty.noFilteredResults")}
            className="py-12"
          />
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
          <>
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
              {isFetchingNextPage &&
                Array.from({ length: 4 }).map((_, i) => (
                  <GridCardSkeleton key={`loading-${i}`} />
                ))}
            </Grid>
            {sentinelRef && <ListInfiniteScrollSentinel sentinelRef={sentinelRef} />}
          </>
        )}

        {viewMode === "table" && pagination}
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
