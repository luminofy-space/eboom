"use client";

import API_ROUTES from "@/src/api/urls";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { useInfiniteList } from "@/src/hooks/useInfiniteList";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { selectSearchQuery } from "@/src/redux/searchSlice";
import {
  openIncomeCreateModal,
  openIncomeEditModal,
  type IncomeItem,
} from "@/src/redux/incomeSlice";
import { useDebouncedValue } from "@mantine/hooks";
import { useMutationApi } from "@/src/api/useMutation";
import { useState } from "react";
import { NewIncomeModal } from "./component/NewIncomeModal";
import AddIncomeButton from "./component/AddIncomeButton";
import { GridCard } from "@/src/components/GridCard";
import { GridCardSkeleton } from "@/src/components/GridCardSkeleton";
import { FloatingAddButton } from "@/src/components/FloatingAddButton";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/grid";
import { Stack } from "@/components/ui/stack";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { useTranslation } from "react-i18next";


export default function IncomesListPage() {
  const { t: tc } = useTranslation("common");
  const { canvas } = useCanvas();
  const { canEdit } = useCanvasPermissions();
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector(selectSearchQuery);
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const {
    items,
    isLoading,
    isFetching,
    isFetchingNextPage,
    sentinelRef,
  } = useInfiniteList<IncomeItem>(
    canvas ? API_ROUTES.CANVASES_INCOMES_LIST(canvas) : "",
    {
      queryKey: ["incomes", canvas],
      enabled: !!canvas,
      search: debouncedSearch,
    }
  );

  const { mutate: deleteIncome, isPending: isDeleting } = useMutationApi(
    (id: number) => API_ROUTES.INCOMES_DELETE(canvas!, id),
    { method: "delete", successKey: "success.income.deleted", onSuccess: () => setDeleteId(null) }
  );

  const showLoading = isLoading || (isFetching && items.length === 0);

  if (showLoading) {
    return (
      <Container>
        <Grid variant="cards" gap={4}>
          {Array.from({ length: 8 }).map((_, i) => (
            <GridCardSkeleton key={i} />
          ))}
        </Grid>
      </Container>
    );
  }

  if (items.length === 0 && !searchQuery) {
    return (
      <>
        {canEdit && <AddIncomeButton onClick={() => dispatch(openIncomeCreateModal())} />}
        <NewIncomeModal />
      </>
    );
  }

  if (items.length === 0 && searchQuery) {
    return (
      <Stack className="flex-1" align="center" justify="center">
        <Typography variant="muted">{tc("empty.noResults", { query: searchQuery })}</Typography>
      </Stack>
    );
  }

  return (
    <>
      <Container>
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
      </Container>

      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <Stack direction="row" justify="center" className="py-4">
          <Spinner className="size-6 text-muted-foreground" />
        </Stack>
      )}

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
