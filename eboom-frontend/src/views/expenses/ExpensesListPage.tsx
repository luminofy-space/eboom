"use client";

import API_ROUTES from "@/src/api/urls";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { useInfiniteList } from "@/src/hooks/useInfiniteList";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { selectSearchQuery } from "@/src/redux/searchSlice";
import {
  openExpenseCreateModal,
  openExpenseEditModal,
  type ExpenseItem,
} from "@/src/redux/expenseSlice";
import { useDebouncedValue } from "@mantine/hooks";
import { useMutationApi } from "@/src/api/useMutation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/grid";
import { Stack } from "@/components/ui/stack";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { Plus } from "lucide-react";
import { NewExpenseModal } from "./components/NewExpenseModal";
import { GridCard } from "@/src/components/GridCard";
import { GridCardSkeleton } from "@/src/components/GridCardSkeleton";
import { FloatingAddButton } from "@/src/components/FloatingAddButton";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import { useTranslation } from "react-i18next";

export default function ExpensesListPage() {
  const { t } = useTranslation("expenses");
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
  } = useInfiniteList<ExpenseItem>(
    canvas ? API_ROUTES.CANVASES_EXPENSES_LIST(canvas) : "",
    {
      queryKey: ["expenses", canvas],
      enabled: !!canvas,
      search: debouncedSearch,
    }
  );

  const { mutate: deleteExpense, isPending: isDeleting } = useMutationApi(
    (id: number) => API_ROUTES.EXPENSES_DELETE(canvas!, id),
    {
      method: "delete",
      successKey: "success.expense.deleted",
      onSuccess: () => setDeleteId(null),
    }
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
        <Stack className="flex-1" align="center" justify="center">
          <Card className="w-[375px] py-8">
            <Stack align="center" gap={3}>
              <Typography variant="title" className="text-center">{t("list.empty.title")}</Typography>
              <Typography variant="muted-sm" className="text-center">
                {t("list.empty.description")}
              </Typography>
              {canEdit && (
              <Button className="w-[80%] min-h-[40px]" onClick={() => dispatch(openExpenseCreateModal())}>
                <Plus className="mr-2 h-4 w-4" />
                {tc("actions.add")}
              </Button>
              )}
            </Stack>
          </Card>
        </Stack>
        <NewExpenseModal />
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
          {items.map((expense) => (
            <GridCard
              key={expense.id}
              href={`/expense/${expense.id}`}
              imageUrl={expense.photoUrl}
              title={expense.name}
              updatedAt={expense.lastModifiedAt}
              onEdit={canEdit ? () => dispatch(openExpenseEditModal(expense)) : undefined}
              onDelete={canEdit ? () => setDeleteId(expense.id) : undefined}
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

      {canEdit && <FloatingAddButton onClick={() => dispatch(openExpenseCreateModal())} />}
      <NewExpenseModal />

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={() => { if (deleteId !== null) deleteExpense(deleteId); }}
        isDeleting={isDeleting}
      />
    </>
  );
}
